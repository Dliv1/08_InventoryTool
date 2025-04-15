import apiClient from './apiClient';

export const getCart = (token) => {
  return apiClient.get('/cart', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const addToCart = (item, token) => {
  return apiClient.post('/cart/add', { items: [item] }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const updateCartItem = (itemId, updates, token) => {
  return apiClient.put(`/cart/item/${itemId}`, updates, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const removeFromCart = (itemId, token) => {
  return apiClient.delete(`/cart/item/${itemId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const checkoutCart = (token) => {
  return apiClient.post('/cart/checkout', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};