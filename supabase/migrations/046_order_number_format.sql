-- Migrate order numbers from WO-YYYYMMDD-XXXX to CO-YYMMDD-00XXXX
UPDATE orders
SET order_number = 'CO-' || SUBSTRING(order_number FROM 6 FOR 6) || '-00' || SUBSTRING(order_number FROM 13)
WHERE order_number LIKE 'WO-%';
