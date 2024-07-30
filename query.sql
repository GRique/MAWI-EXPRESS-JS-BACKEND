
            UPDATE commercial_invoice_line
            SET
                description = CASE invoice_line_id  END,
                quantity = CASE invoice_line_id  END,
                unit_price = CASE invoice_line_id  END,
                extension_price = CASE invoice_line_id  END,
                tariff_code = CASE invoice_line_id  END,
                product_code = CASE invoice_line_id  END,
                country_of_origin = CASE invoice_line_id  END,
                cpc_code = CASE invoice_line_id  END,
                npc_code = CASE invoice_line_id  END,
                vat_applicable = CASE invoice_line_id  END,
                trade_agreement = CASE invoice_line_id  END
            WHERE invoice_line_id IN ();
        