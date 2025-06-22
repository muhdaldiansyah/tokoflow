# TokoFlow Quick Reference: Excel to Web Mapping

## System Mapping Overview

### Excel Sheets → Database Tables

| Excel Sheet | Database Table | Purpose |
|-------------|----------------|---------|
| DashboardInput | sales_input | Temporary sales entry |
| Rekapanpenjualan | sales_transactions | Processed sales history |
| BarangMasukInput | incoming_goods_input | Temporary goods entry |
| BarangMasuk | incoming_goods | Processed incoming goods |
| Inventori | products | Product master & stock |
| HargaModal | product_costs | Cost configuration |
| FeeMarketplace | marketplace_fees | Channel fees |
| KomposisiProduk | product_compositions | Bundle definitions |

### Google Apps Script Functions → Web Features

| Apps Script Function | Web Feature | Route/Module |
|---------------------|-------------|--------------|
| simpanDataPenjualan() | Process Sales | /api/process-sales |
| simpanDataBarangMasuk() | Process Incoming | /api/process-incoming |
| updateInventori() | Stock Update Service | lib/services/inventory |
| updateKomposisiInventori() | Bundle Processing | lib/services/composition |
| buildMap() | Data Caching | lib/utils/cache |
| buildMapFee() | Fee Lookup | lib/utils/lookups |

## Core Workflows

### 1. Sales Entry Workflow

**Excel Process:**
1. Enter data in DashboardInput
2. Set Status = "OK"
3. Run simpanDataPenjualan()
4. Data moves to Rekapanpenjualan
5. Stock updated in Inventori
6. Quantity cleared in input

**Web Process:**
1. Enter data in /sales/input
2. Set Status = "OK"
3. Click "Process Sales"
4. API creates sales_transactions records
5. Stock updated in products table
6. Quantity cleared in sales_input

### 2. Profit Calculation Logic

**Unchanged Formula:**
```javascript
// Both systems use identical calculation
const revenue = selling_price * quantity;
const modalTotal = modal_cost * quantity;
const packingTotal = packing_cost * quantity;
const affiliateTotal = (affiliate_percentage / 100) * revenue;
const marketplaceFee = (fee_percentage / 100) * revenue;
const totalCosts = modalTotal + packingTotal + affiliateTotal;
const netProfit = revenue - totalCosts - marketplaceFee;
```

### 3. Bundle/Composition Processing

**Excel Logic:**
```javascript
// If product has components
if (composition.parent_sku === sold_sku) {
  // Check if applies to channel or "semua"
  if (composition.source === channel || composition.source === "semua") {
    // Deduct component stock
    component_stock -= composition.quantity * sold_quantity;
  }
}
```

**Web Implementation:** Same logic, database-driven

## Key Business Rules (Preserved)

1. **Status Validation**: Only process when status = "OK"
2. **Quantity Clearing**: Set to null after processing
3. **Negative Stock**: Allowed (indicates overselling)
4. **Case Sensitivity**: Channel names are case-insensitive
5. **Component Processing**: Happens after main product stock update

## Data Flow Comparison

### Excel Data Flow:
```
Input Sheet → Apps Script → Output Sheet → Manual Clear
     ↓              ↓             ↓
  Validation    Calculate      Update
               Inventory      Inventory
```

### Web Data Flow:
```
Input Form → API Endpoint → Transaction Table → Auto Clear
     ↓            ↓              ↓
  Frontend     Backend       Database
 Validation   Processing    Transaction
```

## Error Handling Improvements

| Excel Behavior | Web Enhancement |
|----------------|-----------------|
| Silent SKU not found | Alert user with specific error |
| No stock validation | Optional stock checking |
| Manual data clearing | Automatic after processing |
| No user tracking | Automatic audit trail |
| Single user only | Multi-user concurrent access |

## Performance Optimizations

### Excel Bottlenecks → Web Solutions

1. **Linear Search for SKU** → Indexed database queries
2. **Read all data repeatedly** → Cached lookups
3. **Single cell updates** → Batch transactions
4. **Manual refresh** → Real-time updates
5. **Formula recalculation** → Server-side processing

## Migration Checklist

- [ ] Export all master data from Excel
- [ ] Import products and costs
- [ ] Set up marketplace fees
- [ ] Configure product compositions
- [ ] Test with sample transactions
- [ ] Verify profit calculations match
- [ ] Train users on new interface
- [ ] Run parallel for 1 week
- [ ] Full cutover

## Common Pitfalls to Avoid

1. **Channel Name Mismatch**: Ensure consistent naming (Shopee vs shopee)
2. **Missing Cost Data**: All products need cost configuration
3. **Status Field**: Remember to set "OK" before processing
4. **Component Stock**: Check bundle items have sufficient inventory
5. **User Permissions**: Set proper RLS policies

## Quick SQL References

```sql
-- Check negative stock
SELECT sku, name, stock 
FROM products 
WHERE stock < 0;

-- View pending sales
SELECT * FROM sales_input 
WHERE status = 'OK' 
AND quantity IS NOT NULL;

-- Sales summary by channel
SELECT channel, 
       COUNT(*) as transactions,
       SUM(revenue) as total_revenue,
       SUM(net_profit) as total_profit
FROM sales_transactions
GROUP BY channel;
```
