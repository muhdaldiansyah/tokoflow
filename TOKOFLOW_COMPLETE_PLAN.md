# TokoFlow Complete Implementation Plan

## 1. Executive Summary

TokoFlow is an online inventory and sales management system designed for small to medium-sized businesses. It digitizes and automates the workflow of tracking product inventory, recording sales transactions, managing incoming goods, and calculating comprehensive profit margins across multiple marketplace channels.

### Core Value Proposition
- Real-time inventory tracking with automatic stock deduction
- Multi-channel marketplace management with dynamic fee calculation
- Support for product bundles/packages with component tracking
- Comprehensive profit calculation including modal cost, packing, affiliate fees, and marketplace fees
- Simple input forms that mirror familiar spreadsheet workflows

## 2. System Overview

### 2.1 Business Context
TokoFlow replaces a manual spreadsheet-based system where:
- Sales data is entered in an input sheet
- Incoming goods are tracked separately
- Stock levels are manually calculated
- Profit margins account for multiple cost factors
- Product bundles automatically deduct component inventory

### 2.2 Key Business Rules
1. **Sales Processing**: Only transactions with status "OK" are processed
2. **Inventory Management**: Stock can go negative (indicating overselling)
3. **Bundle Products**: Automatically deduct component stock based on composition rules
4. **Cost Calculation**: Total cost includes modal + packing + affiliate commission
5. **Profit Formula**: Revenue - Total Costs - Marketplace Fee
6. **Data Clearing**: After processing, quantity fields are cleared (set to null)

## 3. Functional Modules

### 3.1 Dashboard Module
**Purpose**: Overview of business metrics and quick access to key functions

**Features**:
- Total revenue and profit display
- Stock alerts for negative inventory
- Recent transactions summary
- Quick links to input forms

**Data Sources**:
- Aggregate data from `sales_transactions`
- Current stock from `products`
- Pending items from input tables

### 3.2 Product Management Module
**Purpose**: Manage product master data and costs

**Features**:
- Product listing with current stock levels
- Add/Edit product information (SKU, Name)
- Cost configuration per product:
  - Modal cost (base cost)
  - Packing cost
  - Affiliate commission percentage
- Visual indicator for negative stock

**Database Operations**:
```sql
-- Get products with costs
SELECT p.*, pc.modal_cost, pc.packing_cost, pc.affiliate_percentage
FROM products p
LEFT JOIN product_costs pc ON p.sku = pc.sku
ORDER BY p.sku;
```

### 3.3 Sales Input Module
**Purpose**: Record daily sales transactions

**Workflow**:
1. User enters sales data:
   - Date
   - SKU (with autocomplete)
   - Product Name (auto-filled)
   - Selling Price
   - Quantity
   - Channel (dropdown: Shopee, Tiktok, etc.)
   - Status (default: "pending")

2. User marks entries as "OK" when ready
3. System processes all "OK" entries:
   - Calculate costs and profit
   - Create sales transaction records
   - Update inventory
   - Process bundle components
   - Clear quantity field
   - Update status to "processed"

**Validation Rules**:
- SKU must exist in products table
- Quantity must be positive
- Channel must have fee configuration

### 3.4 Sales Processing Engine
**Purpose**: Core business logic for processing sales

**Processing Steps**:
```javascript
// Pseudo-code for sales processing
async function processSalesInput() {
  // 1. Get all pending sales with status "OK"
  const pendingSales = await getPendingSalesInput("OK");
  
  // 2. Build lookup maps
  const productCosts = await buildProductCostMap();
  const marketplaceFees = await buildMarketplaceFeeMap();
  const compositions = await getProductCompositions();
  
  // 3. Process each sale
  for (const sale of pendingSales) {
    // Calculate financials
    const revenue = sale.selling_price * sale.quantity;
    const costs = productCosts[sale.sku];
    const modalTotal = costs.modal_cost * sale.quantity;
    const packingTotal = costs.packing_cost * sale.quantity;
    const affiliateTotal = (costs.affiliate_percentage / 100) * revenue;
    const marketplaceFee = (marketplaceFees[sale.channel] / 100) * revenue;
    const totalCosts = modalTotal + packingTotal + affiliateTotal;
    const netProfit = revenue - totalCosts - marketplaceFee;
    
    // Create transaction record
    await createSalesTransaction({
      ...sale,
      modal_cost: costs.modal_cost,
      packing_cost: costs.packing_cost,
      affiliate_cost: affiliateTotal,
      marketplace_fee: marketplaceFee,
      revenue: revenue,
      net_profit: netProfit
    });
    
    // Update product inventory
    await updateProductStock(sale.sku, -sale.quantity);
    
    // Process bundle components
    await processProductComposition(sale.sku, sale.quantity, sale.channel);
    
    // Clear input record
    await clearSalesInput(sale.id);
  }
}
```

### 3.5 Incoming Goods Module
**Purpose**: Record stock additions

**Workflow**:
1. User enters incoming goods:
   - Date
   - SKU
   - Product Name
   - Quantity
   - Status

2. Processing (similar to sales):
   - Create incoming goods record
   - Update inventory (add stock)
   - Clear quantity field

### 3.6 Product Composition Module
**Purpose**: Define bundle/package relationships

**Features**:
- Define parent-component relationships
- Set quantity ratios
- Channel-specific rules (or "semua" for all)
- Active/Inactive status

**Example**:
- Parent: #012025 (Power Bank Bundle)
- Component: #9910 (Small Box) - Qty: 1
- Applied to: All channels
- Status: Active

### 3.7 Configuration Module
**Purpose**: System settings and master data

**Sub-modules**:
1. **Marketplace Fees**:
   - Channel name
   - Fee percentage
   - Unique constraint on channel

2. **User Management**:
   - Leverage Supabase Auth
   - Profile management (av_profiles)

### 3.8 Reports Module
**Purpose**: Business insights and transaction history

**Reports**:
1. **Sales Summary**:
   - By date range
   - By channel
   - By product

2. **Inventory Report**:
   - Current stock levels
   - Stock movement history
   - Negative stock alerts

3. **Profit Analysis**:
   - Gross margin by product
   - Channel performance
   - Cost breakdown

## 4. Technical Architecture

### 4.1 Technology Stack
- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **API**: Supabase Client Library

### 4.2 Project Structure
```
tokoflow/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.js
│   │   ├── page.js
│   │   ├── products/
│   │   ├── sales/
│   │   │   ├── input/
│   │   │   └── transactions/
│   │   ├── inventory/
│   │   │   └── incoming/
│   │   ├── settings/
│   │   │   ├── marketplace-fees/
│   │   │   └── product-composition/
│   │   └── reports/
│   ├── api/
│   │   ├── process-sales/
│   │   └── process-incoming/
│   └── layout.js
├── lib/
│   ├── supabase/
│   │   ├── client.js
│   │   ├── server.js
│   │   └── middleware.js
│   ├── utils/
│   │   ├── calculations.js
│   │   └── validations.js
│   └── hooks/
└── components/
    ├── ui/
    ├── forms/
    └── tables/
```

### 4.3 Database Schema Implementation

#### Key Tables:
1. **products**: Core product master
2. **product_costs**: Cost configuration per SKU
3. **marketplace_fees**: Channel fee configuration
4. **product_compositions**: Bundle definitions
5. **sales_input**: Temporary sales entry
6. **sales_transactions**: Processed sales records
7. **incoming_goods_input**: Temporary goods entry
8. **incoming_goods**: Processed incoming records

#### Critical Indexes:
```sql
-- Performance optimization
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_sales_transactions_date ON sales_transactions(transaction_date);
CREATE INDEX idx_sales_input_status ON sales_input(status);
```

### 4.4 API Endpoints

#### Core Processing APIs:
```javascript
// /api/process-sales/route.js
export async function POST(request) {
  // 1. Authenticate user
  // 2. Get pending sales with status "OK"
  // 3. Begin transaction
  // 4. Process each sale
  // 5. Commit or rollback
  // 6. Return results
}

// /api/process-incoming/route.js
export async function POST(request) {
  // Similar structure for incoming goods
}
```

### 4.5 Security Implementation

#### Row Level Security (RLS):
```sql
-- Products: Read for all authenticated, write for admins
CREATE POLICY "Users can view products" ON products
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Sales: Users can only see their own transactions
CREATE POLICY "Users can view own sales" ON sales_transactions
  FOR SELECT USING (auth.uid() = created_by);

-- Input tables: Users can manage their own entries
CREATE POLICY "Users can manage own input" ON sales_input
  FOR ALL USING (auth.uid() = created_by);
```

## 5. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up Next.js project structure
- [ ] Configure Supabase connection
- [ ] Implement authentication flow
- [ ] Create base layouts and navigation

### Phase 2: Master Data (Week 2)
- [ ] Product management CRUD
- [ ] Product costs configuration
- [ ] Marketplace fees setup
- [ ] Product composition management

### Phase 3: Core Transactions (Week 3-4)
- [ ] Sales input form
- [ ] Sales processing logic
- [ ] Inventory updates
- [ ] Bundle component processing
- [ ] Incoming goods module

### Phase 4: Reporting & Polish (Week 5)
- [ ] Dashboard implementation
- [ ] Basic reports
- [ ] Error handling
- [ ] UI/UX refinements

## 6. Data Migration Strategy

### From Spreadsheet to Database:
1. Export existing data to CSV
2. Clean and validate data
3. Import sequence:
   - Products first
   - Product costs
   - Marketplace fees
   - Product compositions
   - Historical transactions (optional)

## 7. Key Differences from Spreadsheet System

### Improvements:
1. **Real-time updates**: No manual refresh needed
2. **Multi-user support**: Concurrent access without conflicts
3. **Data integrity**: Enforced relationships and constraints
4. **Audit trail**: Automatic tracking of who and when
5. **Performance**: Indexed queries vs. full table scans

### Maintained Features:
1. **Same workflow**: Input → Process → Clear quantity
2. **Same calculations**: Identical profit formulas
3. **Same validations**: Status must be "OK" to process
4. **Same behavior**: Allow negative stock

## 8. Testing Strategy

### Unit Tests:
- Profit calculations
- Stock updates
- Bundle processing logic

### Integration Tests:
- Full sales processing flow
- Inventory synchronization
- Multi-channel scenarios

### User Acceptance Tests:
- Compare results with spreadsheet
- Verify all cost components
- Validate report accuracy

## 9. Deployment Considerations

### Environment Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Performance Optimization:
- Batch processing for multiple transactions
- Caching for frequently accessed data
- Optimistic UI updates

## 10. Future Enhancements (Not in Current Scope)

While not part of the initial implementation, potential future features include:
- Mobile app
- Barcode scanning
- Purchase order automation
- Advanced analytics
- API integration with marketplaces
- Multi-currency support
- Email notifications

## Conclusion

TokoFlow represents a direct digital transformation of the existing spreadsheet-based inventory and sales management system. By maintaining the familiar workflow while adding the benefits of a proper database and web application, it provides a smooth transition path for users while significantly improving data integrity, performance, and multi-user capabilities.

The system focuses on the core business needs: tracking inventory, recording sales, managing costs, and calculating accurate profit margins across multiple marketplace channels. Every feature and design decision is driven by the existing business logic and workflow, ensuring that users can immediately recognize and use the system effectively.
