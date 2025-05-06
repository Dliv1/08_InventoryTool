const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Parse JSON bodies
app.use(express.json());

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Connect to MongoDB Atlas
console.log("Connecting to:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Supplier Schema
const SupplierSchema = new mongoose.Schema({
    supplier_id: { type: String, required: true, unique: true },
    name: { type: String, required: true }
});
const Supplier = mongoose.model('Supplier', SupplierSchema);

// Order Schema
const OrderSchema = new mongoose.Schema({
    order_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    items: [{
      item_id: String,
      name: String,
      quantity: Number
    }],
    status: { type: String, default: 'completed' },
    date: { type: Date, default: Date.now }
  });
const Order = mongoose.model('Order', OrderSchema);

/**
 * Student Schema
 */
 const StudentSchema = new mongoose.Schema({
    student_id: { 
      type: String, 
      required: true, 
      unique: true,
      validate: {
        validator: v => /^[A-Z]{2}\d{5}$/.test(v),
        message: props => `${props.value} is not a valid UMBC ID (format: AB12345)`
      }
    },
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      validate: {
        validator: v => v.endsWith('@umbc.edu'),
        message: props => `${props.value} must be a UMBC email`
      }
    },
    password: { type: String, required: true }
  });
const Student = mongoose.model('Student', StudentSchema);

// Item Schema
const ItemSchema = new mongoose.Schema({
  item_id: { type: String, required: true, unique: true },
  supplier_id: { type: String, required: true, ref: 'Supplier' },
  name: { type: String, required: true },
  quantity: { type: Number, required: true }
});
const Item = mongoose.model('Item', ItemSchema);

// Transaction Schema
const TransactionSchema = new mongoose.Schema({
    transaction_id: { 
      type: String, 
      required: true, 
      unique: true,
      default: () => `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}` 
    },
    user_id: { type: String, required: true },
    type: { type: String, enum: ['withdrawal', 'restock'], required: true },
    date: { type: Date, default: Date.now }
  });
const Transaction = mongoose.model('Transaction', TransactionSchema);

// Transaction_Item Schema (Intermediate Table)
const TransactionItemSchema = new mongoose.Schema({
    transaction_id: { type: String, ref: 'Transaction', required: true },
    item_id: { type: String, required: true },
    quantity: { type: Number, required: true }
  });
const TransactionItem = mongoose.model('TransactionItem', TransactionItemSchema);

//Inventory Schema (new add)
const InventorySchema = new mongoose.Schema({
  item_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  current_stock: { type: Number, required: true, min: 0 },
  threshold: { type: Number, required: true }, // Low stock alert level
  last_restocked: { type: Date },
  demand_score: { type: Number, default: 0 } // For analytics
});
const Inventory = mongoose.model('Inventory', InventorySchema);


/**
 * Admin Schema
 */
 const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
const Admin = mongoose.model('Admin', AdminSchema);

const CartSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    items: [{
      item_id: { type: String, required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      addedAt: { type: Date, default: Date.now }
    }],
    lastUpdated: { type: Date, default: Date.now }
  });
const Cart = mongoose.model('Cart', CartSchema);

module.exports = { Supplier, Order, Student, Item, Transaction, TransactionItem, Admin, Cart, Inventory };

/* ========== AUTH MIDDLEWARE ========== */

// Add token check to authenticate middleware
const authMiddleware = async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) throw new Error('No token provided');
      if (tokenBlacklist.has(token)) throw new Error('Token invalidated');
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      // Unified user lookup
      req.user = decoded.userType === 'admin'
        ? await Admin.findById(decoded.id)
        : await Student.findOne({ 
            $or: [
              { student_id: decoded.id },
              { email: decoded.id }
            ]
          });
  
      if (!req.user) throw new Error('User not found');
      next();
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  };
    // Logout (Token Invalidation)
const tokenBlacklist = new Set();
app.post('/logout', authMiddleware, (req, res) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  tokenBlacklist.add(token);
  res.json({ message: 'Logged out successfully' });
});

/* ========== AUTHENTICATION ROUTES ========== */

/**
 * Admin Registration
 * Creates new admin account with hashed password
 */
 app.post('/admin/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ username, password: hashedPassword });
    await admin.save();

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Username already exists' });
    } else {
      res.status(400).json({ message: err.message });
    }
  }
});

/**
 * Admin Login
 * Verifies credentials and returns JWT token
 */
 app.post('/admin/login', async (req, res) => {
    try {
      console.log('Login attempt:', req.body);
      const { username, password } = req.body;
      const admin = await Admin.findOne({ username });
  
      console.log('Found admin:', admin ? 'Yes' : 'No');
      if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
  
      const isMatch = await bcrypt.compare(password, admin.password);
      console.log('Password match:', isMatch ? 'Yes' : 'No');
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  
      const token = jwt.sign(
        { 
          id: admin._id.toString(),
          userType: 'admin'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
  
      res.json({ token, user: admin });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: err.message });
    }
  });

/**
 * Student Registration
 * Validates UMBC ID format and creates student account
 */
 app.post('/student/register', async (req, res) => {
    try {
      const { student_id, name, email, password } = req.body;
      
      const errors = [];
      if (!/^[A-Z]{2}\d{5}$/.test(student_id)) {
        errors.push('Invalid student ID format (AB12345 required)');
      }
      if (!email.endsWith('@umbc.edu')) {
        errors.push('Email must be a valid UMBC email');
      }
      if (errors.length > 0) {
        return res.status(400).json({ message: errors.join(', ') });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const student = new Student({
        student_id,
        name,
        email,
        password: hashedPassword
      });
      await student.save();

      const token = jwt.sign({ id: student.student_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
      res.status(201).json({ 
        token,
        user: {
          student_id: student.student_id,
          name: student.name,
          email: student.email
        }
      });
    } catch (err) {
      if (err.code === 11000) {
        res.status(400).json({ message: 'Student ID or email already registered' });
      } else {
        res.status(400).json({ message: err.message });
      }
    }
  });

/**
 * Student Login
 */
 app.post('/student/login', async (req, res) => {
    try {
      const { identifier, password } = req.body;
      const student = await Student.findOne({
        $or: [
          { student_id: identifier },
          { email: identifier }
        ]
      });
  
      if (!student) return res.status(401).json({ message: 'Invalid credentials' });
  
      const isMatch = await bcrypt.compare(password, student.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  
      const token = jwt.sign(
        { 
          id: student.student_id, // Use string ID
          userType: 'student'     // Explicit type
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
  
      res.json({ token, user: student });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

// logout route
app.post('/logout', (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader) return res.status(401).json({ message: 'No token provided' });
      
      const token = authHeader.split(' ')[1]; // Get token after 'Bearer '
      if (!token) return res.status(401).json({ message: 'Malformed token' });
      
      tokenBlacklist.add(token);
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Logout failed' });
    }
  });

/* ========== INVENTORY ROUTES ========== */
/**
 * Get Inventory
 * Returns different views for students vs admins:
 * - Students see only available items
 * - Admins see full inventory with analytics
 */
 app.get('/inventory', async (req, res) => {
  // Check if this is a student request (no token)
  const isStudent = !req.headers.authorization || req.headers.authorization === 'student';
  try {
    // Admins see all items, students see only active items
    if (req.user?.role === 'admin') {
      // Admin view with analytics
      const inventory = await Inventory.find();
      res.json(inventory);
    } else {
      // Student view - only show available items
      const inventory = await Inventory.find({ current_stock: { $gt: 0 } });
      res.json(inventory);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Create Inventory Item (Admin Only)
 * Auto-calculates threshold if not provided (20% of initial stock)
 */

app.post('/inventory', authMiddleware, async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['item_id', 'name', 'category', 'current_stock'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    // Check for existing item with same item_id or name
    const existingItem = await Inventory.findOne({
      $or: [
        { item_id: req.body.item_id },
        { name: req.body.name }
      ]
    });

    if (existingItem) {
      return res.status(400).json({
        message: 'An item with this ID or name already exists'
      });
    }

    // Create new item with default values if not provided
    const newItem = new Inventory({
      item_id: req.body.item_id,
      name: req.body.name,
      category: req.body.category,
      current_stock: Number(req.body.current_stock) || 0,
      threshold: Number(req.body.threshold) || Math.floor((req.body.current_stock || 0) * 0.2),
      last_restocked: req.body.last_restocked || new Date(),
      active: true
    });
    
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(400).json({ 
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
});

/**
 * Update Inventory Item (Admin Only)
 * Allows modification of item details (excluding direct stock changes)
 * @param {string} id - Item ID to update
 * @body {object} updates - Fields to update (name, category, threshold, etc.)
 */
 app.put('/inventory/:id', authMiddleware, async (req, res) => {
    try {
      if ('current_stock' in req.body || 'demand_score' in req.body) {
        return res.status(400).json({ 
          message: 'Use transaction endpoints to modify stock levels' 
        });
      }

      // Find and update the item in a single operation
      const updatedItem = await Inventory.findOneAndUpdate(
        { $or: [
          { item_id: req.params.id },
          { _id: req.params.id }
        ] },
        req.body,
        { new: true, runValidators: true }
      );
      
      if (!updatedItem) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      res.json(updatedItem);
    } catch (err) {
      console.error('Error updating item:', err);
      res.status(400).json({ 
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    }
  });

/**
 * Delete Inventory Item (Admin Only)
 * Performs safety checks before deletion:
 * - Verifies no existing transactions reference the item
 * - Maintains database integrity
 */
 app.delete('/inventory/:id', authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      console.log('Attempting to delete item with ID:', req.params.id);
      
      // First find the item by item_id (not _id)
      const itemToDelete = await Inventory.findOne(
        { item_id: req.params.id },
        null,
        { session }
      );

      if (!itemToDelete) {
        throw new Error('Item not found');
      }

      // Now delete using the found item's _id with session
      const deletedItem = await Inventory.findByIdAndDelete(
        itemToDelete._id,
        { session }
      );

      if (!deletedItem) {
        throw new Error('Error deleting item');
      }

      // Delete related transactions using the item_id with session
      await Transaction.deleteMany(
        { item_id: itemToDelete.item_id },
        { session }
      );

      res.json({
        message: `Item ${deletedItem.name} (${deletedItem.item_id}) deleted successfully`
      });
    }, { session });
  } catch (err) {
    console.error('Error deleting item:', err);
    const statusCode = err.message === 'Item not found' ? 404 : 500;
    res.status(statusCode).json({ 
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } finally {
    await session.endSession();
  }
});

/* ========== TRANSACTION ROUTES ========== */
/**
 * Admin Restock
 * Processes inventory replenishment with:
 * - New item auto-creation
 * - Stock level updates
 * - Restock timestamp
 */
app.post('/transaction/restock', authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items } = req.body;
    const transaction = new Transaction({
      transaction_id: `TXN-${Date.now()}`,
      user_id: req.user._id || req.user.student_id,
      type: 'restock',
      date: new Date()
    });

    await transaction.save({ session });

    for (const item of items) {
      const inventoryItem = await Inventory.findOne({ item_id: item.item_id }).session(session);
      
      if (!inventoryItem) {
        if (!item.name) throw new Error('New items require name');
        const newItem = new Inventory({
          item_id: item.item_id,
          name: item.name,
          category: item.category || 'uncategorized',
          current_stock: item.quantity,
          threshold: item.threshold || Math.floor(item.quantity * 0.2)
        });
        await newItem.save({ session });
      } else {
          inventoryItem.current_stock += item.quantity;
          inventoryItem.last_restocked = new Date();
          await inventoryItem.save({ session });
        }
  
        await new TransactionItem({
          transaction_id: transaction.transaction_id,
          item_id: item.item_id,
          quantity: item.quantity
        }).save({ session });
      }
  
      await session.commitTransaction();
      res.json({
        success: true,
        transaction_id: transaction.transaction_id,
        updatedInventory: await Inventory.find()
      });
    } catch (err) {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: err.message });
    } finally {
      session.endSession();
    }
  });
    
// =============== ORDER ROUTES ==================

// Create a new order and update inventory
app.post('/api/orders', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { studentId, items } = req.body;

    // Validate input
    if (!studentId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid order data' });
    }


    // Get current inventory for validation
    const inventoryItems = await Inventory.find({
      _id: { $in: items.map(item => item.itemId) }
    }).session(session);

    // Validate stock levels
    for (const item of items) {
      const inventoryItem = inventoryItems.find(i => i._id.toString() === item.itemId);
      if (!inventoryItem) {
        throw new Error(`Item ${item.itemId} not found`);
      }
      if (inventoryItem.current_stock < item.quantity) {
        throw new Error(`Insufficient stock for item ${inventoryItem.name}`);
      }
    }

    // Create order
    const order = new Order({
      studentId,
      items: items.map(item => ({
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        item_id: item.item_id
      })),
      status: 'completed'
    });

    // Update inventory for each item
    const bulkOps = items.map(item => ({
      updateOne: {
        filter: { _id: item.itemId },
        update: { 
          $inc: { current_stock: -item.quantity },
          $set: { last_restocked: new Date() }
        },
        session
      }
    }));

    await Promise.all([
      order.save({ session }),
      Inventory.bulkWrite(bulkOps, { session })
    ]);

    await session.commitTransaction();
    await session.endSession();

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// Get order history for a student
app.get('/api/orders/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const orders = await Order.find({ studentId })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// =============== CART ROUTES ==================
// Student Cart Endpoints (No Auth Required)
    app.get('/cart/student', async (req, res) => {
      try {
        // For demo, we'll use a session-based cart
        const cart = req.session.cart || [];
        res.json({ items: cart });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/cart/student/add', async (req, res) => {
      try {
        const { itemId, quantity = 1 } = req.body;
        
        // Get item details
        const item = await Inventory.findOne({ _id: itemId });
        if (!item) {
          return res.status(404).json({ error: 'Item not found' });
        }

        // Initialize cart if it doesn't exist
        if (!req.session.cart) {
          req.session.cart = [];
        }

        // Check if item is already in cart
        const existingItemIndex = req.session.cart.findIndex(i => i.itemId === itemId);
        
        if (existingItemIndex >= 0) {
          // Update quantity if item exists
          req.session.cart[existingItemIndex].quantity += quantity;
        } else {
          // Add new item to cart
          req.session.cart.push({
            itemId: item._id,
            name: item.name,
            quantity,
            price: 0, // For future use
            item_id: item.item_id // Include the item_id for reference
          });
        }

        res.json({ success: true, cart: req.session.cart });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Update item quantity in student cart
    app.put('/cart/student/item/:itemId', async (req, res) => {
      try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!req.session.cart) {
          return res.status(404).json({ error: 'Cart not found' });
        }

        const itemIndex = req.session.cart.findIndex(item => item.itemId === itemId);
        if (itemIndex === -1) {
          return res.status(404).json({ error: 'Item not found in cart' });
        }

        // Update the quantity
        req.session.cart[itemIndex].quantity = quantity;
        
        res.json({ 
          success: true, 
          cart: req.session.cart 
        });
      } catch (err) {
        console.error('Error updating cart item:', err);
        res.status(500).json({ error: 'Failed to update cart item' });
      }
    });

    // Remove item from student cart
    app.delete('/cart/student/item/:itemId', async (req, res) => {
      try {
        const { itemId } = req.params;

        if (!req.session.cart) {
          return res.status(404).json({ error: 'Cart not found' });
        }

        const initialLength = req.session.cart.length;
        req.session.cart = req.session.cart.filter(item => item.itemId !== itemId);
        
        if (req.session.cart.length === initialLength) {
          return res.status(404).json({ error: 'Item not found in cart' });
        }

        res.json({ 
          success: true, 
          cart: req.session.cart 
        });
      } catch (err) {
        console.error('Error removing item from cart:', err);
        res.status(500).json({ error: 'Failed to remove item from cart' });
      }
    });

    // Checkout student cart
    app.post('/cart/student/checkout', async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        if (!req.session.cart || req.session.cart.length === 0) {
          return res.status(400).json({ 
            success: false,
            message: 'Cart is empty' 
          });
        }


        // Create transaction record
        const transaction = new Transaction({
          transaction_id: `STU-${Date.now()}`,
          user_id: 'student',
          type: 'withdrawal',
          date: new Date()
        });

        await transaction.save({ session });

        // Process each item in cart
        for (const item of req.session.cart) {
          const inventoryItem = await Inventory.findOne({ _id: item.itemId }).session(session);
          
          if (!inventoryItem) {
            throw new Error(`Item ${item.name} not found`);
          }


          if (inventoryItem.current_stock < item.quantity) {
            throw new Error(`Not enough stock for ${item.name}`);
          }


          // Update inventory
          inventoryItem.current_stock -= item.quantity;
          await inventoryItem.save({ session });

          // Record transaction item
          await new TransactionItem({
            transaction_id: transaction.transaction_id,
            item_id: inventoryItem.item_id,
            quantity: -item.quantity // Negative for withdrawal
          }).save({ session });
        }


        // Clear cart after successful checkout
        const cartItems = [...req.session.cart];
        req.session.cart = [];

        await session.commitTransaction();
        res.json({ 
          success: true, 
          transaction_id: transaction.transaction_id,
          message: 'Checkout successful',
          items: cartItems
        });
      } catch (err) {
        await session.abortTransaction();
        console.error('Checkout error:', err);
        res.status(400).json({ 
          success: false, 
          message: err.message 
        });
      } finally {
        session.endSession();
      }
    });

    // Admin/Authenticated User Cart Endpoints
    // Get cart contents
app.get('/cart', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.student_id || req.user._id.toString();
      const cart = await Cart.findOne({ user_id: userId });
      res.json(cart || { items: [] }); // Return empty array if no cart
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Add items to cart (Fixed)
  app.post('/cart/add', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.student_id || req.user._id.toString();
      const { items } = req.body; // Expect array of {item_id, quantity}
  
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Expected array of items" });
      }
  
      // Verify all items exist first
      for (const item of items) {
        const exists = await Inventory.exists({ item_id: item.item_id });
        if (!exists) {
          return res.status(404).json({ error: `Item ${item.item_id} not found` });
        }
      }
  
      // Get item names
      const inventoryItems = await Inventory.find({ 
        item_id: { $in: items.map(i => i.item_id) } 
      });
  
      // Prepare cart items
      const cartItems = items.map(item => {
        const inventoryItem = inventoryItems.find(i => i.item_id === item.item_id);
        return {
          item_id: item.item_id,
          name: inventoryItem.name,
          quantity: item.quantity
        };
      });
  
      // Update cart
      const cart = await Cart.findOneAndUpdate(
        { user_id: userId },
        { 
          $push: { items: { $each: cartItems } },
          $set: { lastUpdated: new Date() }
        },
        { upsert: true, new: true }
      );
  
      res.json({ success: true, cart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Update item quantity
  app.put('/cart/item/:item_id', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.student_id || req.user._id.toString();
      const { quantity } = req.body;
  
      const cart = await Cart.findOneAndUpdate(
        { 
          user_id: userId,
          'items.item_id': req.params.item_id
        },
        { 
          $set: { 
            'items.$.quantity': quantity,
            lastUpdated: new Date()
          }
        },
        { new: true }
      );
  
      if (!cart) {
        return res.status(404).json({ error: "Item not found in cart" });
      }
  
      res.json({ success: true, cart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Remove item from cart
  app.delete('/cart/item/:item_id', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.student_id || req.user._id.toString();
  
      const cart = await Cart.findOneAndUpdate(
        { user_id: userId },
        { 
          $pull: { items: { item_id: req.params.item_id } },
          $set: { lastUpdated: new Date() }
        },
        { new: true }
      );
  
      res.json({ success: true, cart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

//Fincalize checkout and order items in cart
app.post('/cart/checkout', authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const userId = req.user.student_id || req.user._id.toString();
      const cart = await Cart.findOne({ user_id: userId }).session(session);
  
      // Validate cart exists and has items (UNCHANGED)
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }
  
      // Verify all items are available (UNCHANGED)
      for (const item of cart.items) {
        const inventoryItem = await Inventory.findOne({ 
          item_id: item.item_id 
        }).session(session);
        
        if (!inventoryItem) {
          throw new Error(`Item ${item.item_id} no longer exists`);
        }
        if (inventoryItem.current_stock < item.quantity) {
          throw new Error(`Only ${inventoryItem.current_stock} ${item.name} remaining`);
        }
      }
  
      // Create transaction record (UNCHANGED)
      const transaction = new Transaction({
        transaction_id: `TXN-${Date.now()}`,
        user_id: userId,
        type: 'withdrawal',
        date: new Date()
      });
      await transaction.save({ session });
  
      // ===== NEW: Create Order Record =====
      const order = new Order({
        order_id: transaction.transaction_id, // Link to transaction
        user_id: userId,
        items: cart.items.map(item => ({
          item_id: item.item_id,
          name: item.name,
          quantity: item.quantity
        })),
        status: 'completed'
      });
      await order.save({ session });
  
      // Process each item (UNCHANGED)
      const transactionItems = [];
      for (const item of cart.items) {
        // Update inventory (UNCHANGED)
        await Inventory.updateOne(
          { item_id: item.item_id },
          { $inc: { current_stock: -item.quantity } }
        ).session(session);
  
        // Record transaction item (UNCHANGED)
        transactionItems.push({
          transaction_id: transaction._id,
          item_id: item.item_id,
          quantity: item.quantity
        });
      }
  
      await TransactionItem.insertMany(transactionItems, { session });
  
      // Clear cart (UNCHANGED)
      await Cart.deleteOne({ user_id: userId }).session(session);
  
      await session.commitTransaction();
      res.json({ 
        success: true,
        message: 'Checkout completed successfully',
        transaction_id: transaction._id,
        order_id: order.order_id // Return BOTH IDs for backward compatibility
      });
  
    } catch (err) {
      await session.abortTransaction();
      res.status(400).json({ 
        success: false,
        error: err.message,
        suggestion: err.message.includes('remaining') ? 'Adjust your cart quantities' : null
      });
    } finally {
      session.endSession();
    }
  });
// ======================
// Real-Time Data Endpoints
// ======================

// Get current stock levels with low-stock alerts
app.get('/inventory/current', async (req, res) => {
    try {
        const inventory = await Inventory.find().lean();
        const analytics = {
            total_items: inventory.length,
            low_stock_items: inventory.filter(i => i.current_stock < i.threshold),
            most_popular: [...inventory].sort((a, b) => b.demand_score - a.demand_score).slice(0, 5)
        };
        res.json({ inventory, analytics });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Demand Analytics (Admin Only)
 * Returns 7-day demand trends by item
 * Uses MongoDB aggregation pipeline to:
 * - Filter withdrawals from last week
 * - Group by item and day
 * - Calculate total quantities
 */
app.get('/analytics/demand', authMiddleware, async (req, res) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const pipeline = [
        {
            $match: {
                date: { $gte: sevenDaysAgo },
                type: 'withdrawal'
            }
        },
        {
            $lookup: {
                from: 'transactionitems',
                localField: 'transaction_id',
                foreignField: 'transaction_id',
                as: 'items'
            }
        },
        {
            $unwind: '$items'
        },
        {
            $group: {
                _id: {
                    item_id: '$items.item_id',
                    day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
                },
                totalQuantity: { $sum: '$items.quantity' }
            }
        },
        {
            $lookup: {
                from: 'inventories',
                localField: '_id.item_id',
                foreignField: 'item_id',
                as: 'item'
            }
        },
        {
            $unwind: '$item'
        },
        {
            $project: {
                _id: 0,
                date: '$_id.day',
                item_name: '$item.name',
                quantity: '$totalQuantity'
            }
        }
    ];

    try {
        const trends = await Transaction.aggregate(pipeline);
        res.json(trends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============== ORDER HISTORY =================
/**
 * Get ALL order history (all users)
 */
 app.get('/orders/history/all', authMiddleware, async (req, res) => {
    try {
      const orders = await Order.find().sort({ date: -1 }); // Newest first
      res.json({ success: true, orders });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  /**
   * Get ONLY the logged-in user's orders
   */
  app.get('/orders/history/my', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.student_id || req.user._id.toString();
      const orders = await Order.find({ user_id: userId }).sort({ date: -1 });
      res.json({ success: true, orders });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

// ======================
// Helper Functions
// ======================
async function getCurrentStock() {
    return await Inventory.find({}, 'item_id name current_stock threshold');
}

//temp middleware
app.use((req, res, next) => {
    console.log('Received Authorization:', req.headers['authorization']);
    next();
  });

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
