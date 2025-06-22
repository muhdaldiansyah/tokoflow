# TokoFlow API Documentation

This document provides a comprehensive reference for all TokoFlow API endpoints. All endpoints follow RESTful conventions and return JSON responses.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All API endpoints require authentication via Supabase Auth. Include the authentication token in the Authorization header:
```
Authorization: Bearer YOUR_AUTH_TOKEN
```

## Response Format
All responses follow this standard format:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Error description"
  }
}
```

## API Endpoints

### Products

#### Get All Products
```
GET /api/products
```

Query Parameters:
- `search` (string): Search by SKU or name
- `stock` (string): Filter by stock status ('negative', 'zero', 'positive')
- `limit` (number): Results per page (default: 100)
- `offset` (number): Pagination offset (default: 0)

Response includes product details with costs and pagination info.

#### Get Single Product
```
GET /api/products/[sku]
```

Returns complete product details including costs and compositions.

#### Create Product
```
POST /api/products
```

Request Body:
```json
{
  "sku": "SKU123",
  "name": "Product Name",
  "stock": 0,
  "modal_cost": 50000,
  "packing_cost": 2000,
  "affiliate_percentage": 10
}
```

#### Update Product
```
PATCH /api/products/[sku]
```

Request Body (all fields optional):
```json
{
  "name": "New Name",
  "stock": 100,
  "modal_cost": 55000,
  "packing_cost": 2500,
  "affiliate_percentage": 15
}
```

#### Batch Update Products
```
PUT /api/products
```

Request Body:
```json
{
  "updates": [
    {
      "sku": "SKU123",
      "name": "Updated Name",
      "stock": 50
    }
  ]
}
```

#### Delete Product
```
DELETE /api/products/[sku]
```

### Sales

#### Get Sales Input
```
GET /api/sales/input
```

Query Parameters:
- `status` (string): Filter by status ('ok', 'pending', 'processed')
- `has_quantity` (string): Filter by quantity presence ('true', 'false')

#### Create Sales Input
```
POST /api/sales/input
```

Request Body:
```json
{
  "transaction_date": "2025-01-15",
  "sku": "SKU123",
  "product_name": "Product Name",
  "selling_price": 100000,
  "quantity": 5,
  "channel": "Shopee",
  "status": "pending"
}
```

#### Update Sales Input Status
```
PATCH /api/sales/input
```

Request Body:
```json
{
  "ids": ["uuid1", "uuid2"],
  "updates": {
    "status": "ok"
  }
}
```

#### Delete Sales Input
```
DELETE /api/sales/input?ids=uuid1,uuid2
```

#### Get Sales Transactions
```
GET /api/sales/transactions
```

Query Parameters:
- `start_date` (string): Filter start date (YYYY-MM-DD)
- `end_date` (string): Filter end date
- `channel` (string): Filter by sales channel
- `sku` (string): Filter by product SKU
- `limit` (number): Results per page
- `offset` (number): Pagination offset

#### Get Sales Summary
```
GET /api/sales/transactions/summary
```

Query Parameters:
- `start_date` (string): Start date
- `end_date` (string): End date
- `group_by` (string): Grouping option ('channel', 'product', 'date')

### Process Transactions

#### Process Sales
```
POST /api/process/sales
```

Request Body (for single):
```json
{
  "id": "sales_input_uuid"
}
```

Request Body (for batch):
```json
{}
```

#### Preview Sales Processing
```
GET /api/process/sales/preview
```

Shows what will be processed with calculated profits.

#### Process Incoming Goods
```
POST /api/process/incoming-goods
```

Request Body (for single):
```json
{
  "id": "incoming_goods_input_uuid"
}
```

Request Body (for batch):
```json
{}
```

#### Preview Incoming Goods Processing
```
GET /api/process/incoming-goods/preview
```

### Incoming Goods

#### Get Incoming Goods Input
```
GET /api/incoming-goods/input
```

Query Parameters:
- `status` (string): Filter by status
- `has_quantity` (string): Filter by quantity presence

#### Create Incoming Goods Input
```
POST /api/incoming-goods/input
```

Request Body:
```json
{
  "transaction_date": "2025-01-15",
  "sku": "SKU123",
  "product_name": "Product Name",
  "quantity": 100,
  "status": "pending"
}
```

#### Update Incoming Goods Input
```
PATCH /api/incoming-goods/input
```

Request Body:
```json
{
  "ids": ["uuid1", "uuid2"],
  "updates": {
    "status": "ok"
  }
}
```

#### Get Incoming Goods History
```
GET /api/incoming-goods/history
```

Query Parameters:
- `start_date` (string): Start date
- `end_date` (string): End date
- `sku` (string): Filter by SKU

### Inventory

#### Get Inventory Status
```
GET /api/inventory
```

Query Parameters:
- `filter` (string): Stock filter ('negative', 'zero', 'low', 'all')
- `search` (string): Search by SKU or name
- `limit` (number): Results per page
- `offset` (number): Pagination offset

#### Adjust Stock
```
POST /api/inventory/adjust
```

Request Body:
```json
{
  "adjustments": [
    {
      "sku": "SKU123",
      "quantity": 10,
      "type": "add"
    },
    {
      "sku": "SKU456",
      "quantity": 50,
      "type": "set"
    }
  ],
  "reason": "Stock take adjustment"
}
```

#### Check Stock Availability
```
GET /api/inventory/check?sku=SKU123&quantity=10
```

#### Get Stock Movements
```
GET /api/inventory/movements
```

Query Parameters:
- `sku` (string): Filter by SKU
- `start_date` (string): Start date
- `end_date` (string): End date
- `limit` (number): Results limit

### Configuration

#### Get Marketplace Fees
```
GET /api/marketplace-fees
```

#### Create/Update Marketplace Fee
```
POST /api/marketplace-fees
```

Request Body:
```json
{
  "channel": "shopee",
  "fee_percentage": 10
}
```

#### Batch Update Marketplace Fees
```
PUT /api/marketplace-fees
```

Request Body:
```json
{
  "fees": [
    {
      "channel": "shopee",
      "fee_percentage": 10
    },
    {
      "channel": "tiktok",
      "fee_percentage": 12
    }
  ]
}
```

#### Delete Marketplace Fee
```
DELETE /api/marketplace-fees?channel=shopee
```

#### Get Product Costs
```
GET /api/product-costs
```

Query Parameters:
- `sku` (string): Filter by SKU

#### Create/Update Product Cost
```
POST /api/product-costs
```

Request Body:
```json
{
  "sku": "SKU123",
  "modal_cost": 50000,
  "packing_cost": 2000,
  "affiliate_percentage": 10
}
```

#### Batch Update Product Costs
```
PUT /api/product-costs
```

Request Body:
```json
{
  "costs": [
    {
      "sku": "SKU123",
      "modal_cost": 50000,
      "packing_cost": 2000,
      "affiliate_percentage": 10
    }
  ]
}
```

#### Get Product Compositions
```
GET /api/product-compositions
```

Query Parameters:
- `parent_sku` (string): Filter by parent SKU
- `component_sku` (string): Filter by component SKU
- `status` (string): Filter by status (default: 'aktif')

#### Create Product Composition
```
POST /api/product-compositions
```

Request Body:
```json
{
  "parent_sku": "BUNDLE001",
  "component_sku": "ITEM001",
  "quantity": 2,
  "source_channel": "semua",
  "status": "aktif"
}
```

#### Update Product Composition
```
PATCH /api/product-compositions?id=uuid
```

Request Body:
```json
{
  "quantity": 3,
  "status": "nonaktif"
}
```

#### Delete Product Composition
```
DELETE /api/product-compositions?id=uuid
```

### Dashboard & Analytics

#### Get Dashboard Summary
```
GET /api/dashboard
```

Query Parameters:
- `start_date` (string): Start date for metrics
- `end_date` (string): End date for metrics

Returns comprehensive dashboard data including:
- Sales summary
- Today's sales
- Inventory alerts
- Pending transactions
- Top products
- Sales by channel
- Recent activities

#### Get Analytics Data
```
GET /api/dashboard/analytics
```

Query Parameters:
- `period` (string): Number of days to analyze (default: 30)
- `group_by` (string): Grouping option ('day', 'week', 'month')

Returns detailed analytics including:
- Time series data
- Channel performance
- Product performance rankings
- Inventory movement
- Growth rates

## Error Codes

- `400` - Bad Request: Invalid input or validation error
- `401` - Unauthorized: Missing or invalid authentication
- `404` - Not Found: Resource not found
- `409` - Conflict: Duplicate entry or constraint violation
- `500` - Internal Server Error: Server-side error

## Rate Limiting

Currently no rate limiting is implemented, but it's recommended to:
- Batch operations when possible
- Cache frequently accessed data
- Avoid excessive polling

## Migration from Excel/Apps Script

### Key Differences:
1. **Authentication Required**: Unlike the spreadsheet, all API calls need authentication
2. **Concurrent Access**: Multiple users can work simultaneously
3. **Real-time Updates**: Changes reflect immediately for all users
4. **Validation**: Stronger data validation and error messages
5. **Performance**: Faster processing with indexed database queries

### Mapping Guide:
- `simpanDataPenjualan()` → `POST /api/process/sales`
- `simpanDataBarangMasuk()` → `POST /api/process/incoming-goods`
- `updateInventori()` → Handled automatically by process endpoints
- Sheet views → GET endpoints with filters
- Manual edits → POST/PATCH endpoints

## Best Practices

1. **Always handle errors**: Check for `success: false` in responses
2. **Use batch operations**: When updating multiple records
3. **Implement retry logic**: For network failures
4. **Cache master data**: Marketplace fees and product costs change rarely
5. **Paginate large datasets**: Use limit/offset for better performance
6. **Validate before processing**: Use preview endpoints to check calculations

## Examples

### Process a Sale
```javascript
// 1. Create sales input
const response = await fetch('/api/sales/input', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    transaction_date: '2025-01-15',
    sku: 'PROD001',
    product_name: 'Product 1',
    selling_price: 100000,
    quantity: 5,
    channel: 'Shopee',
    status: 'ok'
  })
});

const { data } = await response.json();

// 2. Process the sale
await fetch('/api/process/sales', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: data.id
  })
});
```

### Check Stock Before Sale
```javascript
// Check if stock is available
const checkResponse = await fetch('/api/inventory/check?sku=PROD001&quantity=5', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await checkResponse.json();

if (data.available) {
  // Proceed with sale
} else {
  // Show error: Insufficient stock
  console.log(`Need ${data.shortage} more units`);
}
```

### Get Daily Sales Report
```javascript
const today = new Date().toISOString().split('T')[0];

const response = await fetch(`/api/sales/transactions?start_date=${today}&end_date=${today}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();
console.log(`Today's sales: ${data.totals.transactions} transactions, Revenue: ${data.totals.totalRevenue}`);
```
