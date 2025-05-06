import apiClient from './apiClient';

// For students (no auth required)
const getStudentCart = () => {
  return apiClient.get('/cart/student');
};

const addToStudentCart = (itemId, quantity = 1) => {
  return apiClient.post('/cart/student/add', { itemId, quantity });
};

const updateStudentCartItem = (itemId, updates) => {
  return apiClient.put(`/cart/student/item/${itemId}`, updates);
};

const removeFromStudentCart = (itemId) => {
  return apiClient.delete(`/cart/student/item/${itemId}`);
};

const checkoutStudentCart = () => {
  return apiClient.post('/cart/student/checkout');
};

// For authenticated users
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

export const checkout = (token) => {
  if (token === 'student') {
    return checkoutStudentCart();
  }
  return apiClient.post('/cart/checkout', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Export student functions
export const studentCart = {
  getCart: getStudentCart,
  addToCart: addToStudentCart,
  updateItem: updateStudentCartItem,
  removeItem: removeFromStudentCart,
  checkout: checkoutStudentCart
};