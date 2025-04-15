import apiClient from './apiClient';

export const getOrderHistory = (token) => {
  return apiClient.get(`/orders/history/all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getUserOrders = (token) => {
  return apiClient.get(`/orders/history/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getUsers = (token) => {
    return apiClient.get('/admin/users', { 
      headers: { Authorization: `Bearer ${token}` }
    });
  };