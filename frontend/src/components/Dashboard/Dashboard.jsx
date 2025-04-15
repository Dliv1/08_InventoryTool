import React, { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import InventoryManager from './InventoryManager';
import OrderHistory from './OrderHistory';
import CartManager from './CartManager';
import StatsOverview from './StatsOverview';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Dashboard({ token }) {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Inventory" />
          <Tab label="Cart" />
          <Tab label="Orders" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <InventoryManager token={token} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <CartManager token={token} />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <OrderHistory token={token} />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <StatsOverview token={token} />
      </TabPanel>
    </Box>
  );
}