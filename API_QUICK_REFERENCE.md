# TokoFlow API Quick Reference

## 🚀 Quick Start

### Test the API
```bash
# Check if API is running
curl http://localhost:3000/api/test

# Get authentication token from Supabase
# Then use it in all requests:
-H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Common Operations

### 1. Process Sales (Most Common)
```javascript
// Step 1: Create sales input
await fetch('/api/sales/input', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transaction_date: '2025-01-15',
    sku: 'PROD001',
    product_name: 'Product Name',
    selling_price: 100000,
    quantity: 5,
    channel: 'Shopee',
    status: 'ok'  // Important: Must be 'ok' to process
  })
});

// Step 2: Process all pending sales
await fetch('/api/process/sales', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: '{}'  // Empty body for batch processing
});
```

### 2. Add Incoming Stock
```javascript
// Step 1: Create incoming goods input
await fetch('/api/incoming-goods/input', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transaction_date: '2025-01-15',
    sku: 'PROD001',
    product_name: 'Product Name',
    quantity: 100,
    status: 'ok'
  })
});

// Step 2: Process
await fetch('/api/process/incoming-goods', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: '{}'
});
```

### 3. Check Stock
```javascript
const response = await fetch('/api/inventory/check?sku=PROD001&quantity=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();
// data.available = true/false
// data.currentStock = current stock level
// data.shortage = how many units short (if any)
```

### 4. Get Dashboard Data
```javascript
const response = await fetch('/api/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();
// Contains: salesSummary, todaySales, inventoryAlerts, topProducts, etc.
```

## 🔑 Key Endpoints

### Products & Inventory
- `GET /api/products` - List products
- `GET /api/inventory` - Inventory status with alerts
- `GET /api/inventory/movements?sku=X` - Stock history

### Sales
- `GET /api/sales/input?status=ok` - Pending sales
- `GET /api/sales/transactions` - Sales history
- `POST /api/process/sales` - Process sales ⚡

### Incoming Goods
- `GET /api/incoming-goods/input?status=ok` - Pending incoming
- `GET /api/incoming-goods/history` - Receipt history
- `POST /api/process/incoming-goods` - Process incoming ⚡

### Configuration
- `GET /api/marketplace-fees` - Channel fees
- `GET /api/product-costs` - Product costs
- `GET /api/product-compositions` - Bundle configs

### Analytics
- `GET /api/dashboard` - Overview metrics
- `GET /api/dashboard/analytics?period=30` - Time series data
- `GET /api/sales/transactions/summary?group_by=channel` - Sales summary

## 💡 Important Notes

1. **Status = "OK"**: Only records with status='ok' will be processed
2. **Quantity Clears**: After processing, quantity becomes null (like Excel)
3. **Negative Stock**: Allowed by design (indicates overselling)
4. **Case Insensitive**: Channel names are lowercased automatically
5. **Batch Processing**: Use empty body `{}` to process all pending

## 🛠️ Troubleshooting

### Nothing gets processed?
- Check status = 'ok' (not 'OK' or 'Ok')
- Ensure quantity is not null
- Verify authentication token

### Stock not updating?
- Check if SKU exists in products table
- Look for error messages in response
- Verify product costs are configured

### Wrong profit calculation?
- Check marketplace fee for channel
- Verify product costs (modal, packing, affiliate%)
- Ensure all numeric fields are numbers, not strings

## 📈 Excel to API Mapping

| Excel Action | API Equivalent |
|-------------|----------------|
| Enter in DashboardInput | POST /api/sales/input |
| Click "Simpan Penjualan" | POST /api/process/sales |
| Enter in BarangMasukInput | POST /api/incoming-goods/input |
| Click "Simpan Barang Masuk" | POST /api/process/incoming-goods |
| View Rekapanpenjualan | GET /api/sales/transactions |
| View Inventori | GET /api/inventory |
| Edit HargaModal | POST /api/product-costs |
| Edit FeeMarketplace | POST /api/marketplace-fees |

## 🎯 Best Practices

1. **Always preview before processing**
   ```javascript
   // Check what will be processed
   await fetch('/api/process/sales/preview')
   ```

2. **Handle errors gracefully**
   ```javascript
   if (!response.ok || !data.success) {
     console.error(data.error);
   }
   ```

3. **Use filters to reduce data**
   ```javascript
   // Don't fetch all transactions
   '/api/sales/transactions?start_date=2025-01-01&limit=50'
   ```

4. **Cache master data**
   - Marketplace fees rarely change
   - Product costs update infrequently
   - Cache and refresh periodically

Need more details? See `API_DOCUMENTATION.md` for complete reference.
