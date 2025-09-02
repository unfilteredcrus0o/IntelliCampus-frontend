export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Make an authenticated API request
 * @param url The API endpoint URL
 * @param options Request options (method, body, headers)
 * @returns Promise<Response>
 */
export const makeAuthenticatedRequest = async (
  url: string, 
  options: ApiRequestOptions = {}
): Promise<Response> => {
  const { method = 'GET', body, headers = {} } = options;
  
  // Get auth token from sessionStorage
  const authToken = sessionStorage.getItem('authToken');
  
  // Prepare headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  // Add authorization header if token exists
  if (authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }
  
  // Make the request
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  // Handle authentication errors
  if (response.status === 401 || response.status === 403) {
    console.log('Authentication error detected');
    console.log('Auth token exists:', Boolean(authToken));
    console.log('Response text:', await response.clone().text());
  
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
    
    
    throw new Error(`Authentication failed. Status: ${response.status}`);
  }
  
  return response;
};

/**
 * Check if user is authenticated (has valid token)
 * @returns boolean
 */
export const isAuthenticated = (): boolean => {
  const authToken = sessionStorage.getItem('authToken');
  const isAuthenticatedFlag = sessionStorage.getItem('isAuthenticated') === 'true';
  
  return Boolean(authToken && isAuthenticatedFlag);
};

/**
 * Get current user data from sessionStorage
 * @returns User object or null
 */
export const getCurrentUser = (): { name: string; email: string; role?: string } | null => {
  const userData = sessionStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

/**
 * Get current user role from sessionStorage
 * @returns User role string or null
 */
export const getCurrentUserRole = (): string | null => {
  const userData = sessionStorage.getItem('user');
  if (userData) {
    const user = JSON.parse(userData);
    return user.role || null;
  }
  return null;
};

/**
 * Fetch and store user profile information including role
 * @returns Promise<boolean> - success status
 */
export const fetchAndStoreUserProfile = async (): Promise<boolean> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/user`, { method: 'GET' });
    
    if (response.ok) {
      const userProfile = await response.json();
      
      // Update user data in sessionStorage with role information
      const existingUser = getCurrentUser();
      const updatedUser = {
        ...existingUser,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role
      };
      
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return false;
  }
};
