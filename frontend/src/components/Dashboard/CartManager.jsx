import React, { useState, useEffect } from 'react';
import { 
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  checkout as checkoutCart,
  studentCart
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
  IconButton,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RefreshIcon from '@mui/icons-material/Refresh';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function CartManager({ token }) {
  const [cart, setCart] = useState({ items: [] });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = async () => {
    try {
      const response = token === 'student' 
        ? await studentCart.getCart() 
        : await getCart(token);
      setCart(response.data || { items: [] });
    } catch (err) {
      console.error('Failed to fetch cart', err);
      showSnackbar('Failed to load cart', 'error');
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await handleRemoveItem(itemId);
      return;
    }

    try {
      if (token === 'student') {
        setIsLoading(true);
        // Use the update endpoint for students
        await studentCart.updateItem(itemId, { quantity: newQuantity });
        // Refresh the cart to get the latest state
        await fetchCart();
      } else {
        await updateCartItem(itemId, { quantity: newQuantity }, token);
        fetchCart();
      }
    } catch (err) {
      console.error('Failed to update quantity', err);
      showSnackbar(err.response?.data?.message || 'Failed to update quantity', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      setIsLoading(true);
      if (token === 'student') {
        // Use the remove endpoint for students
        await studentCart.removeItem(itemId);
        // Refresh the cart to get the latest state
        await fetchCart();
      } else {
        await removeFromCart(itemId, token);
        fetchCart();
      }
      showSnackbar('Item removed from cart', 'success');
    } catch (err) {
      console.error('Failed to remove item', err);
      showSnackbar(err.response?.data?.message || 'Failed to remove item', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      if (token === 'student') {
        await studentCart.checkout();
      } else {
        await checkoutCart(token);
      }
      setCheckoutOpen(false);
      showSnackbar('Checkout successful! Order has been processed.', 'success');
      // Clear the cart after successful checkout
      setCart({ items: [] });
    } catch (err) {
      console.error('Checkout failed:', err);
      showSnackbar(
        err.response?.data?.message || 'Checkout failed. Please try again.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add a refresh button to manually refresh the cart
  const handleRefresh = () => {
    fetchCart();
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2>Your Cart</h2>
        <Button 
          variant="outlined" 
          onClick={handleRefresh}
          startIcon={isLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>
      
      {cart.items.length === 0 ? (
        <Box textAlign="center" p={4}>
          <Typography variant="h6" color="textSecondary">
            Your cart is empty
          </Typography>
        </Box>
      ) : (
        <div style={{ height: 400, width: '100%', marginBottom: 20 }}>
          <DataGrid
            rows={cart.items}
            columns={columns}
            getRowId={(row) => row.item_id}
            loading={isLoading}
            disableSelectionOnClick
          />
        </div>
      )}

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