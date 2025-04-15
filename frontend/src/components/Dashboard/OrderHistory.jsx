import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { 
  ToggleButton, 
  ToggleButtonGroup,
  Box,
  Typography,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getOrderHistory, getUserOrders } from '../../api/orders';

export default function OrderHistory({ token, userId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // data fetching with new mode
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = viewMode === 'all' 
          ? await getOrderHistory(token)
          : await getUserOrders(userId, token);
        setOrders(response.data.orders || []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token, userId, viewMode]);

  const columns = [
    { 
      field: 'order_id', 
      headerName: 'Order ID', 
      width: 180,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color="primary" 
          variant="outlined"
          size="small"
        />
      )
    },
    { 
      field: 'user_id', 
      headerName: 'User', 
      width: 150,
      valueGetter: (params) => {
      // If user object is populated with username
        if (params.row.user?.username) return params.row.user.username;
      // If student object exists
        if (params.row.student_id) return params.row.student_id;
      // Fallback to truncated ID
        return params.row.user_id?.substring(0, 8) || 'Unknown';
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'completed' ? 'success' : 'warning'}
          size="small"
        />
      )
    },
    { 
      field: 'date', 
      headerName: 'Date', 
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
      type: 'dateTime'
    },
    { 
      field: 'items', 
      headerName: 'Items', 
      width: 300,
      valueFormatter: (params) => 
        params.value
          .map(i => `${i.quantity}x ${i.name}`)
          .join(', '),
      sortable: false
    },
    { 
      field: 'total', 
      headerName: 'Total', 
      width: 120,
      valueGetter: (params) => 
        params.row.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0),
      valueFormatter: (params) => `$${params.value.toFixed(2)}`
    }
  ];

  // Filter orders based on search term 
  const filteredOrders = orders.filter(order => 
    Object.values(order).some(
      value => String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Box sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        gap: 2
      }}>
        <Typography variant="h6">Order History</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* search */}
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search orders..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {/* New view toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="all">All Orders</ToggleButton>
            <ToggleButton value="my">My Orders</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {}
      <DataGrid
        rows={filteredOrders}
        columns={columns}
        getRowId={(row) => row._id}
        loading={loading}
        pageSize={10}
        rowsPerPageOptions={[5, 10, 25]}
        disableSelectionOnClick
        sx={{
          '& .MuiDataGrid-cell': {
            padding: '8px 16px',
          },
        }}
      />
    </Box>
  );
}