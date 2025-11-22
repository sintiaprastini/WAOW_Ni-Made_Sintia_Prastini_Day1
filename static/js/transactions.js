let customers = [];
let products = [];
let currentItems = [];

// Load data saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    loadProducts();
    loadTransactions();
    loadSalesSummary();
    addItemRow(); // Tambah satu baris item awal
});

// Load customers untuk dropdown
async function loadCustomers() {
    try {
        const response = await fetch('/api/customers');
        customers = await response.json();
        const select = document.getElementById('customer_id');
        select.innerHTML = '<option value="">Pilih Customer</option>';
        
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.CustomerID;
            option.textContent = `[${customer.CustomerID}] ${customer.Gender}, ${customer.Age} years, Income: $${customer.Annual_Income}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading customers:', error);
        showNotification('Error loading customers', 'error');
    }
}

// Load products untuk dropdown items
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error');
    }
}

// Load transactions
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions');
        const transactions = await response.json();
        
        const tbody = document.querySelector('#transactionTable tbody');
        tbody.innerHTML = '';
        
        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            const transactionDate = new Date(transaction.TransactionDate).toLocaleDateString('id-ID');
            const customer = customers.find(c => c.CustomerID === transaction.CustomerID);
            const customerInfo = customer ? `[${customer.CustomerID}] ${customer.Gender}, ${customer.Age} years` : 'Unknown';
            
            row.innerHTML = `
                <td>${transaction.TransactionID}</td>
                <td>${customerInfo}</td>
                <td>${transactionDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="viewTransactionItems(${transaction.TransactionID})">
                        View Items
                    </button>
                </td>
                <td>$${transaction.TotalAmount}</td>
                <td>
                    <span class="badge bg-${getPaymentBadgeColor(transaction.PaymentMethod)}">
                        ${transaction.PaymentMethod}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewTransactionDetails(${transaction.TransactionID})">
                        📋 Details
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading transactions:', error);
        showNotification('Error loading transactions', 'error');
    }
}

// Load sales summary
async function loadSalesSummary() {
    try {
        const response = await fetch('/api/transactions/summary');
        const summary = await response.json();
        
        document.getElementById('totalSales').textContent = `$${summary.total_sales.toFixed(2)}`;
        document.getElementById('totalTransactions').textContent = summary.recent_transactions.length;
        
        const avgTransaction = summary.total_sales / (summary.recent_transactions.length || 1);
        document.getElementById('avgTransaction').textContent = `$${avgTransaction.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error loading sales summary:', error);
    }
}

// Tambah baris item
function addItemRow() {
    const container = document.getElementById('itemsContainer');
    const itemId = Date.now(); // ID unik untuk item
    
    const row = document.createElement('div');
    row.className = 'item-row row mb-2';
    row.id = `item-${itemId}`;
    row.innerHTML = `
        <div class="col-md-4">
            <select class="form-control product-select" onchange="updateItemPrice(${itemId})" required>
                <option value="">Pilih Product</option>
            </select>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control quantity" placeholder="Qty" 
                   min="1" value="1" onchange="calculateItemSubtotal(${itemId})" required>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control unit-price" placeholder="Unit Price" step="0.01" readonly>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control subtotal" placeholder="Subtotal" step="0.01" readonly>
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-sm btn-danger" onclick="removeItemRow(${itemId})">
                ❌ Hapus
            </button>
        </div>
    `;
    
    container.appendChild(row);
    
    // Populate product options
    const productSelect = row.querySelector('.product-select');
    products.forEach(product => {
        if (product.Stock > 0) {
            const option = document.createElement('option');
            option.value = product.ProductID;
            option.textContent = `${product.Name} - $${product.Price} (Stock: ${product.Stock})`;
            option.setAttribute('data-price', product.Price);
            productSelect.appendChild(option);
        }
    });
    
    calculateTotal();
}

// Hapus baris item
function removeItemRow(itemId) {
    const row = document.getElementById(`item-${itemId}`);
    if (row) {
        row.remove();
        calculateTotal();
    }
}

// Update harga saat product dipilih
function updateItemPrice(itemId) {
    const row = document.getElementById(`item-${itemId}`);
    const select = row.querySelector('.product-select');
    const selectedOption = select.selectedOptions[0];
    const unitPriceInput = row.querySelector('.unit-price');
    
    if (selectedOption && selectedOption.value) {
        const price = selectedOption.getAttribute('data-price');
        unitPriceInput.value = price;
        calculateItemSubtotal(itemId);
    } else {
        unitPriceInput.value = '';
        row.querySelector('.subtotal').value = '';
    }
}

// Hitung subtotal per item
function calculateItemSubtotal(itemId) {
    const row = document.getElementById(`item-${itemId}`);
    const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
    const unitPrice = parseFloat(row.querySelector('.unit-price').value) || 0;
    const subtotalInput = row.querySelector('.subtotal');
    
    const subtotal = quantity * unitPrice;
    subtotalInput.value = subtotal.toFixed(2);
    
    calculateTotal();
}

// Hitung total amount
function calculateTotal() {
    const subtotalInputs = document.querySelectorAll('.subtotal');
    let total = 0;
    let totalItems = 0;
    
    subtotalInputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        total += value;
        
        const row = input.closest('.item-row');
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        totalItems += quantity;
    });
    
    document.getElementById('totalAmount').textContent = total.toFixed(2);
    document.getElementById('totalItems').textContent = totalItems;
}

// Form submission untuk membuat transaction
document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const customerId = document.getElementById('customer_id').value;
    const paymentMethod = document.getElementById('payment_method').value;
    
    if (!customerId || !paymentMethod) {
        showNotification('Please select customer and payment method', 'error');
        return;
    }
    
    // Kumpulkan items
    const items = [];
    const itemRows = document.querySelectorAll('.item-row');
    
    let hasValidItems = false;
    
    for (const row of itemRows) {
        const productSelect = row.querySelector('.product-select');
        const quantityInput = row.querySelector('.quantity');
        const unitPriceInput = row.querySelector('.unit-price');
        const subtotalInput = row.querySelector('.subtotal');
        
        const productId = productSelect.value;
        const quantity = quantityInput.value;
        const unitPrice = unitPriceInput.value;
        const subtotal = subtotalInput.value;
        
        if (productId && quantity && unitPrice) {
            items.push({
                product_id: parseInt(productId),
                quantity: parseInt(quantity),
                unit_price: parseFloat(unitPrice),
                subtotal: parseFloat(subtotal)
            });
            hasValidItems = true;
        }
    }
    
    if (!hasValidItems) {
        showNotification('Please add at least one valid item', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customer_id: parseInt(customerId),
                payment_method: paymentMethod,
                items: items
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Transaction created successfully!', 'success');
            
            // Reset form
            document.getElementById('transactionForm').reset();
            document.getElementById('itemsContainer').innerHTML = '';
            addItemRow();
            calculateTotal();
            
            // Refresh data
            loadTransactions();
            loadSalesSummary();
            loadProducts(); // Refresh product stock
        } else {
            showNotification('Error: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error creating transaction:', error);
        showNotification('Error creating transaction', 'error');
    }
});

// View transaction items
async function viewTransactionItems(transactionId) {
    try {
        const response = await fetch(`/api/transactions/${transactionId}/details`);
        const items = await response.json();
        
        if (response.ok) {
            let itemsHtml = '<ul class="list-group">';
            items.forEach(item => {
                itemsHtml += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${item.ProductName}
                        <span>
                            ${item.Quantity} x $${item.UnitPrice} = 
                            <strong>$${item.Subtotal}</strong>
                        </span>
                    </li>
                `;
            });
            itemsHtml += '</ul>';
            
            showNotification(itemsHtml, 'info', 5000);
        }
    } catch (error) {
        console.error('Error viewing transaction items:', error);
    }
}

// View transaction details
async function viewTransactionDetails(transactionId) {
    try {
        const response = await fetch(`/api/transactions/${transactionId}`);
        const transaction = await response.json();
        
        if (response.ok) {
            const modalBody = document.getElementById('transactionDetailBody');
            const transactionDate = new Date(transaction.TransactionDate).toLocaleString('id-ID');
            const customer = customers.find(c => c.CustomerID === transaction.CustomerID);
            const customerInfo = customer ? 
                `[${customer.CustomerID}] ${customer.Gender}, ${customer.Age} years, Income: $${customer.Annual_Income}` : 
                'Unknown';
            
            let detailsHtml = `
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Transaction ID:</strong> ${transaction.TransactionID}</p>
                        <p><strong>Customer:</strong> ${customerInfo}</p>
                        <p><strong>Spending Score:</strong> ${customer.Spending_Score}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Date:</strong> ${transactionDate}</p>
                        <p><strong>Total Amount:</strong> $${transaction.TotalAmount}</p>
                        <p><strong>Payment Method:</strong> 
                            <span class="badge bg-${getPaymentBadgeColor(transaction.PaymentMethod)}">
                                ${transaction.PaymentMethod}
                            </span>
                        </p>
                    </div>
                </div>
                
                <h6 class="mt-3">Items:</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            transaction.details.forEach(detail => {
                detailsHtml += `
                    <tr>
                        <td>${detail.ProductName}</td>
                        <td>${detail.Quantity}</td>
                        <td>$${detail.UnitPrice}</td>
                        <td>$${detail.Subtotal}</td>
                    </tr>
                `;
            });
            
            detailsHtml += `
                        </tbody>
                    </table>
                </div>
            `;
            
            modalBody.innerHTML = detailsHtml;
            
            // Show modal menggunakan Bootstrap
            const modal = new bootstrap.Modal(document.getElementById('transactionDetailModal'));
            modal.show();
        } else {
            showNotification('Error loading transaction details', 'error');
        }
    } catch (error) {
        console.error('Error viewing transaction details:', error);
        showNotification('Error loading transaction details', 'error');
    }
}

// Helper function untuk payment method badge color
function getPaymentBadgeColor(paymentMethod) {
    switch (paymentMethod) {
        case 'cash': return 'success';
        case 'credit': return 'primary';
        case 'e-wallet': return 'info';
        default: return 'secondary';
    }
}