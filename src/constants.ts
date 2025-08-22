// constants.ts

// Base URLs
export const API_BASE_URL = "https://intellicampus-backend-pw12.onrender.com/api";

// Roadmap Endpoints
export const ROADMAP_ENDPOINTS = {
  CREATE: `${API_BASE_URL}/roadmap/create`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/roadmap/${id}`,
  TOPIC_EXPLANATION: (topicId: string) => `${API_BASE_URL}/topic/${topicId}/explanation`,
  ENROLLEMENTS: `${API_BASE_URL}/dashboard/enrollments`
};

// Progress Endpoints
export const PROGRESS_ENDPOINTS = {
  UPDATE: `${API_BASE_URL}/progress/update`,
  GET_BY_ROADMAP: (roadmapId: string) => `${API_BASE_URL}/progress/roadmap/${roadmapId}`,
};

//  Auth Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
};

// Health Check
export const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;
