const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://ai-powered-study-assistant-3wot.onrender.com";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  deleteAccount: () => api.delete('/auth/profile'),
};

// Materials APIs
export const materialsAPI = {
  getAll: (params) => api.get('/materials', { params }),
  getOne: (id) => api.get(`/materials/${id}`),
  create: (formData) => api.post('/materials', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
  summarize: (id, data) => api.post(`/materials/${id}/summarize`, data),
  generateFlashcards: (id, data) => api.post(`/materials/${id}/flashcards`, data),
  getDueFlashcards: () => api.get('/materials/flashcards/due'),
  reviewFlashcard: (id, index, data) => api.put(`/materials/${id}/flashcards/${index}`, data),
  share: (id) => api.post(`/materials/${id}/share`),
};

// AI APIs
export const aiAPI = {
  generateQuestions: (data) => api.post('/ai/questions', data),
  explainConcept: (data) => api.post('/ai/explain', data),
  analyzeGaps: (data) => api.post('/ai/analyze-gaps', data),
  generateStudyPlan: () => api.post('/ai/study-plan'),
  getRecommendations: () => api.get('/ai/recommendations'),
};

// Quiz APIs
export const quizAPI = {
  getAll: (params) => api.get('/quizzes', { params }),
  getOne: (id) => api.get(`/quizzes/${id}`),
  submit: (id, data) => api.put(`/quizzes/${id}/submit`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
  getStats: () => api.get('/quizzes/stats'),
};

// Scheduler APIs
export const schedulerAPI = {
  getSchedule: (days) => api.get('/scheduler/schedule', { params: { days } }),
  getSessions: (params) => api.get('/scheduler/sessions', { params }),
  createSession: (data) => api.post('/scheduler/sessions', data),
  deleteSession: (id) => api.delete(`/scheduler/sessions/${id}`),
  startSession: (id) => api.put(`/scheduler/sessions/${id}/start`),
  completeSession: (id, data) => api.put(`/scheduler/sessions/${id}/complete`, data),
  getStreak: () => api.get('/scheduler/streak'),
};

// Analytics APIs
export const analyticsAPI = {
  getDashboard: (days) => api.get('/analytics/dashboard', { params: { days } }),
  getProgress: (params) => api.get('/analytics/progress', { params }),
  getGaps: () => api.get('/analytics/gaps'),
  getVelocity: (params) => api.get('/analytics/velocity', { params }),
  getLeaderboard: () => api.get('/analytics/leaderboard'),
};

// Discussion APIs
export const discussionAPI = {
  getAll: (params) => api.get('/discussions', { params }),
  getOne: (id) => api.get(`/discussions/${id}`),
  create: (data) => api.post('/discussions', data),
  update: (id, data) => api.put(`/discussions/${id}`, data),
  delete: (id) => api.delete(`/discussions/${id}`),
  addReply: (id, content) => api.post(`/discussions/${id}/replies`, { content }),
  markAsAnswer: (id, replyId) => api.put(`/discussions/${id}/replies/${replyId}/answer`),
  upvote: (id) => api.post(`/discussions/${id}/upvote`),
  removeUpvote: (id) => api.delete(`/discussions/${id}/upvote`),
  upvoteReply: (id, replyId) => api.post(`/discussions/${id}/replies/${replyId}/upvote`),
  getPopular: (limit) => api.get('/discussions/popular', { params: { limit } }),
  askAI: (id) => api.post(`/discussions/${id}/ai-answer`),
};

export default api;
