import axios from 'axios';

// Ensure baseURL always ends with /api
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // If VITE_API_URL is set, use it (should include /api)
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  // Fallback URLs
  return import.meta.env.PROD 
    ? 'https://study-tool-backend.onrender.com/api' 
    : 'http://localhost:3001/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration and invalid tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 (Unauthorized) or 403 (Forbidden) - token expired or invalid
      if (error.response.status === 401 || error.response.status === 403) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('isGuest');
        
        // Only redirect if we're not already on login/register page
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API functions
export const auth = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

export const courses = {
  getAll: () => api.get('/courses'),
  create: (data: any) => api.post('/courses', data),
  getById: (id: string) => api.get(`/courses/${id}`),
  update: (id: string, data: any) => api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
};

export const materials = {
  getAll: (courseId: string) => api.get(`/courses/${courseId}/materials`),
  upload: (courseId: string, formData: FormData) =>
    api.post(`/courses/${courseId}/materials/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  addUrl: (courseId: string, url: string, name: string) =>
    api.post(`/courses/${courseId}/materials/url`, { url, name }),
  update: (id: string, data: any) => api.put(`/materials/${id}`, data),
  delete: (id: string) => api.delete(`/materials/${id}`),
};

export const quizzes = {
  getAllForCourse: (courseId: string) => api.get(`/courses/${courseId}/quizzes`),
  generate: (courseId: string, config: any) =>
    api.post(`/courses/${courseId}/quizzes/generate`, config),
  getById: (id: string) => api.get(`/quizzes/${id}`),
  saveProgress: (id: string, answers: any) =>
    api.post(`/quizzes/${id}/save-progress`, { answers }),
  submit: (id: string, answers: any, timeSpent: number) =>
    api.post(`/quizzes/${id}/submit`, { answers, timeSpent }),
  getResults: (id: string) => api.get(`/quizzes/${id}/results`),
};

export const analytics = {
  getCourseAnalytics: (courseId: string) =>
    api.get(`/analytics/courses/${courseId}`),
  getSummary: () => api.get('/analytics/summary'),
};

