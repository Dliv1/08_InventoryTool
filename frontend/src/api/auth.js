import apiClient from './apiClient';

export const registerAdmin = async (username, password) => {
  return apiClient.post('/admin/register', { username, password });
};

export const loginAdmin = async (username, password) => {
  return apiClient.post('/admin/login', { username, password });
};

export const logout = async () => {
  return apiClient.post('/logout');
};