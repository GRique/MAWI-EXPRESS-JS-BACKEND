const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const { sanitizeInvoiceData } = require('./lib');
const { getConnection, beginTransaction, insertInvoice, insertInvoiceLines, commitTransaction, insertEntry, insertWaybill, getEntriesWithDetails, getCommercialInvoicesByEntryId, getCommercialInvoicesWithLinesByEntryId, getEntryAndWaybillByEntryId, updateWaybillDetails, updateCustomsEntry, updateCommercialInvoice, updateCommercialInvoiceLine  } = require('./dbfunctions'); // Importing database functions

const app = express();
app.use(cors());
const port = 3000;

app.use(express.json());

const path = require('path');

app.use(express.static(path.join(__dirname, 'dist')));

const pool = mysql.createPool({
    connectionLimit: 10, // Example limit, adjust as necessary
    host: 'rampslogistics-mysqldbserver.mysql.database.azure.com',
    user: 'mysqladmin@rampslogistics-mysqldbserver',
    password: 'Ramps101*',
    database: 'mawi'
});

// Waybill CRUD operations
app.route('/waybills')
    .get((req, res) => {
        db.query('SELECT * FROM waybill', (error, results) => {
            if (error) return res.status(500).send(error);
            res.json(results);
        });
    })
    .post((req, res) => {
        const { waybill_number, waybill_date, mode_of_transport, freight_type } = req.body;
        const sql = 'INSERT INTO waybill (waybill_number, waybill_date, mode_of_transport, freight_type) VALUES (?, ?, ?, ?)';
        db.query(sql, [waybill_number, waybill_date, mode_of_transport, freight_type], (error, results) => {
            if (error) return res.status(500).send(error);
            res.status(201).send(`Waybill added with ID: ${results.insertId}`);
        });
    });

app.route('/waybills/:id')
    .put((req, res) => {
        const { waybill_number, waybill_date, mode_of_transport, freight_type } = req.body;
        const sql = 'UPDATE waybill SET waybill_number = ?, waybill_date = ?, mode_of_transport = ?, freight_type = ? WHERE waybill_id = ?';
        db.query(sql, [waybill_number, waybill_date, mode_of_transport, freight_type, req.params.id], (error, results) => {
            if (error) return res.status(500).send(error);
            if (results.affectedRows === 0) return res.status(404).send('Waybill not found.');
            res.send('Waybill updated successfully.');
        });
    })
    .delete((req, res) => {
        db.query('DELETE FROM waybill WHERE waybill_id = ?', [req.params.id], (error, results) => {
            if (error) return res.status(500).send(error);
            if (results.affectedRows === 0) return res.status(404).send('Waybill not found.');
            res.send('Waybill deleted successfully.');
        });
    });

// Customs Entry CRUD operations
app.route('/customs_entries')
    .get((req, res) => {
        db.query('SELECT * FROM customs_entry', (error, results) => {
            if (error) return res.status(500).send(error);
            res.json(results);
        });
    })
    .post((req, res) => {
        const { mawi_invoice, invoice_date, invoice_total, supplier_name, purchase_order_number, gross_weight, net_weight, commercial_invoice_id, entry_number, waybill_number, freight_charge, rate_of_exchange, consignee, shipper, waybill_id } = req.body;
        const sql = 'INSERT INTO customs_entry (mawi_invoice, invoice_date, invoice_total, supplier_name, purchase_order_number, gross_weight, net_weight, commercial_invoice_id, entry_number, waybill_number, freight_charge, rate_of_exchange, consignee, shipper, waybill_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(sql, [mawi_invoice, invoice_date, invoice_total, supplier_name, purchase_order_number, gross_weight, net_weight, commercial_invoice_id, entry_number, waybill_number, freight_charge, rate_of_exchange, consignee, shipper, waybill_id], (error, results) => {
            if (error) return res.status(500).send(error);
            res.status(201).send(`Customs entry added with ID: ${results.insertId}`);
        });
    });

// THN Code CRUD operations
app.route('/thn_codes')
    .get((req, res) => {
        db.query('SELECT * FROM thn_code', (error, results) => {
            if (error) return res.status(500).send(error);
            res.json(results);
        });
    })
    .post((req, res) => {
        const { thn_number, duty, unit_of_measure } = req.body;
        const sql = 'INSERT INTO thn_code (thn_number, duty, unit_of_measure) VALUES (?, ?, ?)';
        db.query(sql, [thn_number, duty, unit_of_measure], (error, results) => {
            if (error) return res.status(500).send(error);
            res.status(201).send(`THN Code added with ID: ${thn_number}`);
        });
    });

// Product CRUD operations
app.route('/products')
    .get((req, res) => {
        db.query('SELECT * FROM product', (error, results) => {
            if (error) return res.status(500).send(error);
            res.json(results);
        });
    })
    .post((req, res) => {
        const { product_code, description, thn_code } = req.body;
        const sql = 'INSERT INTO product (product_code, description, thn_code) VALUES (?, ?, ?)';
        db.query(sql, [product_code, description, thn_code], (error, results) => {
            if (error) return res.status(500).send(error);
            res.status(201).send(`Product added with ID: ${product_code}`);
        });
    });

// Commercial Invoice CRUD operations
app.route('/commercial_invoices')
    .get((req, res) => {
        db.query('SELECT * FROM commercial_invoice', (error, results) => {
            if (error) return res.status(500).send(error);
            res.json(results);
        });
    });



app.post('/commercial_invoices', async (req, res) => {
    try {
        const connection = await getConnection();
        await beginTransaction(connection);

        const entryData = req.body;
        console.log(entryData)

        console.log("Inserting Entry Data")

        const invoiceList = sanitizeInvoiceData(entryData.invoiceList);

        const entryId = await insertEntry(connection, entryData);

        console.log("Entry Data Inserted: ", entryId)

        console.log("Inserting Waybill Data")

        const waybillId = await insertWaybill(connection, entryData, entryId);

        console.log("Waybill Data Inserted: ", waybillId)
        
        for (const invoice of invoiceList) {
            await insertInvoiceLines(connection, invoice, entryId);
        }

        await commitTransaction(connection);
        connection.release();

        res.send('All invoices and invoice lines added successfully.');
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('An error occurred while processing the request.');
    }
});



// Commercial Invoice Line CRUD operations
app.route('/commercial_invoice_lines')
    .get((req, res) => {
        db.query('SELECT * FROM commercial_invoice_line', (error, results) => {
            if (error) return res.status(500).send(error);
            res.json(results);
        });
    })
    .post((req, res) => {
        const { description, quantity, unit_price, extension_price, invoice_id, tariff_code, product_code } = req.body;
        const sql = 'INSERT INTO commercial_invoice_line (description, quantity, unit_price, extension_price, invoice_id, tariff_code, product_code) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(sql, [description, quantity, unit_price, extension_price, invoice_id, tariff_code, product_code], (error, results) => {
            if (error) return res.status(500).send(error);
            res.status(201).send(`Commercial invoice line added with ID: ${results.insertId}`);
        });
    });

app.get('/entries', async (req, res) => {
    try {
        const connection = await getConnection();
        const entries = await getEntriesWithDetails(connection);
        res.json(entries);
    } catch (error) {
        console.error('Error in GET /entries:', error);
        res.status(500).send('Error retrieving entries');
    }
});

app.get('/commercial-invoices/:entryId', async (req, res) => {
    const { entryId } = req.params;
    
    try {
        const connection = await getConnection();
        const invoices = await getCommercialInvoicesByEntryId(entryId, connection);
        if (invoices.length > 0) {
            res.json(invoices);
        } else {
            res.status(404).send('No commercial invoices found for the given entry ID.');
        }
    } catch (error) {
        console.error('Error fetching commercial invoices:', error);
        res.status(500).send('Error retrieving commercial invoices');
    }
});

app.get('/commercial-invoices-with-lines/:entryId', async (req, res) => {
    const { entryId } = req.params;
  
  try {
    const connection = await getConnection();
    const invoicesWithLines = await getCommercialInvoicesWithLinesByEntryId(entryId, connection);
    if (invoicesWithLines.length > 0) {
      // Process the result to group invoice lines under their respective invoices
      const groupedInvoices = invoicesWithLines.reduce((acc, line) => {
        // If the invoice hasn't been added to the accumulator, add it
        if (!acc[line.invoice_id]) {
          acc[line.invoice_id] = {
            ...line,
            lines: []
          };
        }
        // Add the invoice line to the 'lines' array
        acc[line.invoice_id].lines.push(line);
        return acc;
      }, {});
      
      // Send the grouped invoices as an array
      res.json(Object.values(groupedInvoices));
    } else {
      res.status(404).send('No commercial invoices found for the given entry ID.');
    }
  } catch (error) {
    console.error('Error fetching commercial invoices with lines:', error);
    res.status(500).send('Error retrieving commercial invoices with lines');
  }
});

app.get('/entry-details/:entryId', async (req, res) => {
    const { entryId } = req.params;
  
    try {
    const connection = await getConnection();
      const results = await getEntryAndWaybillByEntryId(entryId, connection);
      if (results.length > 0) {
        res.json(results[0]); // Send the first result back
      } else {
        res.status(404).send('No entry details found for the given entry ID.');
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('An error occurred while retrieving entry details.');
    }
});

app.put('/waybill/:waybillId', async (req, res) => {
    const { waybillId } = req.params;
    const waybillData = req.body;
  
    try {
      const connection = await getConnection();
      
      const updatedRows = await updateWaybillDetails(connection, waybillData, waybillId);
      if (updatedRows > 0) {
        res.send('Waybill updated successfully.');
      } else {
        res.status(404).send('Waybill not found.');
      }
    } catch (error) {
      console.error('Error updating waybill:', error);
      res.status(500).send('An error occurred while updating the waybill.');
    }
})

app.put('/customs-entry/:entryId', async (req, res) => {
    const { entryId } = req.params;
    const entryData = req.body;
  
    try {
      const connection = await getConnection();
      const result = await updateCustomsEntry(connection, entryData, entryId);
      console.log('Result:', result);
      if (result > 0) {
        res.send('Customs entry updated successfully.');
      } else {
        res.status(404).send('Customs entry not found.');
      }
    } catch (error) {
      console.error('Error updating customs entry:', error);
      res.status(500).send('Error updating customs entry');
    }
  });

  app.put('/update-invoice-and-lines/:invoiceId', async (req, res) => {
    const { invoiceId } = req.params;
    const { invoiceData, invoiceLines } = req.body;

    console.log('Invoice data:', invoiceData);
    console.log('Invoice lines:', invoiceLines);
  
    try {
        const connection = await getConnection();
      // Update the invoice
      const invoicePromise = updateCommercialInvoice(connection, invoiceId, invoiceData);
      
      // Update the invoice lines
      const invoiceLinesPromises = invoiceLines.map(line =>
        updateCommercialInvoiceLine(connection, line.invoice_line_id, line)
      );
  
      // Using Promise.all to execute the invoice update and all invoice lines updates
      await Promise.all([invoicePromise, ...invoiceLinesPromises]);
  
      res.send('Invoice and invoice lines updated successfully.');
    } catch (error) {
      console.error('Error updating invoice and invoice lines:', error);
      res.status(500).send('Error updating invoice and invoice lines');
    }
  });

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
