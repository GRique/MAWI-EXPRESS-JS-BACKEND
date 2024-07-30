
            UPDATE commercial_invoice
            SET
                invoice_number = CASE invoice_id WHEN null THEN '213463' END,
                invoice_date = CASE invoice_id WHEN null THEN '2024-07-15' END,
                invoice_total = CASE invoice_id WHEN null THEN 375 END,
                sub_total = CASE invoice_id WHEN null THEN 0 END,
                supplier_name = CASE invoice_id WHEN null THEN 'THE BUSINESS SUPPLY' END,
                taxed_amount = CASE invoice_id WHEN null THEN 0 END,
                supplier_address = CASE invoice_id WHEN null THEN NULL END,
                purchase_order_number = CASE invoice_id WHEN null THEN 'N/A' END,
                inland = CASE invoice_id WHEN null THEN 0 END,
                insurance = CASE invoice_id WHEN null THEN 0 END,
                other_charges = CASE invoice_id WHEN null THEN 0 END,
                currency = CASE invoice_id WHEN null THEN 'USD' END,
                rate_of_exchange = CASE invoice_id WHEN null THEN 6.7723 END
            WHERE invoice_id IN ();
        