import React, { useState, useEffect, useCallback } from 'react';
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
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddShoppingCart as AddCartIcon
} from '@mui/icons-material';
import { 
  getInventory,
  createItem,
  updateItem,
  deleteItem,
  restockItems
} from '../../api/inventory';
import { addToCart } from '../../api/cart';

export default function InventoryManager({ token }) {
  // Existing state
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  // CRUD functions
  const fetchInventory = useCallback(async () => {
    try {
      const response = await getInventory(token);
      setInventory(response.data);
    } catch (err) {
      showSnackbar('Failed to fetch inventory', 'error');
    }
  }, [token]);

  // Update and Create inventory items
  const handleSubmit = async () => {
    try {
      if (currentItem._id) {
        await updateItem(currentItem._id, currentItem, token);
        showSnackbar('Item updated!', 'success');
      } else {
        await createItem(currentItem, token);
        showSnackbar('Item created!', 'success');
      }
      setOpen(false);
      fetchInventory();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  // Delete inventory item
  const handleDelete = async (id) => {
    try {
        // First confirm deletion
        if (window.confirm('Are you sure you want to delete this item?')) {
          await deleteItem(id, token);
          showSnackbar('Item deleted successfully!', 'success');
          fetchInventory();
        }
      } catch (err) {
        showSnackbar(
          err.response?.data?.message || 'Delete failed. Item may be referenced in orders.',
          'error'
        );
      }
  };

  // Add-to-Cart function
  const handleAddToCart = async (itemId) => {
    try {
      await addToCart({ item_id: itemId, quantity: 1 }, token);
      showSnackbar('Added to cart!', 'success');
    } catch (err) {
      showSnackbar('Failed to add to cart', 'error');
    }
  };

  // Helper function
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Combined columns with Add-to-Cart action
  const columns = [
    { field: 'item_id', headerName: 'ID', width: 150, editable: true },
    { field: 'name', headerName: 'Name', width: 200, editable: true },
    { field: 'category', headerName: 'Category', width: 150, editable: true },
    { field: 'current_stock', headerName: 'Stock', type: 'number', width: 120 },
    { field: 'threshold', headerName: 'Threshold', type: 'number', width: 120, editable: true },
    {
      field: 'actions',
      type: 'actions',
      width: 200,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<AddCartIcon />}
          label="Add to Cart"
          onClick={() => handleAddToCart(params.row.item_id)}
          showInMenu
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => {
            setCurrentItem(params.row);
            setOpen(true);
          }}
          showInMenu
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDelete(params.row._id)}
          showInMenu
        />
      ],
    },
  ];

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  return (
    <div style={{ height: 600, width: '100%' }}>
      {/* Add Item button */}
      <Button 
        variant="contained" 
        startIcon={<AddIcon />}
        onClick={() => {
          setCurrentItem({
            item_id: '',
            name: '',
            category: '',
            current_stock: 0,
            threshold: 5
          });
          setOpen(true);
        }}
        sx={{ mb: 2 }}
      >
        Add New Item
      </Button>

      {/* DataGrid with all actions */}
      <DataGrid
        rows={inventory}
        columns={columns}
        getRowId={(row) => row._id}
        pageSize={10}
        rowsPerPageOptions={[10]}
        disableSelectionOnClick
      />

      {/* Edit/Add Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{currentItem?._id ? 'Edit Item' : 'Add Item'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Item ID"
            fullWidth
            value={currentItem?.item_id || ''}
            onChange={(e) => setCurrentItem({...currentItem, item_id: e.target.value})} 
          />
          <TextField
              margin="dense"
              label="Name"
              fullWidth
              value={currentItem?.name || ''}
              onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
          />
          <TextField
              margin="dense"
              label="Category"
              fullWidth
              value={currentItem?.category || ''}
              onChange={(e) => setCurrentItem({...currentItem, category: e.target.value})}  
          />
          <TextField
            margin="dense"
            label="Current Stock"
            type="number"
            fullWidth
            value={currentItem?.current_stock || 0}
            onChange={(e) => setCurrentItem({...currentItem, current_stock: parseInt(e.target.value)})}
          />
          <TextField
            margin="dense"
            label="Threshold"
            type="number"
            fullWidth
            value={currentItem?.threshold || 5}
            onChange={(e) => setCurrentItem({...currentItem, threshold: parseInt(e.target.value)})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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