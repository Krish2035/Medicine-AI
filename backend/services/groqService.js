import Groq from 'groq-sdk';
import { findRelevantMedicines } from './localRagService.js';
import { getGroqKeys } from './keyManager.js';

// Top models supported by Groq with priority order
const DEFAULT_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant'
];

export async function askGroqAI({ message, language = 'gu', apiKey, model }) {
  const allKeys = getGroqKeys();
  const candidateKeys = apiKey ? [apiKey, ...allKeys.filter(k => k !== apiKey)] : (allKeys.length > 0 ? allKeys : []);

  if (candidateKeys.length === 0) {
    throw new Error('Groq API Key is missing. Please provide GROQ_API_KEY in backend .env');
  }

  // Retrieve relevant grounded medicines from the 150-item database
  const matchedMedicines = findRelevantMedicines(message, 5);

  const medicinesContext = matchedMedicines.map(m => (
    `ID: ${m.id} | Name: ${m.name} | Category: ${m.category} | Raw: ${m.indication_raw}
     Gujarati Indication: ${m.description_gu} | Symptoms (GU): ${m.symptoms_gu.join(', ')}
     Symptoms (EN): ${m.symptoms_en.join(', ')} | Symptoms (HI): ${m.symptoms_hi.join(', ')}
     Form: ${m.form} | Dosage Advice: ${m.dosage_advice_gu} | Precautions: ${m.precautions_gu}
     Prescription Required: ${m.prescription_required ? 'Yes (ડૉક્ટરની સલાહ ફરજિયાત)' : 'No (સામાન્ય OTC)'}`
  )).join('\n\n');

  const systemPrompt = `You are "Medicine AI" (મેડિસિન AI), an empathetic, highly knowledgeable medical assistant specializing in Gujarati and English consultations.
The user is describing their health issues or body symptoms.

CRITICAL INSTRUCTIONS:
1. Primary Output Language: ${language === 'gu' ? 'Gujarati (ગુજરાતી) with clear, respectful, and standard terminology' : 'English with clear medical and patient-friendly explanations'}.
2. Always ground your primary recommendations on the verified medicines provided below from our medical emergency dataset.
3. If user asks in Gujarati or asks for body issues like headache (માથાનો દુખાવો), fever (તાવ), acidity (એસિડિટી), vomiting (ઉલટી), cold (શરદી), fungal rash (ધાધર), etc., address them with utmost clarity and empathy in Gujarati.
4. Structure your response:
   - Sympathetic greeting and assessment of the symptom.
   - Recommended medication(s) from the matched list (include medicine name, how it works in Gujarati, dosage form, and how to take it).
   - Important precautions and contraindications (e.g. food intake, avoid driving, pregnancy caution).
   - Home care / lifestyle relief tips (hydration, diet, rest).
   - Clear Medical Disclaimer: Remind them that this AI is for information and emergency awareness only, and they must consult a licensed doctor for personalized diagnosis.
5. If antibiotics or prescription-only drugs are mentioned (like Amoxicillin, Ciprofloxacin, Linezolid, Azithromycin), strictly warn that they MUST have a doctor's prescription and complete the course.

VERIFIED MEDICINE DATA FOR THIS USER QUERY:
${medicinesContext || 'No direct match in the top list. Use safe general medical guidelines and mention nearest primary care.'}`;

  // Candidate models to try
  const modelsToTry = model ? [model, ...DEFAULT_MODELS.filter(m => m !== model)] : DEFAULT_MODELS;

  let lastError = null;

  // Try across keys and models with automatic rotation and failover
  for (let k = 0; k < candidateKeys.length; k++) {
    const currentKey = candidateKeys[k];
    const groq = new Groq({ apiKey: currentKey });

    for (let m = 0; m < modelsToTry.length; m++) {
      const currentModel = modelsToTry[m];
      try {
        const completion = await groq.chat.completions.create({
          model: currentModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.3,
          max_tokens: 1024
        });

        const reply = completion.choices[0]?.message?.content || 'માફ કરશો, જવાબ પ્રાપ્ત થઈ શક્યો નથી.';
        return {
          reply,
          matchedMedicines,
          provider: 'groq',
          model: currentModel,
          keyUsed: `${currentKey.slice(0, 6)}...${currentKey.slice(-4)}`
        };
      } catch (err) {
        // If model not found, try next model with same key
        if (err.message && err.message.includes('model_not_found')) {
          continue;
        }
        // If rate limit or auth error, failover to next key
        lastError = err;
        break;
      }
    }
  }

  throw lastError || new Error('All Groq API keys and models failed');
}
