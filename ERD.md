# TokoFlow ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    products ||--o{ product_costs : "has"
    products ||--o{ sales_transactions : "sold in"
    products ||--o{ incoming_goods : "received as"
    products ||--o{ product_compositions : "parent of"
    products ||--o{ product_compositions : "component of"
    
    marketplace_fees ||--o{ sales_transactions : "applies to"
    
    sales_input ||--|| sales_transactions : "processes to"
    incoming_goods_input ||--|| incoming_goods : "processes to"
    
    auth_users ||--o{ sales_transactions : "creates"
    auth_users ||--o{ incoming_goods : "creates"
    auth_users ||--o{ sales_input : "creates"
    auth_users ||--o{ incoming_goods_input : "creates"

    products {
        uuid id PK
        varchar sku UK
        varchar name
        integer stock
        timestamp created_at
        timestamp updated_at
    }

    product_costs {
        uuid id PK
        uuid product_id FK
        varchar sku UK
        decimal modal_cost
        decimal packing_cost
        decimal affiliate_percentage
        timestamp created_at
        timestamp updated_at
    }

    marketplace_fees {
        uuid id PK
        varchar channel UK
        decimal fee_percentage
        timestamp created_at
        timestamp updated_at
    }

    product_compositions {
        uuid id PK
        varchar parent_sku
        varchar component_sku
        integer quantity
        varchar source_channel
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    sales_transactions {
        uuid id PK
        date transaction_date
        varchar sku
        varchar product_name
        decimal selling_price
        integer quantity
        varchar channel
        decimal modal_cost
        decimal packing_cost
        decimal affiliate_cost
        decimal marketplace_fee
        decimal revenue
        decimal net_profit
        timestamp created_at
        uuid created_by FK
    }

    incoming_goods {
        uuid id PK
        date transaction_date
        varchar sku
        varchar product_name
        integer quantity
        timestamp created_at
        uuid created_by FK
    }

    sales_input {
        uuid id PK
        date transaction_date
        varchar sku
        varchar product_name
        decimal selling_price
        integer quantity
        varchar channel
        varchar status
        timestamp processed_at
        timestamp created_at
        uuid created_by FK
    }

    incoming_goods_input {
        uuid id PK
        date transaction_date
        varchar sku
        varchar product_name
        integer quantity
        varchar status
        timestamp processed_at
        timestamp created_at
        uuid created_by FK
    }

    auth_users {
        uuid id PK
        varchar email
        "..."
    }
```

## Key Relationships:

1. **Products** are the core entity with relationships to:
   - Product costs (1:1)
   - Sales transactions (1:many)
   - Incoming goods records (1:many)
   - Product compositions as both parent and component (many:many)

2. **Input Tables** (sales_input, incoming_goods_input):
   - Temporary staging tables that get processed
   - Records move to transaction tables after processing
   - Quantity field is cleared after processing (like the original spreadsheet)

3. **Marketplace Fees**:
   - Applied to sales transactions based on channel

4. **Product Compositions**:
   - Define bundle/package relationships
   - Can be channel-specific or apply to all channels ("semua")

5. **User Tracking**:
   - All transactions track who created them via created_by field
   - Links to Supabase auth.users table
