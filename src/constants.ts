// constants.ts

// Base URLs
export const API_BASE_URL = "https://intellicampus-backend-pw12.onrender.com/api";

// Roadmap Endpoints
export const ROADMAP_ENDPOINTS = {
  CREATE: `${API_BASE_URL}/roadmap/create`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/roadmap/${id}`,
  TOPIC_EXPLANATION: (topicId: string) => `${API_BASE_URL}/topic/${topicId}/explanation`,
  ENROLLEMENTS: `${API_BASE_URL}/dashboard/enrollments`,
  ENROLL: (id: string) => `${API_BASE_URL}/roadmap/${id}/enroll`
};

// Progress Endpoints
export const PROGRESS_ENDPOINTS = {
  UPDATE_TOPIC: (topicId: string) => `${API_BASE_URL}/topic/${topicId}/progress`,
  GET_BY_ROADMAP: (roadmapId: string) => `${API_BASE_URL}/progress/roadmap/${roadmapId}`,
};

//  Auth Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
};

// User Endpoints
export const USER_ENDPOINTS = {
  GET_EMPLOYEES: `${API_BASE_URL}/users/`,
  GET_MANAGERS: `${API_BASE_URL}/users/managers`,
};

// Assignment Endpoints
export const ASSIGNMENT_ENDPOINTS = {
  GET_MY_ASSIGNMENTS: `${API_BASE_URL}/assignments/my`,
  CREATE: `${API_BASE_URL}/assignments`,
};

export const SUPER_ADMIN = {
  ALL_EMPLOYEES :`${API_BASE_URL}/users/all-for-assignment`
};

// Health Check
export const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;
