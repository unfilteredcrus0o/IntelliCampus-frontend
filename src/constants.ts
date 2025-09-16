// constants.ts

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
 
// Roadmap Endpoints
export const ROADMAP_ENDPOINTS = {
  CREATE: `${API_BASE_URL}/api/roadmap/create`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/api/roadmap/${id}`,
  TOPIC_EXPLANATION: (topicId: string) => `${API_BASE_URL}/api/topic/${topicId}/explanation`,
  ENROLLEMENTS: `${API_BASE_URL}/api/dashboard/enrollments`,
  ENROLL: (id: string) => `${API_BASE_URL}/api/roadmap/${id}/enroll`
};
 
// Progress Endpoints
export const PROGRESS_ENDPOINTS = {
  UPDATE_TOPIC: (topicId: string) => `${API_BASE_URL}/api/topic/${topicId}/progress`,
  GET_BY_ROADMAP: (roadmapId: string) => `${API_BASE_URL}/api/progress/roadmap/${roadmapId}`,
};
 
//  Auth Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
};
 
// User Endpoints
export const USER_ENDPOINTS = {
  GET_EMPLOYEES: `${API_BASE_URL}/api/users/`,
  GET_MANAGERS: `${API_BASE_URL}/api/users/managers`,
};
 
// Assignment Endpoints
export const ASSIGNMENT_ENDPOINTS = {
  GET_MY_ASSIGNMENTS: `${API_BASE_URL}/api/assignments/my`,
  CREATE: `${API_BASE_URL}/api/assignments`,
};

export const SUPER_ADMIN = {
  ALL_EMPLOYEES :`${API_BASE_URL}/api/users/all-for-assignment`
};

// Health Check
export const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;
 