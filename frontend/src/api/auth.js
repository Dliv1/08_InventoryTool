import apiClient from './apiClient';

export const registerAdmin = async (username, password) => {
  return apiClient.post('/admin/register', { username, password });
};

export const loginAdmin = async (username, password) => {
  console.log('Attempting login with:', { username, password });
  try {
    const response = await apiClient.post('/admin/login', { username, password });
    console.log('Login response:', response.data);
    return response;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

export const logout = async () => {
  return apiClient.post('/logout');
};