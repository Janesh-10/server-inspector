import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetches captures with optional filter parameters.
 * @param {Object} [params]
 * @param {string} [params.method]
 * @param {string} [params.status]
 * @param {string} [params.q]
 * @param {number} [params.limit]
 * @param {number} [params.offset]
 * @returns {Promise<Array<Object>>}
 */
export async function getCaptures(params = {}) {
  const cleanParams = {};
  if (params.method) cleanParams.method = params.method;
  if (params.status) cleanParams.status = params.status;
  if (params.q) cleanParams.q = params.q;
  if (params.limit) cleanParams.limit = params.limit;
  if (params.offset) cleanParams.offset = params.offset;

  const response = await apiClient.get('/api/captures', {
    params: cleanParams,
  });
  return response.data;
}

/**
 * Fetches single capture detail by ID.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getCaptureById(id) {
  const response = await apiClient.get(`/api/captures/${id}`);
  return response.data;
}

/**
 * Clears all recorded traffic captures.
 * @returns {Promise<Object>}
 */
export async function clearAllCaptures() {
  const response = await apiClient.delete('/api/captures');
  return response.data;
}

export default apiClient;
