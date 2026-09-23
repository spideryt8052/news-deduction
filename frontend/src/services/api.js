import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

// Helper to extract clean error message from FastAPI responses
export const formatApiError = (error) => {
  if (error.response) {
    // Server responded with an error status (4xx, 5xx)
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
    // Request made but no response received (server offline or CORS blocked)
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

  analyzeText: async (text, sourceHint = null) => {
    try {
      const res = await client.post('/api/analyze/text', {
        text,
        source_hint: sourceHint,
      });
      return { data: res.data, isLive: true };
    } catch (error) {
      throw error;
    }
  },

  analyzeUrl: async (url) => {
    try {
      const res = await client.post('/api/analyze/url', { url });
      return { data: res.data, isLive: true };
    } catch (error) {
      throw error;
    }
  },

  analyzeImage: async (formData) => {
    try {
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
