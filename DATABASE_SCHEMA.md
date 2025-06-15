# TokoFlow Database Schema

## Overview
TokoFlow is an inventory and sales management system that tracks products, sales transactions, incoming goods, and product compositions for bundle/package products.

## Database Tables

### 1. **products**
Main product inventory table
- `id` (UUID) - Primary key
- `sku` (VARCHAR 50) - Unique product SKU
- `name` (VARCHAR 255) - Product name
- `stock` (INTEGER) - Current stock level (can be negative)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 2. **product_costs**
Product cost and pricing information
- `id` (UUID) - Primary key
- `product_id` (UUID) - Foreign key to products
- `sku` (VARCHAR 50) - Product SKU (unique)
- `modal_cost` (DECIMAL) - Base cost
- `packing_cost` (DECIMAL) - Packaging cost
- `affiliate_percentage` (DECIMAL) - Affiliate commission percentage
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 3. **marketplace_fees**
Fee percentages for different sales channels
- `id` (UUID) - Primary key
- `channel` (VARCHAR 100) - Channel name (unique)
- `fee_percentage` (DECIMAL) - Fee percentage
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 4. **product_compositions**
Bundle/package product component mapping
- `id` (UUID) - Primary key
- `parent_sku` (VARCHAR 50) - Parent product SKU
- `component_sku` (VARCHAR 50) - Component product SKU
- `quantity` (INTEGER) - Quantity needed
- `source_channel` (VARCHAR 100) - Channel filter ('semua' for all)
- `status` (VARCHAR 20) - Active/inactive status
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 5. **sales_transactions**
Completed sales records
- `id` (UUID) - Primary key
- `transaction_date` (DATE)
- `sku` (VARCHAR 50)
- `product_name` (VARCHAR 255)
- `selling_price` (DECIMAL)
- `quantity` (INTEGER)
- `channel` (VARCHAR 100)
- `modal_cost` (DECIMAL)
- `packing_cost` (DECIMAL)
- `affiliate_cost` (DECIMAL)
- `marketplace_fee` (DECIMAL)
- `revenue` (DECIMAL)
- `net_profit` (DECIMAL)
- `created_at` (TIMESTAMPTZ)
- `created_by` (UUID) - User who created the record

### 6. **incoming_goods**
Incoming stock records
- `id` (UUID) - Primary key
- `transaction_date` (DATE)
- `sku` (VARCHAR 50)
- `product_name` (VARCHAR 255)
- `quantity` (INTEGER)
- `created_at` (TIMESTAMPTZ)
- `created_by` (UUID)

### 7. **sales_input**
Staging table for sales input (equivalent to DashboardInput)
- `id` (UUID) - Primary key
- `transaction_date` (DATE)
- `sku` (VARCHAR 50)
- `product_name` (VARCHAR 255)
- `selling_price` (DECIMAL)
- `quantity` (INTEGER) - Nullable, cleared after processing
- `channel` (VARCHAR 100)
- `status` (VARCHAR 50) - 'ok', 'pending', 'processed'
- `processed_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `created_by` (UUID)

### 8. **incoming_goods_input**
Staging table for incoming goods (equivalent to BarangMasukInput)
- `id` (UUID) - Primary key
- `transaction_date` (DATE)
- `sku` (VARCHAR 50)
- `product_name` (VARCHAR 255)
- `quantity` (INTEGER) - Nullable, cleared after processing
- `status` (VARCHAR 50) - 'ok', 'pending', 'processed'
- `processed_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `created_by` (UUID)

## Database Functions

### 1. **update_inventory(p_sku, p_quantity_change)**
Updates product stock level
- Returns: BOOLEAN (success/failure)
- Logs warning if SKU not found or stock becomes negative

### 2. **update_composition_inventory(p_parent_sku, p_quantity, p_channel)**
Updates stock for product components based on composition
- Automatically called when processing sales

### 3. **process_sales_transaction(p_input_id)**
Processes a single sales input record:
- Calculates costs, fees, and profit
- Updates inventory
- Updates component inventory
- Creates sales transaction record
- Clears input quantity

### 4. **process_incoming_goods(p_input_id)**
Processes incoming goods input:
- Updates inventory
- Creates incoming goods record
- Clears input quantity

### 5. **batch_process_sales()**
Processes all pending sales with status='ok'
- Returns: INTEGER (number of processed records)

### 6. **batch_process_incoming_goods()**
Processes all pending incoming goods with status='ok'
- Returns: INTEGER (number of processed records)

## Views

### 1. **v_inventory**
Combined view of products with their costs

### 2. **v_sales_by_channel**
Sales summary grouped by channel with totals and margins

### 3. **v_sales_by_product**
Sales summary grouped by product with totals and margins

### 4. **v_pending_sales**
Shows unprocessed sales input records

### 5. **v_stock_alerts**
Shows products with negative, zero, or low stock

## Row Level Security (RLS)
All tables have RLS enabled:
- Authenticated users can view all data
- Users can only insert/update their own records (where applicable)

## Usage Examples

### Process all pending sales:
```sql
SELECT batch_process_sales();
```

### Process all pending incoming goods:
```sql
SELECT batch_process_incoming_goods();
```

### Check stock alerts:
```sql
SELECT * FROM v_stock_alerts;
```

### View sales performance by channel:
```sql
SELECT * FROM v_sales_by_channel;
```
