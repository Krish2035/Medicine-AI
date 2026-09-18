import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the 150 medicines dataset
const medicinesPath = path.join(__dirname, '..', 'data', 'medicines.json');
let medicines = [];

try {
  const rawData = fs.readFileSync(medicinesPath, 'utf8');
  medicines = JSON.parse(rawData);
} catch (err) {
  console.error('Error reading medicines.json:', err);
}

// Symptom synonyms mapping for Gujarati, Hindi, English
const symptomAliases = {
  // Head / Fever
  "માથું": ["માથાનો દુખાવો", "fever", "headache", "bukhar", "sir dard"],
  "માથાનો": ["headache", "migraine", "pain"],
  "તાવ": ["fever", "bukhar", "body ache", "paracetamol"],
  "શરદી": ["cold", "sardi", "chheenk", "cough", "runny nose", "allergy"],
  "છીંક": ["sneezing", "allergy", "chheenk"],
  "ઉધરસ": ["cough", "khansi", "phlegm", "mucus"],
  "કફ": ["cough", "phlegm", "balgam", "chest congestion"],
  
  // Stomach / Digestion
  "પેટ": ["stomach", "pet", "gas", "acidity", "loose motion", "pain"],
  "એસિડિટી": ["acidity", "gas", "heartburn", "jalan", "acid reflux"],
  "ગેસ": ["gas", "bloating", "acidity", "pet dard"],
  "ઉલટી": ["vomiting", "nausea", "matli", "ulti"],
  "ઝાડા": ["loose motion", "diarrhea", "dast", "pet infection"],
  "બળતરા": ["burning", "jalan", "acidity"],
  "કરમિયા": ["worms", "keede", "deworming"],

  // Skin / Allergy
  "ખંજવાળ": ["itching", "khujli", "allergy", "fungal infection"],
  "ધાધર": ["ringworm", "fungal", "tinea", "daadh"],
  "ખીલ": ["pimples", "acne", "muhase"],
  "ચામડી": ["skin", "allergy", "rash"],
  "દાઝી": ["burns", "jalne par"],
  "વાગવું": ["wound", "zakhm", "chot", "injury", "cuts"],

  // Heart / BP / Diabetes
  "બીપી": ["high BP", "hypertension", "blood pressure"],
  "હૃદય": ["heart", "cardiac", "chest pain", "angina"],
  "છાતી": ["chest", "chest pain", "angina", "lungs", "cough"],
  "સુગર": ["diabetes", "sugar", "insulin"],
  "ડાયાબિટીસ": ["diabetes", "high blood sugar", "sugar"],
  "સાંધા": ["joint pain", "jod dard", "arthritis", "knee pain"],
  "કમર": ["back pain", "kamar dard", "muscle spasm"],
  "ઊંઘ": ["insomnia", "neend", "anxiety", "stress"],
  "ચિંતા": ["anxiety", "depression", "tension"]
};

/**
 * Searches and scores medicines based on user message
 */
export function findRelevantMedicines(query, limit = 5) {
  if (!query || typeof query !== 'string') return [];
  const cleanQuery = query.toLowerCase().trim();
  const queryTokens = cleanQuery.split(/[\s,?.!+=/\\-]+/).filter(t => t.length > 1);

  // Expand tokens with aliases
  const expandedTerms = new Set(queryTokens);
  for (const [key, aliases] of Object.entries(symptomAliases)) {
    if (cleanQuery.includes(key.toLowerCase())) {
      aliases.forEach(a => expandedTerms.add(a.toLowerCase()));
    }
  }

  const scored = medicines.map(med => {
    let score = 0;
    const nameLower = med.name.toLowerCase();
    const indLower = (med.indication_raw || '').toLowerCase();
    const catLower = (med.category || '').toLowerCase();
    const descGu = (med.description_gu || '').toLowerCase();
    const descEn = (med.description_en || '').toLowerCase();

    // Check exact name match
    if (cleanQuery.includes(nameLower)) score += 50;

    // Check exact raw indication
    if (cleanQuery.includes(indLower)) score += 30;

    // Check Gujarati symptoms match
    if (med.symptoms_gu) {
      med.symptoms_gu.forEach(sym => {
        const sLower = sym.toLowerCase();
        if (cleanQuery.includes(sLower)) score += 25;
        for (const term of expandedTerms) {
          if (sLower.includes(term)) score += 15;
        }
      });
    }

    // Check English symptoms match
    if (med.symptoms_en) {
      med.symptoms_en.forEach(sym => {
        const sLower = sym.toLowerCase();
        if (cleanQuery.includes(sLower)) score += 20;
        for (const term of expandedTerms) {
          if (sLower.includes(term)) score += 12;
        }
      });
    }

    // Check Hindi symptoms match
    if (med.symptoms_hi) {
      med.symptoms_hi.forEach(sym => {
        const sLower = sym.toLowerCase();
        if (cleanQuery.includes(sLower)) score += 20;
        for (const term of expandedTerms) {
          if (sLower.includes(term)) score += 10;
        }
      });
    }

    // Descriptions
    for (const term of expandedTerms) {
      if (descGu.includes(term)) score += 8;
      if (descEn.includes(term)) score += 6;
      if (catLower.includes(term)) score += 5;
    }

    return { ...med, relevanceScore: score };
  });

  const matched = scored
    .filter(m => m.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  return matched;
}

/**
 * Generate a conversational response using Local RAG
 */
export function generateLocalRagResponse(query, language = 'gu') {
  const matched = findRelevantMedicines(query, 4);

  if (matched.length === 0) {
    if (language === 'gu') {
      return {
        reply: `નમસ્તે! તમારા પ્રશ્નનું વિશ્લેષણ કરતાં અમને ચોક્કસ મેળ ખાતી દવા અમારા તાત્કાલિક ડેટાબેઝમાંથી મળી નથી. \n\nકૃપા કરીને તમારા લક્ષણો વધુ વિગતવાર જણાવો (દા.ત. **માથાનો દુખાવો**, **તાવ**, **શરદી-ઉધરસ**, **એસિડિટી**, **પેટમાં દુખાવો**, **ઝાડા**, અથવા **ખંજવાળ**). \n\n⚠️ *મહત્વપૂર્ણ ચેતવણી: જો તમને ગંભીર તકલીફ અથવા ઇમરજન્સી હોય, તો તાત્કાલિક નજીકના ડૉક્ટરનો સંપર્ક કરવો.*`,
        matchedMedicines: []
      };
    } else {
      return {
        reply: `Hello! Based on your query, we couldn't find an exact match in our 150-medicine emergency database. \n\nPlease describe your symptoms in more detail (e.g., **headache**, **fever**, **cough/cold**, **acidity**, **stomach ache**, **loose motion**, or **skin itching**).\n\n⚠️ *Important Notice: If you are experiencing severe distress or an emergency, please consult a registered medical professional immediately.*`,
        matchedMedicines: []
      };
    }
  }

  // Build structured response
  if (language === 'gu') {
    let reply = `તમારા લક્ષણોનું વિશ્લેષણ કરીને મેડિકલ ડેટાબેઝમાંથી નીચે મુજબની દવાઓ અને માર્ગદર્શન મળી આવ્યું છે:\n\n`;

    matched.forEach((med, idx) => {
      reply += `### ${idx + 1}. **${med.name}** (${med.form})\n`;
      reply += `- **મુખ્ય ઉપયોગ:** ${med.description_gu}\n`;
      reply += `- **સૂચક લક્ષણો:** ${med.symptoms_gu.join(', ')}\n`;
      reply += `- **સેવન કરવાની રીત:** ${med.dosage_advice_gu}\n`;
      reply += `- **સાવચેતી:** ${med.precautions_gu}\n`;
      if (med.prescription_required) {
        reply += `- ⚠️ *આ દવા ડૉક્ટરના પ્રિસ્ક્રિપ્શન (કાગળ) વિના લેવી નહીં.*\n\n`;
      } else {
        reply += `- ℹ️ *સામાન્ય OTC દવા છે, છતાં યોગ્ય માત્રાનું ધ્યાન રાખવું.*\n\n`;
      }
    });

    reply += `\n**ઘરેલું કાળજી અને સલાહ:**\n`;
    reply += `- પૂરતું પાણી પીવો અને આરામ કરો.\n`;
    reply += `- તેલવાળો અને ભારે ખોરાક ટાળો.\n`;
    reply += `- **નોંધ:** આ માહિતી માત્ર પ્રાથમિક જાણકારી માટે છે. દવા શરૂ કરતાં પહેલાં અથવા જો લક્ષણો ૨૪-૪૮ કલાકમાં ન શમે તો નજીકના યોગ્ય એમ.ડી. / એમ.બી.બી.એસ. ડૉક્ટરની સલાહ અચૂક લેવી.`;

    return { reply, matchedMedicines: matched };
  } else {
    let reply = `Based on your symptoms, here are the most relevant medications and clinical guidelines from our database:\n\n`;

    matched.forEach((med, idx) => {
      reply += `### ${idx + 1}. **${med.name}** (${med.form})\n`;
      reply += `- **Primary Use:** ${med.description_en}\n`;
      reply += `- **Symptoms:** ${med.symptoms_en.join(', ')}\n`;
      reply += `- **Dosage Guidance:** ${med.dosage_advice_gu}\n`;
      reply += `- **Precaution:** ${med.precautions_gu}\n`;
      if (med.prescription_required) {
        reply += `- ⚠️ *Requires Doctor's Prescription before intake.*\n\n`;
      } else {
        reply += `- ℹ️ *Over-the-counter option, adhere to recommended dose.*\n\n`;
      }
    });

    reply += `\n**General Supportive Care:**\n`;
    reply += `- Stay well-hydrated and get adequate rest.\n`;
    reply += `- Avoid spicy, oily, or heavy meals.\n`;
    reply += `- **Medical Disclaimer:** This is for informational guidance only. Always consult a certified physician before starting any medication, especially if symptoms persist beyond 24-48 hours.`;

    return { reply, matchedMedicines: matched };
  }
}

export function getAllMedicines() {
  return medicines;
}

export function getMedicineById(id) {
  const numId = parseInt(id, 10);
  return medicines.find(m => m.id === numId);
}
