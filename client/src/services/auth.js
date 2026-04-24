import api from './api';

export async function signupUser(payload) {
  const response = await api.post('/auth/signup', payload);
  return response.data;
}

export async function signinUser(payload) {
  const response = await api.post('/auth/signin', payload);
  return response.data;
}

export async function fetchProfile(token) {
  const response = await api.get('/auth/profile', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}
