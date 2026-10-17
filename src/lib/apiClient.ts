import { auth } from './firebase';
import { authStore } from '../authStore';

const getBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL || "__VITE_API_URL__";
  if (!rawUrl || rawUrl.startsWith('__')) {
    return '';
  }
  let cleanUrl = rawUrl.trim();
  if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  return cleanUrl.replace(/\/+$/, '');
};

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const storedToken = authStore.getState().token;
  const token = storedToken || (auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null);
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const baseUrl = getBaseUrl();
  const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error(`Network error: ${netErr.message || 'Server unreachable'}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    if (isJson) {
      const errorData = await response.json().catch(() => ({}));
      errorMsg = errorData.error || errorMsg;
    }
    throw new Error(errorMsg);
  }

  if (!isJson) {
    // Handled gracefully: server returned HTML fallback or SPA index.html
    console.warn(`[apiClient] Expected JSON from ${endpoint} but received ${contentType || 'non-JSON response'}`);
    return null;
  }

  try {
    return await response.json();
  } catch (parseErr) {
    console.warn(`[apiClient] Failed to parse JSON response from ${endpoint}:`, parseErr);
    return null;
  }
};

export const uploadFileToSignedUrl = async (uploadUrl: string, file: File | string) => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': typeof file === 'string' ? 'text/plain' : file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
  
  return true;
};
