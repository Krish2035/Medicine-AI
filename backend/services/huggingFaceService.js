import { findRelevantMedicines } from './localRagService.js';
import { getHfKeys } from './keyManager.js';

export async function askHuggingFaceAI({ message, language = 'gu', apiKey, model = 'meta-llama/Llama-3.3-70B-Instruct' }) {
  const allKeys = getHfKeys();
  const candidateKeys = apiKey ? [apiKey, ...allKeys.filter(k => k !== apiKey)] : (allKeys.length > 0 ? allKeys : []);

  if (candidateKeys.length === 0) {
    throw new Error('Hugging Face API Key is missing. Please provide HUGGINGFACE_API_KEY in backend .env');
  }

  const matchedMedicines = findRelevantMedicines(message, 5);

  const medicinesContext = matchedMedicines.map(m => (
    `ID: ${m.id} | Name: ${m.name} | Raw Indication: ${m.indication_raw}
     Gujarati Indication: ${m.description_gu} | Symptoms (GU): ${m.symptoms_gu.join(', ')}
     Form: ${m.form} | Dosage: ${m.dosage_advice_gu} | Caution: ${m.precautions_gu}
     Prescription: ${m.prescription_required ? 'Doctor Prescription Required' : 'OTC'}`
  )).join('\n\n');

  const systemPrompt = `You are "Medicine AI" (મેડિસિન AI), an empathetic medical assistant providing guidance in ${language === 'gu' ? 'Gujarati (ગુજરાતી)' : 'English'}.
Base your answers on this verified 150-medicine list:
${medicinesContext}

Instructions:
- Provide medicine recommendation, usage advice, precautions, and a clear medical disclaimer that this is informational and not a replacement for a doctor.
- Answer clearly in ${language === 'gu' ? 'Gujarati' : 'English'}.`;

  let lastError = null;

  for (let i = 0; i < candidateKeys.length; i++) {
    const currentKey = candidateKeys[i];
    try {
      // Hugging Face router OpenAI-compatible chat endpoint
      const url = 'https://router.huggingface.co/hf-inference/v1/chat/completions';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        // Also try fallback endpoint
        const altUrl = `https://api-inference.huggingface.co/models/${model}`;
        const altResponse = await fetch(altUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: `${systemPrompt}\n\nUser Question: ${message}\nAssistant:`,
            parameters: { max_new_tokens: 500, temperature: 0.3 }
          })
        });

        if (!altResponse.ok) {
          throw new Error(`HF error: ${response.status} - ${errText}`);
        }

        const altData = await altResponse.json();
        let reply = '';
        if (Array.isArray(altData) && altData[0]?.generated_text) {
          reply = altData[0].generated_text.replace(`${systemPrompt}\n\nUser Question: ${message}\nAssistant:`, '').trim();
        } else {
          reply = JSON.stringify(altData);
        }
        return {
          reply,
          matchedMedicines,
          provider: 'huggingface',
          model,
          keyUsed: `${currentKey.slice(0, 6)}...${currentKey.slice(-4)}`
        };
      }

      const data = await response.json();
      const reply = data.choices[0]?.message?.content || 'માફ કરશો, જવાબ પ્રાપ્ત થઈ શક્યો નથી.';
      return {
        reply,
        matchedMedicines,
        provider: 'huggingface',
        model,
        keyUsed: `${currentKey.slice(0, 6)}...${currentKey.slice(-4)}`
      };
    } catch (err) {
      console.warn(`Hugging Face key #${i + 1} (${currentKey.slice(0, 6)}...) failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Hugging Face API keys failed');
}
