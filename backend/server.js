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

// Connect to MongoDB Atlas
// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => console.log('MongoDB Connected'))
//   .catch(err => console.error('MongoDB connection error:', err));
mongoose.connect('mongodb://localhost:27017/inventoryDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  

// Supplier Schema
const SupplierSchema = new mongoose.Schema({
    supplier_id: { type: String, required: true, unique: true },
    name: { type: String, required: true }
});
const Supplier = mongoose.model('Supplier', SupplierSchema);

// Order Schema
const OrderSchema = new mongoose.Schema({
    order_id: { type: String, required: true, unique: true },
    supplier_id: { type: String, required: true, ref: 'Supplier' },
    date: { type: Date, required: true }
});
const Order = mongoose.model('Order', OrderSchema);

// Customer (Student) Schema
const CustomerSchema = new mongoose.Schema({
    student_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    date: { type: Date, default: Date.now }
});
const Customer = mongoose.model('Customer', CustomerSchema);

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
    transaction_id: { type: String, required: true, unique: true },
    student_id: { type: String, required: true, ref: 'Customer' },
    date: { type: Date, default: Date.now },
    quantity: { type: Number, required: true }
});
const Transaction = mongoose.model('Transaction', TransactionSchema);

// Transaction_Item Schema (Intermediate Table)
const TransactionItemSchema = new mongoose.Schema({
    transaction_id: { type: String, required: true, ref: 'Transaction' },
    item_id: { type: String, required: true, ref: 'Item' },
    quantity: { type: Number, required: true }
});
const TransactionItem = mongoose.model('TransactionItem', TransactionItemSchema);

module.exports = { Supplier, Order, Customer, Item, Transaction, TransactionItem };


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
