const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const { sanitizeInvoiceData } = require('./lib');
const { getConnection, beginTransaction, insertInvoice, insertInvoiceLines, commitTransaction, insertEntry, insertWaybill, getEntriesWithDetails, getCommercialInvoicesByEntryId, getCommercialInvoicesWithLinesByEntryId, getEntryAndWaybillByEntryId, updateWaybillDetails, updateCustomsEntry, updateCommercialInvoice, updateCommercialInvoiceLine  } = require('./dbfunctions'); // Importing database functions
const { insertCustomsDeclaration, fetchCustomsDeclarationByEntryId, updateCustomsDeclaration } = require('./c75_table_db_functions');
const { generateCustomsDeclaration, generatePreSignedCustomsDeclaration } = require('./customsDocuments');
const { getSellers, getBuyers, getDeclarants, insertSeller, insertBuyer, insertDeclarant, getShippers, insertShipper } = require('./configurationTables');

const { getCpcCodesAndRegimeTypes, formatCpcCodes, getPortsByCountry, getAllVessels, getCustomsEntryDeclarants, getSpecialExemptionsDeclarations } = require('./staticData');

const { createDepositForm } = require('./AutomatedDocuments/depositForm');

const { createTTC84 } = require('./AutomatedDocuments/tt_c84');

const { createOvertimeForm } = require('./AutomatedDocuments/overtime');

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

        res.send({ entryId: entryId, message: 'All invoices and invoice lines added successfully.' });
        // res.send('All invoices and invoice lines added successfully.');
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
    console.log("Fetching Commercial Invoices with Lines")
    const invoicesWithLines = await getCommercialInvoicesWithLinesByEntryId(entryId, connection);
    console.log("Fetched Commercial Invoices with Lines", invoicesWithLines)
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

    // console.log('Invoice data:', invoiceData);
    // console.log('Invoice lines:', invoiceLines);
  
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

app.post('/generate-customs-declaration', async (req, res) => {
    const blankPDFPath = 'blank-customs-declaration - read-only.pdf'; // Update with the path to your blank PDF
    const outputPath = 'output - 2.pdf'; // Specify where the filled-out PDF should be saved

    // console.log(req.body)
  
    generateCustomsDeclaration(blankPDFPath, req.body, outputPath, (err, pdfBytes) => {
      if (err) {
        console.error('Error generating PDF', err);
        return res.status(500).send('Error generating PDF');
      }
      console.log('Sending PDF to client...');
      res.setHeader('Content-Type', 'application/pdf');
      res.send(Buffer.from(pdfBytes));
    //   res.send(`PDF has been generated and saved to ${savedPath}`);
    });
});

app.post('/generate-pre-signed-valuation-form', async (req, res) => {
    const blankPDFPath = 'Blank C75 Form 1.pdf';
    const outputPath = 'output - 2.pdf'; // Specify where the filled-out PDF should be saved

    // console.log(req.body)
  
    generatePreSignedCustomsDeclaration(req.body, (err, pdfBytes) => {
      if (err) {
        console.error('Error generating PDF', err);
        return res.status(500).send('Error generating PDF');
      }
      console.log('Sending PDF to client...');
      res.setHeader('Content-Type', 'application/pdf');
      res.send(Buffer.from(pdfBytes));
    //   res.send(`PDF has been generated and saved to ${savedPath}`);
    });

});

function convertYesNoToTinyInt(value) {
    return value.toLowerCase() === 'yes' ? 1 : 0;
}

// Endpoint to add a customs declaration record
app.post('/customs-declaration', async (req, res) => {
    try {
        const connection = await getConnection();
        let declaration = req.body;
        console.log("Prepareing to Save C75 Data")
        console.log(req.body)
        declaration.relatedParties = convertYesNoToTinyInt(declaration.relatedParties);
        declaration.influencePrice = convertYesNoToTinyInt(declaration.influencePrice);
        declaration.transactionValueBoolean = convertYesNoToTinyInt(declaration.transactionValueApproximate);
        declaration.restrictionsDisposalBoolean = convertYesNoToTinyInt(declaration.restrictions);
        declaration.salePriceConditionBoolean = convertYesNoToTinyInt(declaration.conditions);
        declaration.royaltiesBoolean = convertYesNoToTinyInt(declaration.royalties_boolean);
        declaration.resaleDisposalBoolean = convertYesNoToTinyInt(declaration.resale_disposal_boolean);
        
        const insertId = await insertCustomsDeclaration(connection, req.body);
        res.status(201).send({ message: 'Record added successfully', insertId: insertId });
    } catch (error) {
        console.error('Failed to insert customs declaration:', error);
        res.status(500).send({ message: 'Failed to insert record', error: error.message });
    }
});

app.get('/customs-declaration/:entryId', async (req, res) => {
    const entryId = req.params.entryId;  // Get entry_id from the URL parameter
    let connection = await getConnection();

    // Validate entryId as a precautionary measure
    if (!entryId || isNaN(parseInt(entryId))) {
        return res.status(400).send({ message: 'Invalid entry ID provided' });
    }

    try {
        const results = await fetchCustomsDeclarationByEntryId(connection, entryId);
        connection = await getConnection();
        const invoiceData = await getCommercialInvoicesByEntryId(entryId, connection)
        cconnection = await getConnection();
        const entryData = await getEntryAndWaybillByEntryId(entryId, connection);
        console.log(entryData)
        let invoiceTotal = 0;
        let invoiceNumbers = "";
        for (let i = 0; i < invoiceData.length; i++) {
            invoiceTotal += invoiceData[i].invoice_total;
            let invoiceDateObject = new Date(invoiceData[i].invoice_date);
            let formattedDate = `${invoiceDateObject.getFullYear()}-${(invoiceDateObject.getMonth() + 1).toString().padStart(2, '0')}-${invoiceDateObject.getDate().toString().padStart(2, '0')}`;
            invoiceNumbers += invoiceData[i].invoice_number + " " + formattedDate;
            if (i < invoiceData.length - 1) {
                invoiceNumbers += "\n";
            }
        }
        console.log(invoiceTotal)
        console.log(invoiceNumbers)
        if (results.length > 0) {
            responseData = results[0];
            responseData.invoiceTotal = invoiceTotal;
            responseData.invoiceNumbers = invoiceNumbers;
            responseData.rate_of_exchange = entryData[0].rate_of_exchange;
            responseData.entry_number = entryData[0].entry_number;
            res.status(200).send(responseData);  // Send the first (and should be only) record found
        } else {
            res.status(206).send({ message: 'No record found with the provided entry ID', invoiceTotal: invoiceTotal, invoiceNumbers: invoiceNumbers, rate_of_exchange: entryData[0].rate_of_exchange, entry_number: entryData[0].entry_number});
        }
    } catch (error) {
        console.error('Failed to fetch customs declaration:', error);
        res.status(500).send({ message: 'Failed to fetch record', error: error.message });
    }
});

app.put('/customs-declaration/:entryId', async (req, res) => {
    const entryId = req.params.entryId;

    // Validate entryId as a precautionary measure
    if (!entryId || isNaN(parseInt(entryId))) {
        return res.status(400).send({ message: 'Invalid entry ID provided' });
    }

    try {
        const connection = await getConnection();
        console.log("Prepareing to Update C75 Data")
        console.log(req.body)
        let declaration = req.body;
        declaration.relatedParties = convertYesNoToTinyInt(declaration.relatedParties);
        declaration.influencePrice = convertYesNoToTinyInt(declaration.influencePrice);
        declaration.transactionValueApproximate = convertYesNoToTinyInt(declaration.transactionValueApproximate);
        declaration.restrictions = convertYesNoToTinyInt(declaration.restrictions);
        declaration.conditions = convertYesNoToTinyInt(declaration.conditions);
        declaration.royalties_boolean = convertYesNoToTinyInt(declaration.royalties_boolean);
        declaration.resale_disposal_boolean = convertYesNoToTinyInt(declaration.resale_disposal_boolean);
        const affectedRows = await updateCustomsDeclaration(connection, declaration, entryId);
        if (affectedRows > 0) {
            res.status(200).send({ message: 'Record updated successfully' });
        } else {
            res.status(404).send({ message: 'No record found with the provided entry ID' });
        }
    } catch (error) {
        console.error('Failed to update customs declaration:', error);
        res.status(500).send({ message: 'Failed to update record', error: error.message });
    }
});


app.get('/sellers', async (req, res) => {
    try {
        const connection = await getConnection();
        const sellers = await getSellers(connection);
        res.json(sellers);
    } catch (error) {
        console.error('Error fetching sellers:', error);
        res.status(500).send('Error retrieving sellers');
    }
});

app.get('/buyers', async (req, res) => {
    try {
        const connection = await getConnection();
        const buyers = await getBuyers(connection);
        res.json(buyers);
    } catch (error) {
        console.error('Error fetching buyers:', error);
        res.status(500).send('Error retrieving buyers');
    }
});

app.get('/declarants', async (req, res) => {
    try {
        const connection = await getConnection();
        const declarants = await getDeclarants(connection);
        res.json(declarants);
    } catch (error) {
        console.error('Error fetching declarants:', error);
        res.status(500).send('Error retrieving declarants');
    }
});

app.post('/sellers', async (req, res) => {
    try {
        const connection = await getConnection();
        const sellerData = req.body;
        const result = await insertSeller(connection, sellerData);
        res.status(201).json({ message: 'Seller added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding seller:', error);
        res.status(500).send('Failed to add seller');
    }
});

app.post('/buyers', async (req, res) => {
    try {
        const connection = await getConnection();
        const buyerData = req.body;
        const result = await insertBuyer(connection, buyerData);
        res.status(201).json({ message: 'Buyer added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding buyer:', error);
        res.status(500).send('Failed to add buyer');
    }
});

app.post('/declarants', async (req, res) => {
    try {
        const connection = await getConnection();
        const declarantData = req.body;
        const result = await insertDeclarant(connection, declarantData);
        res.status(201).json({ message: 'Declarant added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding declarant:', error);
        res.status(500). send('Failed to add declarant');
    }
});

app.get('/cpc-codes/:country', async (req, res) => {
    try {
        const { country } = req.params;  // Getting country from URL parameter
        const connection = await getConnection();
        const cpcCodes = await getCpcCodesAndRegimeTypes(connection, country);
        const formattedResponse = formatCpcCodes(cpcCodes);
        res.json(formattedResponse);
    } catch (error) {
        console.error('Error fetching CPC codes and regime types:', error);
        res.status(500).send('Error retrieving CPC codes and regime types');
    }
});

app.get('/ports/:country', async (req, res) => {
    try {
        const { country } = req.params;  // Getting country from URL parameter
        const connection = await getConnection(); // Ensure getConnection() is defined and returns a valid database connection
        const ports = await getPortsByCountry(connection, country);
        res.json(ports);
    } catch (error) {
        console.error('Error fetching ports:', error);
        res.status(500).send('Error retrieving ports');
    }
});

app.get('/vessels', async (req, res) => {
    try {
        const connection = await getConnection(); // Ensure getConnection() is defined and returns a valid database connection
        const vessels = await getAllVessels(connection);
        res.json(vessels);
    } catch (error) {
        console.error('Error fetching vessels:', error);
        res.status(500).send('Error retrieving vessels');
    }
});

app.get('/shippers', async (req, res) => {
    try {
        const connection = await getConnection();
        const shippers = await getShippers(connection);
        res.json(shippers);
    } catch (error) {
        console.error('Error fetching shippers:', error);
        res.status(500).send('Error retrieving shippers');
    }
});

app.post('/shippers', async (req, res) => {
    try {
        const connection = await getConnection();
        const shipperData = req.body;
        const result = await insertShipper(connection, shipperData);
        res.status(201).json({ message: 'Shipper added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding shipper:', error);
        res.status(500).send('Failed to add shipper');
    }
});

app.get('/customs-entry-declarants', async (req, res) => {
    try {
        const connection = await getConnection();
        const declarants = await getCustomsEntryDeclarants(connection);
        res.json(declarants);
    } catch (error) {
        console.error('Error fetching customs entry declarants:', error);
        res.status(500).send('Error retrieving customs entry declarants');
    }
});

app.get('/special-exemptions-declarations/:importerId', async (req, res) => {
    const importerId = req.params.importerId;

    try {
        const connection = await getConnection();
        const declarations = await getSpecialExemptionsDeclarations(connection, importerId);
        res.json(declarations);
    } catch (error) {
        console.error('Error fetching special exemptions declarations:', error);
        res.status(500).send('Error retrieving special exemptions declarations');
    }
});

app.post('/deposit-form', (req, res) => {
    const filePath = 'AutomatedDocuments/deposit-blank.pdf'; // Update with the path to your deposit form PDF
    

    createDepositForm(filePath, req.body, (err, pdfBytes) => {
        if (err) {
            console.error('Error generating PDF:', err);
            return res.status(500).send('Error generating PDF');
        }
        console.log('PDF generated successfully');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));
    });
});

app.post('/overtime-form', (req, res) => {
    const filePath = 'AutomatedDocuments/overtime-blank.pdf'; // Update with the path to your overtime form PDF
    console.log(req.body)

    createOvertimeForm(filePath, req.body, (err, pdfBytes) => {
        if (err) {
            console.error('Error generating PDF:', err);
            return res.status(500).send('Error generating PDF');
        }
        console.log('PDF generated successfully');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));
    });
});

app.post('/tt-c84', (req, res) => {
    const filePath = 'AutomatedDocuments/tt_c84_blank.pdf'; // Update with the path to your TT C84 form PDF
    console.log(req.body)

    const data = req.body;

    createTTC84(filePath, req.body, data.presigned, (err, pdfBytes) => {
        if (err) {
            console.error('Error generating PDF:', err);
            return res.status(500).send('Error generating PDF');
        }
        console.log('PDF generated successfully');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
