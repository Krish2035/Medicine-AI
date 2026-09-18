import express from 'express';
import { getAllMedicines, getMedicineById, generateLocalRagResponse } from '../services/localRagService.js';
import { askGroqAI } from '../services/groqService.js';
import { askHuggingFaceAI } from '../services/huggingFaceService.js';
import { getKeyStats } from '../services/keyManager.js';

const router = express.Router();

/**
 * Status check with multi-key pool inspection
 */
router.get('/status', (req, res) => {
  const stats = getKeyStats();
  const totalMedicines = getAllMedicines().length;

  res.json({
    status: 'online',
    totalMedicines,
    keysConfigured: {
      groq: stats.groq.hasKeys,
      groqCount: stats.groq.count,
      groqPreview: stats.groq.preview,
      huggingface: stats.huggingface.hasKeys,
      hfCount: stats.huggingface.count,
      hfPreview: stats.huggingface.preview
    },
    defaultProvider: stats.groq.hasKeys ? 'groq' : (stats.huggingface.hasKeys ? 'huggingface' : 'local-rag')
  });
});

/**
 * Get all medicines with optional search and category filter
 */
router.get('/medicines', (req, res) => {
  const { search, category } = req.query;
  let list = getAllMedicines();

  if (category && category !== 'all') {
    list = list.filter(m => m.category_key === category || m.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(m => {
      const matchName = m.name.toLowerCase().includes(q);
      const matchRaw = (m.indication_raw || '').toLowerCase().includes(q);
      const matchDescGu = (m.description_gu || '').toLowerCase().includes(q);
      const matchDescEn = (m.description_en || '').toLowerCase().includes(q);
      const matchGuSym = (m.symptoms_gu || []).some(s => s.toLowerCase().includes(q));
      const matchEnSym = (m.symptoms_en || []).some(s => s.toLowerCase().includes(q));
      const matchHiSym = (m.symptoms_hi || []).some(s => s.toLowerCase().includes(q));

      return matchName || matchRaw || matchDescGu || matchDescEn || matchGuSym || matchEnSym || matchHiSym;
    });
  }

  res.json({
    count: list.length,
    medicines: list
  });
});

/**
 * Get single medicine by ID
 */
router.get('/medicines/:id', (req, res) => {
  const med = getMedicineById(req.params.id);
  if (!med) {
    return res.status(404).json({ error: 'Medicine not found' });
  }
  res.json(med);
});

/**
 * Chat endpoint with Multi-Key Groq / HuggingFace failover and Local RAG fallback
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, language = 'gu', provider, apiKey, model } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const stats = getKeyStats();
    const selectedProvider = provider || (stats.groq.hasKeys ? 'groq' : (stats.huggingface.hasKeys ? 'huggingface' : 'local-rag'));

    // Try Groq AI
    if (selectedProvider === 'groq' || stats.groq.hasKeys) {
      try {
        const result = await askGroqAI({ message, language, apiKey, model });
        return res.json({
          ...result,
          provider: 'groq'
        });
      } catch (groqErr) {
        console.warn('All Groq keys failed or rate-limited, checking HF or Local RAG:', groqErr.message);
        
        // If HF is available, try HF failover before falling back to Local RAG
        if (stats.huggingface.hasKeys) {
          try {
            const hfResult = await askHuggingFaceAI({ message, language, apiKey, model });
            return res.json({
              ...hfResult,
              provider: 'huggingface (Groq Failover)'
            });
          } catch (hfErr) {
            console.warn('HF also failed:', hfErr.message);
          }
        }

        const fallback = generateLocalRagResponse(message, language);
        return res.json({
          ...fallback,
          provider: 'local-rag (Failover: ' + groqErr.message + ')',
          fallbackReason: groqErr.message
        });
      }
    }

    // Try Hugging Face AI
    if (selectedProvider === 'huggingface' && stats.huggingface.hasKeys) {
      try {
        const result = await askHuggingFaceAI({ message, language, apiKey, model });
        return res.json({
          ...result,
          provider: 'huggingface'
        });
      } catch (hfErr) {
        console.warn('Hugging Face failed, falling back to Local RAG:', hfErr.message);
        const fallback = generateLocalRagResponse(message, language);
        return res.json({
          ...fallback,
          provider: 'local-rag (HF Failover: ' + hfErr.message + ')',
          fallbackReason: hfErr.message
        });
      }
    }

    // Default: Local RAG (Offline, grounded on 150-medicine dataset)
    const localResult = generateLocalRagResponse(message, language);
    return res.json({
      ...localResult,
      provider: 'local-rag'
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  }
});

export default router;
