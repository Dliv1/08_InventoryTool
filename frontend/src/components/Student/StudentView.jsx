import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import { getInventory } from '../../api/inventory';
import { studentCart } from '../../api/cart';

const StudentView = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState(() => {
    // Initialize cart from localStorage if available
    const savedCart = localStorage.getItem('studentCart');
    return savedCart ? JSON.parse(savedCart) : { items: [] };
  });
  const [activeTab, setActiveTab] = useState('inventory');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getInventory('student');
      // Ensure we have the correct data structure
      const inventoryData = Array.isArray(response.data) ? response.data : [];
      setInventory(inventoryData);
    } catch (err) {
      setError('Failed to load inventory');
      console.error('Error fetching inventory:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchCart();
  }, [fetchInventory]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('studentCart', JSON.stringify(cart));
  }, [cart]);

  const fetchCart = () => {
    // No need to fetch from server, using localStorage
    const savedCart = localStorage.getItem('studentCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const handleAddToCart = (item) => {
    try {
      setIsCartLoading(true);
      
      // Check if item is already in cart
      const existingItemIndex = cart.items.findIndex(i => i.itemId === item._id);
      let updatedItems;
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        updatedItems = [...cart.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
      } else {
        // Add new item to cart
        updatedItems = [
          ...cart.items,
          {
            itemId: item._id,
            name: item.name,
            quantity: 1,
            price: 0,
            item_id: item.item_id
          }
        ];
      }
      
      const updatedCart = { ...cart, items: updatedItems };
      setCart(updatedCart);
      showSnackbar(`${item.name} added to cart`, 'success');
    } catch (err) {
      console.error('Error adding to cart:', err);
      showSnackbar('Failed to add item to cart', 'error');
    } finally {
      setIsCartLoading(false);
    }
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (isNaN(newQuantity) || newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      setIsCartLoading(true);
      const updatedItems = cart.items.map(item => 
        item.itemId === itemId ? { ...item, quantity: newQuantity } : item
      );
      setCart({ ...cart, items: updatedItems });
      showSnackbar('Quantity updated', 'success');
    } catch (err) {
      console.error('Error updating quantity:', err);
      showSnackbar('Failed to update quantity', 'error');
    } finally {
      setIsCartLoading(false);
    }
  };

  const handleRemoveItem = (itemId) => {
    try {
      setIsCartLoading(true);
      const updatedItems = cart.items.filter(item => item.itemId !== itemId);
      setCart({ ...cart, items: updatedItems });
      showSnackbar('Item removed from cart', 'success');
    } catch (err) {
      console.error('Error removing item:', err);
      showSnackbar('Failed to remove item', 'error');
    } finally {
      setIsCartLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setIsCartLoading(true);
      // Here you would typically send the cart to your backend for processing
      // For now, we'll just clear the cart and show a success message
      console.log('Checking out with items:', cart.items);
      
      // Clear the cart
      setCart({ items: [] });
      
      setCheckoutOpen(false);
      showSnackbar('Checkout successful!', 'success');
    } catch (err) {
      console.error('Checkout failed:', err);
      showSnackbar('Checkout failed', 'error');
    } finally {
      setIsCartLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchCart();
  };

  const columns = [
    { 
      field: 'name', 
      headerName: 'Item', 
      width: 200,
      valueGetter: (params) => params.row.name || 'Unknown Item'
    },
    { 
      field: 'quantity', 
      headerName: 'Qty', 
      width: 150,
      renderCell: (params) => {
        // Ensure we're using the correct property name (itemId or _id)
        const itemId = params.row.itemId || params.row._id;
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateQuantity(itemId, (params.row.quantity || 1) - 1);
              }}
              disabled={isCartLoading}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <TextField
              value={params.row.quantity || 1}
              size="small"
              type="number"
              inputProps={{ min: 1 }}
              sx={{ width: 60, mx: 1 }}
              onChange={(e) => {
                const newValue = parseInt(e.target.value) || 1;
                handleUpdateQuantity(itemId, newValue);
              }}
              disabled={isCartLoading}
            />
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateQuantity(itemId, (params.row.quantity || 1) + 1);
              }}
              disabled={isCartLoading}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </div>
        );
      }
    },
    {
      field: 'actions',
      type: 'actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleRemoveItem(params.row.itemId || params.row._id)}
          disabled={isCartLoading}
        />
      ]
    }
  ];

  const inventoryColumns = [
    { field: 'item_id', headerName: 'ID', width: 150 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'category', headerName: 'Category', width: 150 },
    { 
      field: 'current_stock', 
      headerName: 'In Stock', 
      width: 100,
      valueGetter: (params) => params.row.current_stock || params.row.quantity || 0
    },
    { field: 'threshold', headerName: 'Threshold', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleAddToCart(params.row)}
          disabled={params.row.quantity <= 0}
        >
          Add to Cart
        </Button>
      ),
    },
  ];

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  console.log('Inventory:', inventory); // Debug log
  console.log('Cart:', cart); // Debug log

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Student Portal
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, flex: 1 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ mb: 3 }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            value="inventory" 
            icon={<InventoryIcon />} 
            label="Inventory" 
            iconPosition="start" 
          />
          <Tab 
            value="cart" 
            icon={<ShoppingCartIcon />} 
            label={`Cart (${cart?.items?.length || 0})`} 
            iconPosition="start"
          />
        </Tabs>

        {activeTab === 'inventory' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">Available Items</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={fetchInventory}
                startIcon={<RefreshIcon />}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </Box>
            <div style={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={inventory}
                columns={inventoryColumns}
                loading={isLoading}
                pageSize={10}
                rowsPerPageOptions={[10]}
                getRowId={(row) => row._id}
                disableSelectionOnClick
              />
            </div>
          </Box>
        )}

        {activeTab === 'cart' && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Your Cart</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchCart}
                  startIcon={<RefreshIcon />}
                  disabled={isCartLoading}
                >
                  Refresh
                </Button>
              </Box>
              {isCartLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : !cart?.items?.length ? (
                <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', my: 2 }}>
                  Your cart is empty
                </Typography>
              ) : (
                <div style={{ height: 500, width: '100%' }}>
                  <DataGrid
                    rows={Array.isArray(cart.items) ? cart.items : []}
                    columns={columns}
                    getRowId={(row) => row.itemId || row._id || row.item_id}
                    loading={isCartLoading}
                    disableSelectionOnClick
                  />
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setCheckoutOpen(true)}
                      disabled={isCartLoading || !cart?.items?.length}
                    >
                      Checkout
                    </Button>
                  </Box>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Checkout Confirmation Dialog */}
        <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)}>
          <DialogTitle>Confirm Checkout</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to checkout {cart.items.length} items?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCheckoutOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCheckout}
              color="primary"
              variant="contained"
              disabled={isCartLoading}
            >
              {isCartLoading ? <CircularProgress size={24} /> : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default StudentView;
