import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends the httpOnly refresh-token cookie
});

// In-memory access token. Deliberately NOT localStorage — keeping it out
// of persistent storage limits the damage an XSS bug could do.
let accessToken = null;
let onLogout = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function registerLogoutHandler(fn) {
  onLogout = fn;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.code;

    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        // Multiple simultaneous 401s should trigger only one refresh call.
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh').finally(() => {
            refreshPromise = null;
          });
        }
        const { data } = await refreshPromise;
        setAccessToken(data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        if (onLogout) onLogout();
        return Promise.reject(refreshError);
      }
    }

    // Attach a friendly fallback message so components never have to
    // handle raw Axios errors directly.
    const friendlyMessage =
      error.response?.data?.message ||
      (error.request && !error.response
        ? 'Unable to reach the server. Please check your connection and try again.'
        : 'Something went wrong. Please try again.');

    error.friendlyMessage = friendlyMessage;
    error.code = code;
    return Promise.reject(error);
  }
);

export default api;
