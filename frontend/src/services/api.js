import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://news-deduction.onrender.com'
    : 'http://127.0.0.1:8000'
);

export const getApiBaseUrl = () => API_BASE_URL;

// Storage keys for client-side API configuration
const STORAGE_KEY_AI_PROVIDER = 'truthshield_ai_provider';
const STORAGE_KEY_API_KEY = 'truthshield_api_key';
const STORAGE_KEY_AUTH_TOKEN = 'truthshield_auth_token';

export const getStoredAiConfig = () => {
  return {
    provider: localStorage.getItem(STORAGE_KEY_AI_PROVIDER) || 'auto',
    apiKey: localStorage.getItem(STORAGE_KEY_API_KEY) || '',
  };
};

export const setStoredAiConfig = (provider, apiKey) => {
  if (provider) localStorage.setItem(STORAGE_KEY_AI_PROVIDER, provider);
  if (apiKey !== undefined) localStorage.setItem(STORAGE_KEY_API_KEY, apiKey.trim());
};

export const clearStoredAiConfig = () => {
  localStorage.removeItem(STORAGE_KEY_AI_PROVIDER);
  localStorage.removeItem(STORAGE_KEY_API_KEY);
};

export const getAuthToken = () => {
  return localStorage.getItem(STORAGE_KEY_AUTH_TOKEN) || null;
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
};

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000,
});

// Request interceptor to automatically attach custom AI key, provider, and Bearer auth token
client.interceptors.request.use((config) => {
  const { provider, apiKey } = getStoredAiConfig();
  if (provider && provider !== 'auto') {
    config.headers['X-AI-Provider'] = provider;
  }
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  const token = getAuthToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Helper to extract clean error message from FastAPI responses
export const formatApiError = (error) => {
  if (error.response) {
    const data = error.response.data;
    if (data?.detail) {
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) {
        return data.detail.map(d => `${d.loc?.slice(-1)[0] || 'field'}: ${d.msg}`).join(', ');
      }
    }
    if (data?.message) return data.message;
    return `Server error (${error.response.status}): ${error.response.statusText}`;
  } else if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
    return 'Processing took too long and timed out. Please try with a smaller document or section.';
  } else if (error.request || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Backend server is unreachable on port 8000. Please ensure the backend is running (e.g., uvicorn app.main:app --reload).';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
};

export const api = {
  checkHealth: async () => {
    const res = await client.get('/api/health');
    return res.data;
  },

  getAiStatus: async () => {
    const res = await client.get('/api/config/ai-status');
    return res.data;
  },

  testApiKey: async (provider, apiKey) => {
    const res = await client.post('/api/config/test-key', {
      provider,
      api_key: apiKey,
    });
    return res.data;
  },

  analyzeText: async (text, sourceHint = null) => {
    try {
      const { provider, apiKey } = getStoredAiConfig();
      const payload = {
        text,
        source_hint: sourceHint,
        ai_provider: provider && provider !== 'auto' ? provider : undefined,
        api_key: apiKey || undefined,
      };
      const res = await client.post('/api/analyze/text', payload);
      return { data: res.data, isLive: true };
    } catch (error) {
      throw error;
    }
  },

  analyzeUrl: async (url) => {
    try {
      const { provider, apiKey } = getStoredAiConfig();
      const payload = {
        url,
        ai_provider: provider && provider !== 'auto' ? provider : undefined,
        api_key: apiKey || undefined,
      };
      const res = await client.post('/api/analyze/url', payload);
      return { data: res.data, isLive: true };
    } catch (error) {
      throw error;
    }
  },

  analyzeImage: async (formData) => {
    try {
      const { provider, apiKey } = getStoredAiConfig();
      if (provider && provider !== 'auto') formData.append('ai_provider', provider);
      if (apiKey) formData.append('api_key', apiKey);
      const res = await client.post('/api/analyze/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { data: res.data, isLive: true };
    } catch (error) {
      throw error;
    }
  },

  getResult: async (id) => {
    const res = await client.get(`/api/results/${id}`);
    return res.data;
  },

  getHistory: async (limit = 20, offset = 0) => {
    const res = await client.get('/api/history', { params: { limit, offset } });
    return res.data;
  },

  getStats: async () => {
    const res = await client.get('/api/stats');
    return res.data;
  },

  submitFeedback: async (feedback) => {
    const res = await client.post('/api/feedback', feedback);
    return res.data;
  },

  submitReport: async (report) => {
    const res = await client.post('/api/report', report);
    return res.data;
  },

  // --- Conversational Human-like AI (Gemini / ChatGPT style) ---
  sendChatMessage: async (message, conversationHistory = [], customConfig = {}, language = 'en') => {
    const { provider, apiKey } = getStoredAiConfig();
    const payload = {
      message,
      conversation_history: conversationHistory,
      ai_provider: customConfig.provider || (provider && provider !== 'auto' ? provider : undefined),
      api_key: customConfig.apiKey || apiKey || undefined,
      language: language || 'en',
    };
    const res = await client.post('/api/chat', payload);
    return res.data;
  },

  // --- Authentication & User Operations ---
  sendOtp: async (email, purpose = 'register') => {
    const res = await client.post('/api/auth/send-otp', { email, purpose });
    return res.data;
  },

  registerWithOtp: async (name, email, password, otp) => {
    const res = await client.post('/api/auth/register-with-otp', { name, email, password, otp });
    return res.data;
  },

  loginWithOtp: async (email, otp) => {
    const res = await client.post('/api/auth/login-with-otp', { email, otp });
    return res.data;
  },

  register: async (name, email, password) => {
    const res = await client.post('/api/auth/register', { name, email, password });
    return res.data;
  },

  login: async (email, password) => {
    const res = await client.post('/api/auth/login', { email, password });
    return res.data;
  },

  getMe: async () => {
    const res = await client.get('/api/auth/me');
    return res.data;
  },

  getUserProfile: async () => {
    const res = await client.get('/api/user/profile');
    return res.data;
  },

  getUserHistory: async (limit = 20, offset = 0) => {
    const res = await client.get('/api/user/history', { params: { limit, offset } });
    return res.data;
  },

  // --- Admin Console Operations ---
  getAdminStats: async () => {
    const res = await client.get('/api/admin/stats');
    return res.data;
  },

  getAdminUsers: async () => {
    const res = await client.get('/api/admin/users');
    return res.data;
  },

  updateUserRole: async (userId, data) => {
    const res = await client.put(`/api/admin/users/${userId}/role`, data);
    return res.data;
  },

  getAdminClaims: async (limit = 50, offset = 0) => {
    const res = await client.get('/api/admin/claims', { params: { limit, offset } });
    return res.data;
  },

  // --- OmniVoice Multilingual Speech Engine ---
  getOmniVoiceStatus: async () => {
    const res = await client.get('/api/omnivoice/status');
    return res.data;
  },

  getOmniVoiceLanguages: async () => {
    const res = await client.get('/api/omnivoice/languages');
    return res.data;
  },

  synthesizeSpeech: async (payload) => {
    const res = await client.post('/api/omnivoice/synthesize', payload);
    return res.data;
  },

  generateReportAudio: async (payload) => {
    const res = await client.post('/api/omnivoice/report-audio', payload);
    return res.data;
  },

  transcribeAudio: async (audioBlob, lang = 'en') => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice_input.webm');
    formData.append('lang', lang);
    const res = await client.post('/api/omnivoice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // --- Document Text Extraction (PDF, DOCX, TXT, MD, CSV, JSON) ---
  extractDocumentText: async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();

    // Fast client-side reading for text-based formats (instant, works 100% offline)
    if (['txt', 'md', 'json', 'csv'].includes(ext)) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result || '';
          resolve({
            status: 'success',
            filename: file.name,
            file_type: ext,
            pages: 1,
            char_count: content.length,
            word_count: content.trim().split(/\s+/).filter(Boolean).length,
            extracted_text: content,
          });
        };
        reader.onerror = () => reject(new Error('Failed to read text file.'));
        reader.readAsText(file);
      });
    }

    // For PDF and DOCX, process via server-side pypdf / python-docx engine
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/api/translate/extract-doc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return res.data;
  },

  // --- Multilingual Translation Engine ---
  translateText: async (text, targetLang = 'hi', sourceLang = 'auto') => {
    try {
      const { provider, apiKey } = getStoredAiConfig();
      const res = await client.post('/api/translate', {
        text,
        target_lang: targetLang,
        source_lang: sourceLang,
        provider: provider && provider !== 'auto' ? provider : undefined,
        api_key: apiKey || undefined,
      }, {
        timeout: 60000,
      });
      return res.data;
    } catch (error) {
      // Zero-failure client-side fallback if backend is offline or port 8000 is unreachable
      console.warn('Backend translation unreachable, falling back to browser direct engine:', error);
      try {
        const sl = sourceLang || 'auto';
        const tl = targetLang.split('-')[0].toLowerCase();
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;
        const fallbackRes = await axios.get(url);
        if (fallbackRes.data && fallbackRes.data[0]) {
          const translated = fallbackRes.data[0].map(chunk => chunk[0]).filter(Boolean).join('');
          if (translated) {
            return {
              status: 'success',
              translated_text: translated,
              target_lang: targetLang,
              source_lang: sourceLang,
              engine: 'instant-engine'
            };
          }
        }
      } catch (fallbackErr) {
        console.warn('Browser direct translation fallback failed:', fallbackErr);
      }
      throw error;
    }
  },
};

export default api;

