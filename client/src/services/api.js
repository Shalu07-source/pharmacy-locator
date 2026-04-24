import axios from 'axios';

function getApiBaseUrl() {
  const configuredUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim();

  if (configuredUrl.endsWith('/api')) {
    return configuredUrl;
  }

  return `${configuredUrl.replace(/\/+$/, '')}/api`;
}

const api = axios.create({
  baseURL: getApiBaseUrl()
});

export async function searchPharmacies(params) {
  const response = await api.get('/pharmacies', { params });
  return response.data;
}

export async function fetchNearbyPharmacies(params) {
  const response = await api.get('/pharmacies/nearby', { params });
  return response.data;
}

export async function fetchAlternativeMedicines(medicine) {
  const response = await api.get('/pharmacies/alternatives', {
    params: { medicine }
  });
  return response.data;
}

export default api; 