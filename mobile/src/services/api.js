import axios from 'axios';

// Default host: 10.0.2.2 for Android emulator, localhost for iOS simulator/web
let BASE_URL = 'http://10.0.2.2:8000';

export const setApiBaseUrl = (url) => {
  BASE_URL = url.trim().replace(/\/+$/, '');
  mobileClient.defaults.baseURL = BASE_URL;
};

export const getApiBaseUrl = () => BASE_URL;

const mobileClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const mobileApi = {
  checkHealth: async () => {
    const res = await mobileClient.get('/api/health');
    return res.data;
  },

  analyzeText: async (text, sourceHint = 'Mobile App') => {
    const res = await mobileClient.post('/api/analyze/text', {
      text,
      source_hint: sourceHint,
    });
    return res.data;
  },

  analyzeUrl: async (url) => {
    const res = await mobileClient.post('/api/analyze/url', { url });
    return res.data;
  },

  getHistory: async (limit = 20) => {
    const res = await mobileClient.get('/api/history', { params: { limit } });
    return res.data;
  },

  getStats: async () => {
    const res = await mobileClient.get('/api/stats');
    return res.data;
  },

  submitFeedback: async (resultId, isHelpful) => {
    const res = await mobileClient.post('/api/feedback', {
      result_id: resultId,
      is_helpful: isHelpful,
    });
    return res.data;
  }
};

export default mobileApi;
