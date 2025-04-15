import React from 'react';
import { useState, useEffect } from 'react';
import { getInventory } from '../../api/inventory';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function StatsOverview({ token }) {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: [],
    popularItems: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getInventory(token);
        const inventory = response.data;
        
        setStats({
          totalItems: inventory.length,
          lowStockItems: inventory.filter(i => i.current_stock < i.threshold),
          popularItems: [...inventory].sort((a, b) => b.demand_score - a.demand_score).slice(0, 5)
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, [token]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Inventory Analytics</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Items</Typography>
              <Typography variant="h3">{stats.totalItems}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Low Stock Items</Typography>
              <Typography variant="h3">{stats.lowStockItems.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Popular Items</Typography>
          <BarChart
            width={500}
            height={300}
            data={stats.popularItems}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="demand_score" fill="#8884d8" name="Demand Score" />
          </BarChart>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Stock Status</Typography>
          <PieChart width={400} height={300}>
            <Pie
              data={[
                { name: 'In Stock', value: stats.totalItems - stats.lowStockItems.length },
                { name: 'Low Stock', value: stats.lowStockItems.length }
              ]}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {[0, 1].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </Grid>
      </Grid>
    </Box>
  );
}