app.post('/commercial_invoices', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection:', err);
            return res.status(500).send('Failed to get database connection.');
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                console.error('Error starting transaction:', err);
                return res.status(500).send('Transaction start failed.');
            }

            invoiceList = sanitizeInvoiceData(req.body);
            console.log(invoiceList);
            invoiceList.forEach((invoice, index, array) => {
                console.log("Inserting invoice:");
                const invoiceQuery = 'INSERT INTO commercial_invoice (invoice_number, invoice_date, invoice_total, sub_total, supplier_name, taxed_amount, supplier_address, purchase_order_number, entry_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                connection.query(invoiceQuery, [invoice.invoice_id, invoice.invoice_date, invoice.invoice_total, invoice.subtotal, invoice.vendor_name, invoice.total_tax, invoice.vendor_address, invoice.purchase_order, invoice.entryId], (err, results) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error('Error inserting invoice:', err);
                            return res.status(500).send('Failed to insert invoice.');
                        });
                    }

                    console.log("Inserting invoice lines:");

                    const invoiceId = results.insertId;
                    invoice.invoice_items.forEach(line => {
                        const lineQuery = 'INSERT INTO commercial_invoice_line (description, quantity, unit_price, extension_price, invoice_id, tariff_code, product_code) VALUES (?, ?, ?, ?, ?, ?, ?)';
                        connection.query(lineQuery, [line.description, line.quantity, line.unit_price, line.amount, invoiceId, line.tariffCode, line.product_code], err => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error('Error inserting invoice line:', err);
                                    return res.status(500).send('Failed to insert invoice line.');
                                });
                            }
                        });
                    });

                    if (index === array.length - 1) {
                        connection.commit(err => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error('Error committing transaction:', err);
                                    return res.status(500).send('Transaction commit failed.');
                                });
                            }
                            connection.release();
                            res.send('All invoices and invoice lines added successfully.');
                        });
                    }
                });
            });
        });
    });
});