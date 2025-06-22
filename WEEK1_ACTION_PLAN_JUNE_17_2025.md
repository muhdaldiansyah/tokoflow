# TokoFlow Immediate Action Plan - Week Starting June 17, 2025

## 🎯 This Week's Focus: Critical Fixes & Stability

### Monday-Tuesday (June 17-18): Database Transactions

**Objective**: Implement atomic operations to prevent partial updates

**Tasks**:
1. Create Supabase database functions for transactional processing

```sql
-- Create in Supabase SQL Editor
CREATE OR REPLACE FUNCTION process_sales_transaction(
  p_input_id UUID,
  p_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_input_record RECORD;
  v_cost_record RECORD;
  v_fee_record RECORD;
BEGIN
  -- Start transaction is implicit in function
  
  -- Get input data with lock
  SELECT * INTO v_input_record
  FROM sales_input
  WHERE id = p_input_id
  AND status = 'ok'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Input not found or not ready');
  END IF;
  
  -- Get cost data
  SELECT * INTO v_cost_record
  FROM product_costs
  WHERE sku = v_input_record.sku;
  
  -- Get fee data
  SELECT * INTO v_fee_record
  FROM marketplace_fees
  WHERE LOWER(channel) = LOWER(v_input_record.channel);
  
  -- Calculate profit (your existing logic)
  -- Insert transaction
  -- Update inventory
  -- Update compositions
  -- Clear input
  
  -- If we get here, commit is automatic
  RETURN json_build_object('success', true, 'data', v_result);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback is automatic on exception
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. Update API to use database functions

```javascript
// app/api/process/sales/route.js
const { data, error } = await supabase.rpc('process_sales_transaction', {
  p_input_id: inputId,
  p_user_id: user.id
});
```

3. Test with simulated failures

### Wednesday-Thursday (June 19-20): Validation Enhancement

**Objective**: Add comprehensive input validation

**Tasks**:
1. Install and configure Zod

```bash
npm install zod
```

2. Create validation schemas

```javascript
// lib/validations/sales.js
import { z } from 'zod';

export const salesInputSchema = z.object({
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sku: z.string().min(1).max(50),
  product_name: z.string().min(1).max(200),
  selling_price: z.number().positive(),
  quantity: z.number().int().positive(),
  channel: z.string().min(1).max(50),
  status: z.enum(['ok', 'pending']).default('ok')
});

export const validateSalesInput = (data) => {
  return salesInputSchema.safeParse(data);
};
```

3. Add to all API endpoints

```javascript
// app/api/sales/input/route.js
import { validateSalesInput } from '@/lib/validations/sales';

export async function POST(request) {
  const body = await request.json();
  
  const validation = validateSalesInput(body);
  if (!validation.success) {
    return errorResponse(validation.error.flatten().fieldErrors);
  }
  
  // Continue with validated data
}
```

4. Add client-side validation

```javascript
// components/forms/SalesInputForm.js
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const validation = validateSalesInput(formData);
  if (!validation.success) {
    setErrors(validation.error.flatten().fieldErrors);
    return;
  }
  
  // Submit validated data
};
```

### Friday (June 21): Testing Framework Setup

**Objective**: Set up Jest and write critical tests

**Tasks**:
1. Install testing dependencies

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

2. Configure Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

3. Write critical path tests

```javascript
// __tests__/calculations.test.js
import { calculateProfit } from '@/lib/utils/calculations';

describe('Profit Calculations', () => {
  test('calculates profit with all costs', () => {
    const input = {
      selling_price: 100000,
      quantity: 2,
      modal_cost: 40000,
      packing_cost: 2000,
      affiliate_percentage: 10,
      fee_percentage: 10
    };
    
    const result = calculateProfit(input);
    
    expect(result).toEqual({
      revenue: 200000,
      modal_total: 80000,
      packing_total: 4000,
      affiliate_cost: 20000,
      marketplace_fee: 20000,
      total_cost: 104000,
      net_profit: 76000,
      margin_percentage: 38
    });
  });
  
  test('handles zero values correctly', () => {
    const input = {
      selling_price: 100000,
      quantity: 1,
      modal_cost: 0,
      packing_cost: 0,
      affiliate_percentage: 0,
      fee_percentage: 0
    };
    
    const result = calculateProfit(input);
    
    expect(result.net_profit).toBe(100000);
    expect(result.margin_percentage).toBe(100);
  });
});
```

## 📋 Daily Checklist

### Monday (June 17)
- [ ] Create process_sales_transaction DB function
- [ ] Create process_incoming_goods_transaction DB function
- [ ] Test functions in Supabase dashboard

### Tuesday (June 18)
- [ ] Update sales processing API to use DB functions
- [ ] Update incoming goods API to use DB functions
- [ ] Test error scenarios (rollback behavior)

### Wednesday (June 19)
- [ ] Install Zod validation library
- [ ] Create validation schemas for all entities
- [ ] Add validation to POST/PUT endpoints

### Thursday (June 20)
- [ ] Add validation to PATCH endpoints
- [ ] Implement client-side form validation
- [ ] Create validation error display components

### Friday (June 21)
- [ ] Set up Jest testing framework
- [ ] Write tests for profit calculations
- [ ] Write tests for inventory updates
- [ ] Write tests for composition processing

## 🚨 Critical Testing Scenarios

1. **Sales Processing Failure**
   - Create sale with invalid SKU
   - Verify no inventory changes
   - Verify no transaction created

2. **Partial Bundle Failure**
   - Process sale of bundle with insufficient components
   - Verify rollback of all changes

3. **Concurrent Updates**
   - Two users processing same product simultaneously
   - Verify correct final stock

4. **Validation Edge Cases**
   - Negative prices
   - Zero quantities
   - Invalid dates
   - Missing required fields

## 📊 Success Metrics for Week 1

- [ ] Zero partial update failures
- [ ] All API endpoints validated
- [ ] 20+ unit tests passing
- [ ] Error messages user-friendly
- [ ] No data integrity issues

## 🔥 Quick Wins

1. **Add loading spinners** to all buttons during processing
2. **Show validation errors** inline on forms
3. **Add confirmation dialogs** for destructive actions
4. **Display success messages** after operations
5. **Auto-focus** first input field on forms

## 📝 Notes for Next Week

Based on this week's progress, Week 2 will focus on:
- Performance optimization (if transactions are slow)
- Real-time updates implementation
- Advanced error handling
- UI/UX improvements

Remember: **Stability first, features second!**

---

**Week Starting**: June 17, 2025  
**Primary Goal**: Zero data integrity issues  
**Secondary Goal**: Better user experience  
