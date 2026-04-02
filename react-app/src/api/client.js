import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Auth
export const login = (data) => api.post('/auth.php', data);
export const logout = () => api.delete('/auth.php');
export const getMe = () => api.get('/auth.php');

// Dashboard
export const getDashboardStats = () => api.get('/dashboard.php');

// Applicants
export const getApplicants = (params) => api.get('/applicants.php', { params });
export const getApplicant = (id) => api.get(`/applicants.php?id=${id}`);
export const createApplicant = (data) => api.post('/applicants.php', data);
export const updateApplicant = (id, data) => api.put(`/applicants.php?id=${id}`, data);
export const deleteApplicant = (id) => api.delete(`/applicants.php?id=${id}`);
export const bulkAction = (ids, action) => api.put('/applicants.php', { ids, action });

// Shortlisted, Verified
export const getShortlisted = (params) => api.get('/shortlisted.php', { params });
export const getVerified = (params) => api.get('/verified.php', { params });

// Upload / Export
export const uploadApplicants = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload.php', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const getExportUrl = (type, program = '') => `/api/export.php?type=${type}&program=${program}`;

// Interview Dates
export const getInterviewDates = (params) => api.get('/dates.php', { params: { ...params, summary: 1 } });
export const getInterviewDateDetail = (params) => api.get('/dates.php', { params });
export const assignInterviewDate = (ids, date) => api.post('/dates.php', { ids, interview_date: date });
export const clearInterviewDate = (id) => api.delete(`/dates.php?id=${id}`);
export const uploadInterviewDates = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/dates.php', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// Sources
export const getSources = (params) => api.get('/sources.php', { params });
export const getSourceDetail = (params) => api.get('/sources.php', { params });

// Admitted tracking
export const getAdmissionsSummary = () => api.get('/admissions.php?summary=1');
export const getAdmissionsDetail = (date) => api.get(`/admissions.php?date=${date}`);

// Users
export const getUsers = (params) => api.get('/users.php', { params });
export const getUser = (id) => api.get(`/users.php?id=${id}`);
export const createUser = (data) => api.post('/users.php', data);
export const updateUser = (id, data) => api.put(`/users.php?id=${id}`, data);
export const deleteUser = (id) => api.delete(`/users.php?id=${id}`);

export default api;
