// Load reports data
document.addEventListener('DOMContentLoaded', function() {
    loadSalesReport();
    loadSalesSummary();
});

// Load sales report data
async function loadSalesReport() {
    try {
        const [transactionsRes, customersRes] = await Promise.all([
            fetch('/api/transactions'),
            fetch('/api/customers')
        ]);
        
        const transactions = await transactionsRes.json();
        const customers = await customersRes.json();
        
        // Update summary cards
        const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.TotalAmount), 0);
        const avgTransaction = totalSales / (transactions.length || 1);
        
        document.getElementById('totalSales').textContent = `$${totalSales.toFixed(2)}`;
        document.getElementById('transactionCount').textContent = transactions.length;
        document.getElementById('avgTransaction').textContent = `$${avgTransaction.toFixed(2)}`;
        
        // Find top customer
        const customerSpending = {};
        transactions.forEach(t => {
            if (!customerSpending[t.CustomerID]) {
                customerSpending[t.CustomerID] = 0;
            }
            customerSpending[t.CustomerID] += parseFloat(t.TotalAmount);
        });
        
        const topCustomerId = Object.keys(customerSpending).reduce((a, b) => 
            customerSpending[a] > customerSpending[b] ? a : b
        );
        
        const topCustomer = customers.find(c => c.CustomerID == topCustomerId);
        document.getElementById('topCustomer').textContent = 
            topCustomer ? `[${topCustomer.CustomerID}] $${customerSpending[topCustomerId].toFixed(2)}` : '-';
        
        // Populate sales table
        const tbody = document.querySelector('#salesTable tbody');
        tbody.innerHTML = '';
        
        transactions.forEach(transaction => {
            const customer = customers.find(c => c.CustomerID === transaction.CustomerID);
            const customerInfo = customer ? 
                `[${customer.CustomerID}] ${customer.Gender}, ${customer.Age}y` : 
                'Unknown';
                
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.TransactionID}</td>
                <td>${customerInfo}</td>
                <td>${new Date(transaction.TransactionDate).toLocaleDateString('id-ID')}</td>
                <td>$${transaction.TotalAmount}</td>
                <td>
                    <span class="badge bg-${getPaymentBadgeColor(transaction.PaymentMethod)}">
                        ${transaction.PaymentMethod}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-info" 
                            onclick="viewTransactionItems(${transaction.TransactionID})">
                        View Items
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading sales report:', error);
        showNotification('Error loading sales report', 'error');
    }
}

// Load sales summary untuk charts
async function loadSalesSummary() {
    try {
        const response = await fetch('/api/transactions/summary');
        const summary = await response.json();
        
        // Update payment method chart
        updatePaymentChart(summary.payment_summary);
        
        // Update recent transactions
        updateRecentTransactions(summary.recent_transactions);
        
    } catch (error) {
        console.error('Error loading sales summary:', error);
    }
}

// Update payment method chart
function updatePaymentChart(paymentSummary) {
    const chartContainer = document.getElementById('paymentChart');
    
    if (paymentSummary.length === 0) {
        chartContainer.innerHTML = '<p class="text-muted">No payment data available</p>';
        return;
    }
    
    let chartHtml = '<div class="list-group">';
    
    paymentSummary.forEach(payment => {
        const percentage = (payment.amount / (payment.amount * paymentSummary.length)) * 100;
        
        chartHtml += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <span>
                        <strong>${payment.PaymentMethod}</strong>
                        <span class="badge bg-secondary ms-2">${payment.count} transactions</span>
                    </span>
                    <span class="fw-bold">$${parseFloat(payment.amount).toFixed(2)}</span>
                </div>
                <div class="progress mt-2" style="height: 10px;">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${percentage}%" 
                         aria-valuenow="${percentage}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
            </div>
        `;
    });
    
    chartHtml += '</div>';
    chartContainer.innerHTML = chartHtml;
}

// Update recent transactions
function updateRecentTransactions(recentTransactions) {
    const container = document.getElementById('recentTransactions');
    
    if (recentTransactions.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent transactions</p>';
        return;
    }
    
    let transactionsHtml = '<div class="list-group">';
    
    recentTransactions.forEach(transaction => {
        const date = new Date(transaction.TransactionDate).toLocaleDateString('id-ID');
        
        transactionsHtml += `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">Transaction #${transaction.TransactionID}</h6>
                        <small class="text-muted">
                            Customer: ${transaction.Gender}, ${transaction.Age}y
                        </small>
                    </div>
                    <div class="text-end">
                        <strong>$${transaction.TotalAmount}</strong>
                        <br>
                        <small class="text-muted">${date}</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    transactionsHtml += '</div>';
    container.innerHTML = transactionsHtml;
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

// View transaction items (reuse dari transactions.js)
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