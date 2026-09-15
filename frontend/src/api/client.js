import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('cybervie_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cybervie_token');
      localStorage.removeItem('cybervie_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;

// API helper functions
export const api = {
  // Auth
  googleLogin: (idToken) => client.post('/auth/google', { idToken }),
  login: (email, password) => client.post('/auth/login', { email, password }),
  register: (data) => client.post('/auth/register', data),
  getMe: () => client.get('/auth/me'),

  // Colleges
  listColleges: (params) => client.get('/colleges', { params }),
  getCollege: (id) => client.get(`/colleges/${id}`),
  createCollege: (data) => client.post('/colleges', data),
  updateCollege: (id, data) => client.put(`/colleges/${id}`, data),
  addDomain: (id, domain) => client.post(`/colleges/${id}/domains`, { domain }),
  verifyDomain: (id, data) => client.post(`/colleges/${id}/domains/verify`, data),
  removeDomain: (id, domain) => client.delete(`/colleges/${id}/domains`, { data: { domain } }),
  getCollegeStats: (id) => client.get(`/colleges/stats/${id}`),

  // Questions
  listQuestions: (params) => client.get('/questions', { params }),
  getQuestion: (id) => client.get(`/questions/${id}`),
  createQuestion: (data) => client.post('/questions', data),
  updateQuestion: (id, data) => client.put(`/questions/${id}`, data),
  updateQuestionStatus: (id, status) => client.patch(`/questions/${id}/status`, { status }),
  deleteQuestion: (id) => client.delete(`/questions/${id}`),

  // Quizzes
  listQuizzes: (params) => client.get('/quizzes', { params }),
  getQuiz: (id) => client.get(`/quizzes/${id}`),
  createQuiz: (data) => client.post('/quizzes', data),
  publishQuiz: (id) => client.patch(`/quizzes/${id}/publish`),
  addQuestionsToQuiz: (id, questionIds) => client.post(`/quizzes/${id}/questions`, { questionIds }),

  // Attempts
  startAttempt: (quizId) => client.post('/attempts/start', { quizId }),
  submitAnswer: (attemptId, data) => client.post(`/attempts/${attemptId}/answer`, data),
  submitAttempt: (attemptId) => client.post(`/attempts/${attemptId}/submit`),
  getMyAttempts: (params) => client.get('/attempts/me', { params }),
  getAttemptResults: (id) => client.get(`/attempts/${id}/results`),

  // Learning paths
  listPaths: (params) => client.get('/paths', { params }),
  getPath: (slug) => client.get(`/paths/${slug}`),
  getMissions: (params) => client.get('/paths/missions', { params }),
  getMission: (slug) => client.get(`/paths/mission/${slug}`),

  // Rankings
  getGlobalRankings: (params) => client.get('/rankings/global', { params }),
  getCollegeLeaderboard: (params) => client.get('/rankings/college-leaderboard', { params }),
  getCollegeRankings: (collegeId, params) => client.get(`/rankings/college/${collegeId}`, { params }),

  // Profiles
  getMyProfile: () => client.get('/profiles/me'),
  updateMyProfile: (data) => client.put('/profiles/me', data),
  getPublicProfile: (id) => client.get(`/profiles/${id}`),

  // Assignments
  listAssignments: () => client.get('/assignments'),
  getAssignment: (id) => client.get(`/assignments/${id}`),
  createAssignment: (data) => client.post('/assignments', data),
  getAssignmentResults: (id) => client.get(`/assignments/${id}/results`),

  // Users
  listCollegeUsers: (params) => client.get('/users/college', { params }),
  listAllUsers: (params) => client.get('/users/all', { params }),
  updateUserStatus: (id, status) => client.patch(`/users/${id}/status`, { status }),
  updateUserRole: (id, role) => client.patch(`/users/${id}/role`, { role }),
};
