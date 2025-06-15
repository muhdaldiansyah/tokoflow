# TokoFlow - Sistem Inventory & Penjualan Terintegrasi

TokoFlow adalah platform manajemen inventory dan penjualan yang dirancang khusus untuk UMKM Indonesia. Sistem ini mengimplementasikan logika dari Google Sheets ke platform web modern menggunakan Next.js.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📋 Features Implemented

### Authentication System
- ✅ **Login Page** (`/login`) - User authentication with email/password
- ✅ **Register Page** (`/register`) - New user registration with business information
- ✅ **Auth Hook** - Custom authentication management using React Context
- ✅ **Protected Routes** - Dashboard and other pages require authentication

### Navigation
- ✅ **Public Navigation** - Updated with Login/Register buttons
- ✅ **Responsive Design** - Mobile-friendly navigation drawer
- ✅ **TokoFlow Branding** - Consistent branding across all pages

### Dashboard
- ✅ **Dashboard Page** (`/dashboard`) - Main landing page after login
- ✅ **Statistics Overview** - Total omzet, profit, transactions, critical stock
- ✅ **Quick Actions** - Links to input sales, incoming goods, reports
- ✅ **Recent Activity** - Latest transactions and stock updates

## 🏗️ Architecture

```
tokoflow/
├── app/
│   ├── components/
│   │   ├── PublicNav.js      # Navigation with auth buttons
│   │   ├── Footer.js         # Updated footer with TokoFlow branding
│   │   └── ui/               # Reusable UI components
│   ├── hooks/
│   │   └── useAuth.js        # Authentication hook
│   ├── login/
│   │   └── page.js           # Login page
│   ├── register/
│   │   └── page.js           # Registration page
│   ├── dashboard/
│   │   └── page.js           # Main dashboard
│   └── layout.js             # Root layout with metadata
```

## 💡 Core Business Logic (From Sheets Analysis)

### Inventory Management
- Real-time stock tracking
- Multi-SKU support with bundle/package management
- Stock alerts for minimum levels
- Component tracking for bundled products

### Sales Processing
- Multi-channel sales (Shopee, Tokopedia, TikTok)
- Automatic fee calculation per marketplace
- Profit calculation including:
  - Base cost (modal)
  - Packaging costs
  - Affiliate commissions
  - Marketplace fees

### Financial Analytics
- Gross margin calculation
- Net profit tracking
- Channel performance analysis
- Product performance metrics

## 🔄 Data Flow

1. **Input Sales** → Calculate fees/profit → Update inventory → Save to records
2. **Input Stock** → Update inventory → Log transaction
3. **Bundle Products** → Track components → Auto-deduct on sales
4. **Reports** → Aggregate data → Display analytics

## 📊 Sample Data (From Analysis)

- Total Revenue: Rp 73.9M
- Net Profit: Rp 23.1M (31.3% margin)
- Best Channel: TikTok (38% margin)
- Critical Stock: 2 items (negative stock detected)

## 🛠️ Next Steps

To complete the TokoFlow implementation:

1. **Backend API**
   - Create REST API endpoints for data operations
   - Implement proper database (PostgreSQL/MySQL)
   - Add authentication with JWT tokens

2. **Core Features**
   - Sales input form (`/dashboard/penjualan/input`)
   - Stock input form (`/dashboard/barang-masuk/input`)
   - Inventory list (`/dashboard/inventori`)
   - Reports page (`/dashboard/laporan`)

3. **Data Management**
   - Master data CRUD (products, prices, fees)
   - Transaction processing
   - Stock validation
   - Batch operations

4. **Advanced Features**
   - Real-time notifications
   - Export to Excel/PDF
   - Barcode scanning
   - Mobile app

## 🔐 Security Notes

Current implementation uses localStorage for demo purposes. For production:
- Use secure HTTP-only cookies
- Implement CSRF protection
- Add rate limiting
- Use proper session management

## 📝 License

This project is proprietary software for PT TOKOFLOW DIGITAL INDONESIA.

---

For support: support@tokoflow.com | WhatsApp: +62 823 1163 9949