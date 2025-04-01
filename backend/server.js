const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Admin Schema
const AdminSchema = new mongoose.Schema({
    username: String,
    password: String
});
const Admin = mongoose.model('Admin', AdminSchema);

// Inventory Schema
const InventorySchema = new mongoose.Schema({
    name: String,
    category: String,
    quantity: Number,
    unit: String,
    supplier: String,
    lastStocked: { type: Date, default: Date.now }
});
const Inventory = mongoose.model('Inventory', InventorySchema);

// Transactions Schema
const TransactionSchema = new mongoose.Schema({
    itemId: mongoose.Schema.Types.ObjectId,
    type: String, // 'withdrawal' or 'restock'
    quantity: Number,
    studentId: String,
    handledBy: String,
    date: { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', TransactionSchema);

// Admin Routes
app.post('/admin/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ username, password: hashedPassword });
    await newAdmin.save();
    res.json({ message: 'Admin registered' });
});

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// Inventory Routes
app.get('/inventory', async (req, res) => {
    const items = await Inventory.find();
    res.json(items);
});

app.post('/inventory', async (req, res) => {
    const newItem = new Inventory(req.body);
    await newItem.save();
    res.json(newItem);
});

app.put('/inventory/:id', async (req, res) => {
    const updatedItem = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedItem);
});

app.delete('/inventory/:id', async (req, res) => {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
});

app.post('/transaction/withdraw', async (req, res) => {
    if (!req.body.studentId) return res.status(400).json({ message: 'Student ID is required' });
    
    const transaction = new Transaction({ ...req.body, type: 'withdrawal' });
    await transaction.save();
    await Inventory.findByIdAndUpdate(req.body.itemId, { $inc: { quantity: -req.body.quantity } });
    res.json(transaction);
});

app.post('/transaction/restock', async (req, res) => {
    const transaction = new Transaction({ ...req.body, type: 'restock' });
    await transaction.save();
    await Inventory.findByIdAndUpdate(req.body.itemId, { $inc: { quantity: req.body.quantity } });
    res.json(transaction);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
