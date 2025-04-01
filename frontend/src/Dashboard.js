class Dashboard {
    constructor() {
      this.adminToken = null;
      this.init();
    }
  
    async init() {
      this.renderDashboard();
    }
  
    async login(username, password) {
      const res = await fetch('http://localhost:5000/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        this.adminToken = data.token;
        this.renderDashboard();
      } else {
        alert('Login failed!');
      }
    }
  
    async fetchInventory() {
      const res = await fetch('http://localhost:5000/inventory');
      return res.json();
    }
  
    async addItem(name, category, quantity, unit, supplier) {
      await fetch('http://localhost:5000/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`
        },
        body: JSON.stringify({ name, category, quantity, unit, supplier })
      });
      this.renderDashboard();
    }
  
    async withdrawItem(itemId, quantity, studentId) {
      await fetch('http://localhost:5000/transaction/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity, studentId })
      });
      this.renderDashboard();
    }
  
    renderLogin() {
      document.body.innerHTML = `
        <div>
          <h2>Admin Login</h2>
          <input id="username" placeholder="Username" />
          <input id="password" type="password" placeholder="Password" />
          <button onclick="dashboard.login(document.getElementById('username').value, document.getElementById('password').value)">Login</button>
        </div>
      `;
    }
  
    async renderDashboard() {
      const inventory = await this.fetchInventory();
      document.body.innerHTML = `
        <h2>Inventory Management</h2>
        <div>
          <input id="name" placeholder="Item Name" />
          <input id="category" placeholder="Category" />
          <input id="quantity" type="number" placeholder="Quantity" />
          <input id="unit" placeholder="Unit" />
          <input id="supplier" placeholder="Supplier" />
          <button onclick="dashboard.addItem(
            document.getElementById('name').value,
            document.getElementById('category').value,
            document.getElementById('quantity').value,
            document.getElementById('unit').value,
            document.getElementById('supplier').value
          )">Add Item</button>
        </div>
        <h2>Withdraw Item</h2>
        <div>
          <select id="itemId">
            ${inventory.map(item => `<option value="${item._id}">${item.name} (${item.quantity})</option>`).join('')}
          </select>
          <input id="withdrawQuantity" type="number" placeholder="Quantity" />
          <input id="studentId" placeholder="Student ID" />
          <button onclick="dashboard.withdrawItem(
            document.getElementById('itemId').value,
            document.getElementById('withdrawQuantity').value,
            document.getElementById('studentId').value
          )">Withdraw</button>
        </div>
      `;
    }
  }
  
  const dashboard = new Dashboard();
  