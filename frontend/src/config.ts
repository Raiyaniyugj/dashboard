// Central API configuration
// In production (Vercel), this resolves to the backend URL.
// In local dev, the Vite proxy handles /api routes, so baseUrl is empty.
const isLocalDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

export const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocalDev ? '' : 'https://capital-backk.vercel.app');
