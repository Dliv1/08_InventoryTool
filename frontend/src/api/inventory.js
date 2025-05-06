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
  /*// For stock updates, use the transaction endpoint
  if (updates.current_stock !== undefined) {
    return apiClient.post('/transaction/restock', {
      items: [{
        item_id: id,
        quantity: updates.current_stock - (updates.original_stock || 0)
      }]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  */
  // For other updates (name, category, etc.), use the regular update endpoint
  return apiClient.put(`/inventory/${id}`, updates, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const deleteItem = async (id, token) => {
  try {
    /*    // First check if the item exists
    const inventoryResponse = await apiClient.get(`/inventory/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!inventoryResponse.data) {
      throw new Error('Item not found');
    }
*/
    // Then proceed with deletion
    const response = await apiClient.delete(`/inventory/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  } catch (error) {
    throw error;
  }
};