import apiClient from './apiClient';

export const getInventory = (token) => {
  return apiClient.get('/inventory', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const createItem = (item, token) => {
  return apiClient.post('/inventory', item, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const updateItem = (id, updates, token) => {
  return apiClient.put(`/inventory/${id}`, updates, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const deleteItem = (id, token) => {
  return apiClient.delete(`/inventory/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};