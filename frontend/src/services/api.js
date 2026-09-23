import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Storage keys for client-side API configuration
const STORAGE_KEY_AI_PROVIDER = 'truthshield_ai_provider';
const STORAGE_KEY_API_KEY = 'truthshield_api_key';

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

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000,
});

// Request interceptor to automatically attach custom AI key and provider if set by user
client.interceptors.request.use((config) => {
  const { provider, apiKey } = getStoredAiConfig();
  if (provider && provider !== 'auto') {
    config.headers['X-AI-Provider'] = provider;
  }
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
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
  } else if (error.request) {
    return 'FastAPI backend is currently unreachable. Make sure the server is running on port 8000.';
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
};

export default api;
