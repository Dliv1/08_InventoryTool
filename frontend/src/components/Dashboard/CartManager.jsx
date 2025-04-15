import React, { useState, useEffect } from 'react';
import { 
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  checkoutCart 
} from '../../api/cart';
import { 
    DataGrid, 
    GridActionsCellItem 
  } from '@mui/x-data-grid';
import { 
  Button, 
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function CartManager({ token }) {
  const [cart, setCart] = useState({ items: [] });
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const fetchCart = async () => {
    try {
      const response = await getCart(token);
      setCart(response.data);
    } catch (err) {
      console.error('Failed to fetch cart', err);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const handleAddToCart = async (itemId, quantity = 1) => {
    try {
      await addToCart({ item_id: itemId, quantity }, token);
      fetchCart();
    } catch (err) {
      console.error('Failed to add to cart', err);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      await updateCartItem(itemId, { quantity: newQuantity }, token);
      fetchCart();
    } catch (err) {
      console.error('Failed to update quantity', err);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeFromCart(itemId, token);
      fetchCart();
    } catch (err) {
      console.error('Failed to remove item', err);
    }
  };

  const handleCheckout = async () => {
    try {
      await checkoutCart(token);
      setCheckoutOpen(false);
      showSnackbar('Checkout successful! Order has been processed.', 'success');
      fetchCart();

    } catch (err) {
      showSnackbar(
        err.response?.data?.message || 'Checkout failed. Please try again.',
        'error'
      );
    }
  };

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const columns = [
    { field: 'name', headerName: 'Item', width: 200 },
    { 
      field: 'quantity', 
      headerName: 'Qty', 
      width: 150,
      renderCell: (params) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => handleUpdateQuantity(params.row.item_id, params.row.quantity - 1)}>
            <RemoveIcon fontSize="small" />
          </IconButton>
          <TextField
            value={params.row.quantity}
            size="small"
            type="number"
            sx={{ width: 60, mx: 1 }}
            onChange={(e) => handleUpdateQuantity(params.row.item_id, parseInt(e.target.value))}
          />
          <IconButton onClick={() => handleUpdateQuantity(params.row.item_id, params.row.quantity + 1)}>
            <AddIcon fontSize="small" />
          </IconButton>
        </div>
      )
    },
    {
      field: 'actions',
      type: 'actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleRemoveItem(params.row.item_id)}
        />
      ]
    }
  ];

  return (
    <div>
      <div style={{ height: 400, width: '100%', marginBottom: 20 }}>
        <DataGrid
          rows={cart.items}
          columns={columns}
          getRowId={(row) => row.item_id}
        />
      </div>

      <Button 
        variant="contained" 
        color="primary"
        disabled={cart.items.length === 0}
        onClick={() => setCheckoutOpen(true)}
      >
        Checkout
      </Button>

      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)}>
        <DialogTitle>Confirm Checkout</DialogTitle>
        <DialogContent>
          Are you sure you want to checkout {cart.items.length} items?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutOpen(false)}>Cancel</Button>
          <Button onClick={handleCheckout} color="primary">Confirm</Button>
        </DialogActions>
      </Dialog>
    <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
    >
        <Alert severity={snackbar.severity}>
            {snackbar.message}
        </Alert>
    </Snackbar>
    </div>
  );
}