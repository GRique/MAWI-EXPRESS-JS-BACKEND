
            UPDATE commercial_invoice
            SET
                invoice_number = CASE invoice_id WHEN 1554 THEN '687013501' END,
                invoice_date = CASE invoice_id WHEN 1554 THEN '2024-02-15' END,
                invoice_total = CASE invoice_id WHEN 1554 THEN 4334.88 END,
                sub_total = CASE invoice_id WHEN 1554 THEN 4334.88 END,
                supplier_name = CASE invoice_id WHEN 1554 THEN 'SOFT SHEEN. CARSON\'
TM' END,
                taxed_amount = CASE invoice_id WHEN 1554 THEN 0 END,
                supplier_address = CASE invoice_id WHEN 1554 THEN 'AddressValue(house_number=None, po_box=None, road=None, city=Cranbury, state=NJ, postal_code=08512, country_region=None, street_address=)' END,
                purchase_order_number = CASE invoice_id WHEN 1554 THEN '13635-24-SSC' END,
                inland = CASE invoice_id WHEN 1554 THEN 0 END,
                insurance = CASE invoice_id WHEN 1554 THEN 0 END,
                other_charges = CASE invoice_id WHEN 1554 THEN 0 END,
                currency = CASE invoice_id WHEN 1554 THEN 'USD' END,
                rate_of_exchange = CASE invoice_id WHEN 1554 THEN 6.77819 END
            WHERE invoice_id IN (1554);
        