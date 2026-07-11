import { auth } from './firebase';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || "__VITE_API_URL__";
  return url.startsWith('__') ? 'http://localhost:3001' : url;
};

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${getBaseUrl()}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
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
