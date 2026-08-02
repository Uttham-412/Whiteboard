/**
 * Centralized API & WebSocket Configuration
 * Guarantees zero hardcoded localhost strings and seamless switching between Render production & local dev.
 */

export const DEFAULT_BACKEND_URL = 'https://whiteboard-backend-10ji.onrender.com';

/**
 * Gets the base REST API URL (without trailing slashes).
 */
export const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_BACKEND_URL;
};

/**
 * Gets the WebSocket base URL (wss:// or ws://).
 */
export const getWsUrl = (): string => {
  const apiUrl = getApiUrl();
  const wsProtocol = apiUrl.startsWith('https://') ? 'wss://' : 'ws://';
  return apiUrl.replace(/^https?:\/\//, wsProtocol);
};
