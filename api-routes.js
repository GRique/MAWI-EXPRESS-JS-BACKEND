const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const fileUpload = require('express-fileupload');

const bodyParser = require('body-parser');


const { sanitizeInvoiceData } = require('./lib');
const { getConnection, beginTransaction, insertInvoice, insertVehicleInvoiceLines, insertInvoiceLines, commitTransaction, insertEntry, insertWaybill, getEntriesWithDetails, getCommercialInvoicesByEntryId, getCommercialInvoicesWithVehiclesByEntryId, getCommercialInvoicesWithLinesByEntryId, getEntryAndWaybillByEntryId, updateWaybillDetails, updateCustomsEntry, updateCommercialInvoice, updateCommercialInvoiceLine, deleteInvoiceLines, checkEntryNumberExists, getEntriesWithDetailsNotFullyStored, insertInvoiceLine, updateCommercialInvoiceLinesOptimized, updateMultipleCommercialInvoices, insertInvoiceLinesWithPerformanceMetrics, updatePerformanceMetrics  } = require('./dbfunctions'); // Importing database functions
const { insertCustomsDeclaration, fetchCustomsDeclarationByEntryId, updateCustomsDeclaration } = require('./c75_table_db_functions');
const { generateCustomsDeclaration, generatePreSignedCustomsDeclaration } = require('./customsDocuments');
const { getSellers, getBuyers, getDeclarants, insertSeller, insertBuyer, insertDeclarant, getShippers, insertShipper, insertVessel } = require('./configurationTables');

const { getCpcCodesAndRegimeTypes, formatCpcCodes, getPortsByCountry, getAllVessels, getCustomsEntryDeclarants, getSpecialExemptionsDeclarations, getAllNpcCodes, getAllNpcCodesWithCPC, getRatesOfExchange, insertRateOfExchange, getRatesOfExchangeBasedOnShippedOnBoardDate, getAllTradeAgreements } = require('./staticData');

const { createDepositForm } = require('./AutomatedDocuments/depositForm');

const { mergePDFs } = require('./AutomatedDocuments/merge-pdf');

const { createTTC84 } = require('./AutomatedDocuments/tt_c84');

const { createOvertimeForm } = require('./AutomatedDocuments/overtime');

const { generateScoonerBL } = require('./AutomatedDocuments/scooner-bl');

const { generateValuationForm } = require('./AutomatedDocuments/valuationFormupdate');

const { generateCaricomHTML } = require('./AutomatedDocuments/caricom');

const { uploadFilesToAzure } = require('./Azure-Storage/azure-storage-api');

const { insertInvoicePerformanceMetric, insertClassificationPerformanceMetric } = require('./PerformanceMetrics/invoice_ai_performance');

const { insertPerformanceMetrics } = require('./PerformanceMetrics/classification_accuracy');

const puppeteer = require('puppeteer');

const moment = require('moment-timezone');





const router = express.Router();

router.use(express.json({ limit: '100mb' }));

router.use(express.urlencoded({ limit: '100mb', extended: true }));

router.use(fileUpload({
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
}));



const pool = mysql.createPool({
    connectionLimit: 10, // Example limit, adjust as necessary
    host: 'rampslogistics-mysqldbserver.mysql.database.azure.com',
    user: 'mysqladmin@rampslogistics-mysqldbserver',
    password: 'Ramps101*',
    database: 'mawi'
});

router.get('/hello', (req, res) => {
    res.send('Hello MAWI');
});

router.get('/pool-status', async (req, res) => {
    let connection;
    try{
        connection = await getConnection();
        connection.release(); // Release the connection back to the pool

        res.json({
            connections: {
              acquired: pool._allConnections.length,
              available: pool._freeConnections.length,
              queue: pool._connectionQueue.length
            }
        });
    }
    catch(err){
        console.error('Error:', err);
    }
});

// Waybill CRUD operations
router.get('/waybills', async (req, res) => {
        db.query('SELECT * FROM waybill', (error, results) => {
            if (error) return res.status(500).send(error);
            res.json(results);
        });
    })

router.post('/waybills', async (req, res) => {
        const { waybill_number, waybill_date, mode_of_transport, freight_type } = req.body;
        const sql = 'INSERT INTO waybill (waybill_number, waybill_date, mode_of_transport, freight_type) VALUES (?, ?, ?, ?)';
        db.query(sql, [waybill_number, waybill_date, mode_of_transport, freight_type], (error, results) => {
            if (error) return res.status(500).send(error);
            res.status(201).send(`Waybill added with ID: ${results.insertId}`);
        });
    });

router.put('/waybills/:id', async (req, res) => {
        const { waybill_number, waybill_date, mode_of_transport, freight_type } = req.body;
        const sql = 'UPDATE waybill SET waybill_number = ?, waybill_date = ?, mode_of_transport = ?, freight_type = ? WHERE waybill_id = ?';
        db.query(sql, [waybill_number, waybill_date, mode_of_transport, freight_type, req.params.id], (error, results) => {
            if (error) return res.status(500).send(error);
            if (results.affectedRows === 0) return res.status(404).send('Waybill not found.');
            res.send('Waybill updated successfully.');
        });
    })
router.delete('/waybills/:id',  (req, res) => {
        db.query('DELETE FROM waybill WHERE waybill_id = ?', [req.params.id], (error, results) => {
            if (error) return res.status(500).send(error);
            if (results.affectedRows === 0) return res.status(404).send('Waybill not found.');
            res.send('Waybill deleted successfully.');
        });
    });

// Customs Entry CRUD operations
router.get('/customs_entries', async (req, res) => {
        db.query('SELECT * FROM customs_entry', (error, results) => {
            if (error) return res.status(500).send(error);
            res.json(results);
        });
    })
router.post('/customs_entries', async(req, res) => {
        const { mawi_invoice, invoice_date, invoice_total, supplier_name, purchase_order_number, gross_weight, net_weight, commercial_invoice_id, entry_number, waybill_number, freight_charge, rate_of_exchange, consignee, shipper, waybill_id } = req.body;
        const sql = 'INSERT INTO customs_entry (mawi_invoice, invoice_date, invoice_total, supplier_name, purchase_order_number, gross_weight, net_weight, commercial_invoice_id, entry_number, waybill_number, freight_charge, rate_of_exchange, consignee, shipper, waybill_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(sql, [mawi_invoice, invoice_date, invoice_total, supplier_name, purchase_order_number, gross_weight, net_weight, commercial_invoice_id, entry_number, waybill_number, freight_charge, rate_of_exchange, consignee, shipper, waybill_id], (error, results) => {
            if (error) return res.status(500).send(error);
            res.status(201).send(`Customs entry added with ID: ${results.insertId}`);
        });
    });

// THN Code CRUD operations
router.get('/thn_codes', async (req, res) => {
        db.query('SELECT * FROM thn_code', (error, results) => {
            if (error) return res.status(500).send(error);
            res.json(results);
        });
    })
router.post('/thn_codes', async(req, res) => {
        const { thn_number, duty, unit_of_measure } = req.body;
        const sql = 'INSERT INTO thn_code (thn_number, duty, unit_of_measure) VALUES (?, ?, ?)';
        db.query(sql, [thn_number, duty, unit_of_measure], (error, results) => {
            if (error) return res.status(500).send(error);
            res.status(201).send(`THN Code added with ID: ${thn_number}`);
        });
    });

// Product CRUD operations
router.get('/products', async (req, res) => {
        db.query('SELECT * FROM product', (error, results) => {
            if (error) return res.status(500).send(error);
            res.json(results);
        });
    })
router.post('/products', async(req, res) => {
        const { product_code, description, thn_code } = req.body;
        const sql = 'INSERT INTO product (product_code, description, thn_code) VALUES (?, ?, ?)';
        db.query(sql, [product_code, description, thn_code], (error, results) => {
            if (error) return res.status(500).send(error);
            res.status(201).send(`Product added with ID: ${product_code}`);
        });
    });

// Commercial Invoice CRUD operations
router.get('/commercial_invoices', async (req, res) => {
        db.query('SELECT * FROM commercial_invoice', (error, results) => {
            if (error) return res.status(500).send(error);
            res.json(results);
        });
    });


router.post('/commercial_invoices_vehicles', async (req, res) => {

    let connection;
    try {
        connection = await getConnection();
        await beginTransaction(connection);

        console.log("Inserting Commercial Invoice, Entry and Waybill Data")

        const entryData = req.body;
        console.log(entryData)

        const entryId = await insertEntry(connection, entryData);

        console.log("Entry Data Inserted: ", entryId)

        console.log("Inserting Waybill Data")

        const waybillId = await insertWaybill(connection, entryData, entryId);

        console.log("Waybill Data Inserted: ", waybillId)
        
        for (const invoice of entryData.invoiceList) {
            await insertVehicleInvoiceLines(connection, invoice, entryId);
        }

        await commitTransaction(connection);
        // connection.release();

        res.send({ entryId: entryId, message: ''});
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('An error occurred while processing the request.');
    }finally{
        if(connection){
            connection.release();
        }
    }
})



router.post('/commercial_invoices', async (req, res) => {
    const connection = await getConnection();
    try {
        
        await beginTransaction(connection);

        console.log("Inserting Commercial Invoice, Entry and Waybill Data")

        const entryData = req.body;
        console.log(entryData)

        const invoiceList = sanitizeInvoiceData(entryData.invoiceList);

        

        const fileList = entryData.files;

        const invoiceListWithFiles = invoiceList.map(invoice => {
            const file = (fileList || []).find(file => file.fileName === invoice.file_name);
            return file ? { ...invoice, ...file } : invoice;
        });

        console.log("Invoice List with Files", invoiceListWithFiles)


        const entryId = await insertEntry(connection, entryData);

        console.log("Entry Data Inserted: ", entryId)

        console.log("Inserting Waybill Data")

        const waybillId = await insertWaybill(connection, entryData, entryId);

        console.log("Waybill Data Inserted: ", waybillId)
        
        for (const invoice of invoiceListWithFiles) {
            // await insertInvoiceLines(connection, invoice, entryId);
            await insertInvoiceLinesWithPerformanceMetrics(connection, invoice, entryId);
        }

        await commitTransaction(connection);
        // connection.release();

        res.send({ entryId: entryId, message: 'All invoices and invoice lines added successfully.' });
        // res.send('All invoices and invoice lines added successfully.');
    } catch (err) {
        console.error('Saving Error:', err);
        res.status(500).send('An error occurred while processing the request.');
    }
    finally{
        if(connection){
            connection.release();
        }
    }
});

router.post('/invoice-lines', async (req, res) => {
    try {
        const connection = await getConnection();
        await beginTransaction(connection);

        const invoiceLineData = req.body;
        console.log(invoiceLineData)

        for (const line of invoiceLineData) {
            await insertInvoiceLine(connection, line, line.invoice_id);
        }

        await commitTransaction(connection);
        // connection.release();

        res.send('All invoices and invoice lines added successfully.');
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('An error occurred while processing the request.');
    }
    finally{
        if(connection){
            connection.release();
        }
    }
});



// Commercial Invoice Line CRUD operations
router.get('/commercial_invoice_lines', async (req, res) => {
        db.query('SELECT * FROM commercial_invoice_line', (error, results) => {
            if (error) return res.status(500).send(error);
            res.json(results);
        });
    })
router.post('/commercial_invoice_lines', async (req, res) => {
        const { description, quantity, unit_price, extension_price, invoice_id, tariff_code, product_code } = req.body;
        const sql = 'INSERT INTO commercial_invoice_line (description, quantity, unit_price, extension_price, invoice_id, tariff_code, product_code) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(sql, [description, quantity, unit_price, extension_price, invoice_id, tariff_code, product_code], (error, results) => {
            if (error) return res.status(500).send(error);
            res.status(201).send(`Commercial invoice line added with ID: ${results.insertId}`);
        });
    });

router.get('/entries/:entryStatus', async (req, res) => {
    try {
        const { entryStatus } = req.params;
        const connection = await getConnection();
        const entries = await getEntriesWithDetails(connection, entryStatus);
        res.json(entries);
    } catch (error) {
        console.error('Error in GET /entries:', error);
        res.status(500).send('Error retrieving entries');
    }
});

router.get('/entries-not-fully-stored', async (req, res) => {
    try {
        const connection = await getConnection();
        const entries = await getEntriesWithDetailsNotFullyStored(connection);
        res.json(entries);
    } catch (error) {
        console.error('Error in GET /entries:', error);
        res.status(500).send('Error retrieving entries');
    }
});

router.get('/commercial-invoices/:entryId', async (req, res) => {
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

router.get('/commercial-invoices-with-lines-with-vehicles/:entryId', async (req, res) => {
    const { entryId } = req.params;
  
  try {
    const connection = await getConnection();
    console.log("Fetching Commercial Invoices with Lines")
    const invoicesWithLines = await getCommercialInvoicesWithVehiclesByEntryId(entryId, connection);
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
      for (let key in groupedInvoices) {
        if (groupedInvoices.hasOwnProperty(key)) {
          let invoice = groupedInvoices[key];
          invoice.invoice_date = moment(invoice.invoice_date).tz('UTC').format('YYYY-MM-DD');
          invoice.new_date = moment(invoice.invoice_date).tz('UTC').format('YYYY-MM-DD');
        }
      }
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

router.get('/commercial-invoices-with-lines/:entryId', async (req, res) => {
    const { entryId } = req.params;
  
  try {
    const connection = await getConnection();
    console.log("Fetching Commercial Invoices with Lines")
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
      for (let key in groupedInvoices) {
        if (groupedInvoices.hasOwnProperty(key)) {
          let invoice = groupedInvoices[key];
          invoice.invoice_date = moment(invoice.invoice_date).tz('UTC').format('YYYY-MM-DD');
          invoice.new_date = moment(invoice.invoice_date).tz('UTC').format('YYYY-MM-DD');
        }
      }
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

router.get('/entry-details/:entryId', async (req, res) => {
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

router.put('/waybill/:waybillId', async (req, res) => {
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

router.put('/customs-entry/:entryId', async (req, res) => {
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

  router.put('/update-invoice-and-lines/:invoiceId', async (req, res) => {
    const { invoiceId } = req.params;
    const { invoiceData, invoiceLines } = req.body;

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
        

        const invoicePromise = updateCommercialInvoice(connection, invoiceId, invoiceData);
        // console.log("Updating Invoice Lines: ", invoiceLines)
        const invoiceLinesPromise = updateCommercialInvoiceLinesOptimized(connection, invoiceLines);

        await Promise.all([invoicePromise, invoiceLinesPromise]);

        await connection.commit();
        res.send('Invoice and invoice lines updated successfully.');
    } catch (error) {
        console.error('Error updating invoice and invoice lines:', error);
        if (connection) {
            await connection.rollback();
        }
        res.status(500).send('Error updating invoice and invoice lines');
    }
    finally{
        if(connection){
            connection.release();
        }
    }
  });

router.put('/update-multiple-invoices', async (req, res) => {
    const { invoices } = req.body;

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
        console.log("Updating Multiple Commercial Invoices Routes: ", invoices)
        await updateMultipleCommercialInvoices(connection, invoices);

        await connection.commit();
        res.send('Invoices updated successfully.');
    } catch (error) {
        console.error('Error updating invoices:', error);
        if (connection) {
            await connection.rollback();
        }
        res.status(500).send('Error updating invoices');
    }
    finally{
        if(connection){
            connection.release();
        }
    }
});

router.put('/update-multiple-invoice-lines', async (req, res) => {
    const { invoiceLines } = req.body;

    const connection = await getConnection();
    await connection.beginTransaction();


    try {
        await updateCommercialInvoiceLinesOptimized(connection, invoiceLines);

        await connection.commit();
        res.send('Invoice lines updated successfully.');
    } catch (error) {
        console.error('Error updating invoice lines:', error);
        if (connection) {
            await connection.rollback();
        }
        res.status(500).send('Error updating invoice lines');
    }
    finally{
        if(connection){
            connection.release();
        }
    }
});

router.post('/generate-customs-declaration', async (req, res) => {
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

router.get('/blank-valuation-form-trinidad', (req, res) => {
    const filePath = path.join(__dirname, 'blank-customs-declaration - read-only.pdf');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error reading file');
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.send(data);
    });
});

router.post('/generate-pre-signed-valuation-form', async (req, res) => {
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

router.post('/generate-pre-signed-valuation-form-v2', async (req, res) => {
    generateValuationForm(req.body, (err, pdfBytes) => {
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
router.post('/customs-declaration', async (req, res) => {
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

router.get('/customs-declaration/:entryId', async (req, res) => {
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

router.put('/customs-declaration/:entryId', async (req, res) => {
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


router.get('/sellers', async (req, res) => {
    try {
        const connection = await getConnection();
        const sellers = await getSellers(connection);
        res.json(sellers);
    } catch (error) {
        console.error('Error fetching sellers:', error);
        res.status(500).send('Error retrieving sellers');
    }
});

router.get('/buyers', async (req, res) => {
    try {
        const connection = await getConnection();
        const buyers = await getBuyers(connection);
        res.json(buyers);
    } catch (error) {
        console.error('Error fetching buyers:', error);
        res.status(500).send('Error retrieving buyers');
    }
});

router.get('/declarants', async (req, res) => {
    try {
        const connection = await getConnection();
        const declarants = await getDeclarants(connection);
        res.json(declarants);
    } catch (error) {
        console.error('Error fetching declarants:', error);
        res.status(500).send('Error retrieving declarants');
    }
});

router.post('/sellers', async (req, res) => {
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

router.post('/buyers', async (req, res) => {
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

router.post('/declarants', async (req, res) => {
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

router.get('/cpc-codes/:country', async (req, res) => {
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

router.get('/npc_codes', async (req, res) => {
    try {
        const connection = await getConnection(); // Ensure getConnection() is defined and returns a valid database connection
        const npcCodes = await getAllNpcCodes(connection);
        res.json(npcCodes);
    } catch (error) {
        console.error('Error fetching NPC codes:', error);
        res.status(500).send('Error retrieving NPC codes');
    }
});

router.get('/npc_codes_with_cpc', async (req, res) => {
    try {
        const connection = await getConnection(); // Ensure getConnection() is defined and returns a valid database connection
        const npcCodes = await getAllNpcCodesWithCPC(connection);
        res.json(npcCodes);
    } catch (error) {
        console.error('Error fetching NPC codes:', error);
        res.status(500).send('Error retrieving NPC codes');
    }
});

router.get('/ports/:country', async (req, res) => {
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
router.get('/rates-of-exchange/:target_currency', async (req, res) => {
    try {
        const { target_currency } = req.params;  // Getting base currency from URL parameter
        const connection = await getConnection(); // Ensure getConnection() is defined and returns a valid database connection
        const rates = await getRatesOfExchange(target_currency, connection);
        res.json(rates);
    } catch (error) {
        console.error('Error fetching rates of exchange:', error);
        res.status(500).send('Error retrieving rates of exchange');
    }
});

router.post('/rates-of-exchange', async (req, res) => {
    try {
        const connection = await getConnection();
        const rateData = req.body;
        rateData.lastUpdated = moment(rateData.lastUpdated).tz('UTC').format('YYYY-MM-DD');
        const result = await insertRateOfExchange(connection, rateData);
        res.status(201).json({ message: 'Rate of exchange added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding rate of exchange:', error);
        res.status(500).send('Failed to add rate of exchange');
    }
});

router.get('/exchange-rates/:targetCurrency/:date', async (req, res) => {
    const { targetCurrency, date } = req.params;
    
    try {
        const connection = await getConnection();
        const rates = await getRatesOfExchangeBasedOnShippedOnBoardDate(targetCurrency, date, connection);
        res.json(rates);
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/vessels', async (req, res) => {
    try {
        const connection = await getConnection();
        const vessels = await getAllVessels(connection);
        res.json(vessels);
    } catch (error) {
        console.error('Error fetching vessels:', error);
        res.status(500).send('Error retrieving vessels');
    }
});

router.post('/vessels', async (req, res) => {
    try {
        const connection = await getConnection();
        const vesselData = req.body;
        const result = await insertVessel(connection, vesselData);
        res.status(201).json({ message: 'Vessel added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding vessel:', error);
        res.status(500).send('Failed to add vessel');
    }
});

router.get('/shippers', async (req, res) => {
    try {
        const connection = await getConnection();
        const shippers = await getShippers(connection);
        res.json(shippers);
    } catch (error) {
        console.error('Error fetching shippers:', error);
        res.status(500).send('Error retrieving shippers');
    }
});

router.post('/shippers', async (req, res) => {
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

router.get('/customs-entry-declarants', async (req, res) => {
    try {
        const connection = await getConnection();
        const declarants = await getCustomsEntryDeclarants(connection);
        res.json(declarants);
    } catch (error) {
        console.error('Error fetching customs entry declarants:', error);
        res.status(500).send('Error retrieving customs entry declarants');
    }
});

router.get('/special-exemptions-declarations/:importerId', async (req, res) => {
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

router.post('/deposit-form', (req, res) => {
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

router.post('/generate-sconner-bl', (req, res) => {
    const filePath = 'AutomatedDocuments/Scooner-BL-Blank.pdf'; // Update with the path to your SCONNER BL form PDF
    console.log(req.body)

    generateScoonerBL(filePath, req.body, (err, pdfBytes) => {
        if (err) {
            console.error('Error generating PDF:', err);
            return res.status(500).send('Error generating PDF');
        }
        console.log('PDF generated successfully');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));
    });
});

router.post('/merge-pdfs', (req, res) => {
    const { pdfUrls } = req.body;
  
    if (!pdfUrls || !Array.isArray(pdfUrls)) {
      return res.status(400).send('Invalid input. Please provide an array of PDF URLs.');
    }
  
    mergePDFs(pdfUrls, (error, mergedPdfBytes) => {
      if (error) {
        console.error('Error merging PDFs:', error);
        return res.status(500).send('An error occurred while merging PDFs.');
      }
  
      // Send the merged PDF as a response
      res.setHeader('Content-Type', 'application/pdf');
      res.send(Buffer.from(mergedPdfBytes));
    });
  });

router.post('/overtime-form', (req, res) => {
    const filePath = 'AutomatedDocuments/overtime-blank.pdf'; // Update with the path to your overtime form PDF
    const secondPagePath = 'AutomatedDocuments/overtime-second-page.pdf'; // Update with the path to your second page of the overtime form PDF
    console.log(req.body)

    createOvertimeForm(filePath, secondPagePath, req.body, (err, pdfBytes) => {
        if (err) {
            console.error('Error generating PDF:', err);
            return res.status(500).send('Error generating PDF');
        }
        console.log('PDF generated successfully');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));
    });
});

router.post('/tt-c84', (req, res) => {
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


router.post('/generate-caricom', async (req, res) => {
    const data = req.body;
  
    const htmlTemplate = generateCaricomHTML(data);
  
    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 60000 // Increase timeout to 60 seconds
      });
      const page = await browser.newPage();
      await page.setContent(htmlTemplate, { waitUntil: 'networkidle2' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Error generating PDF');
    }
  });

router.post('/upload-invoices', async(req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    let files = req.files.files; // This will be an array of files
    if (!Array.isArray(files)) {
        files = [files];
    }
    console.log(files.length, 'files uploaded');
    const maxSize = 100 * 1024 * 1024; // 10 MB
    for (let file of files) {
        console.log(`Uploaded file size: ${file.size} bytes`);

        if (file.size > maxSize) {
            return res.status(413).send('One or more files are too large.');
        }
    }

    try {
        const fileResponse = await uploadFilesToAzure(files);
        console.log('File response:', fileResponse);
        res.status(200).send(fileResponse);

    } catch (err) {
        console.error('Error uploading file to Azure Blob Storage:', err);
        res.status(500).send('Error uploading file');
    }
})

router.delete('/invoice-lines', async (req, res) => {
    try {
        const connection = await getConnection();
        const invoiceLineIds  = req.body;
        console.log('Deleting Invoice line IDs:', invoiceLineIds)
        deleteInvoiceLines(connection, invoiceLineIds).then((result) => {
            res.status(200).json({ message: 'Invoice lines deleted successfully', affectedRows: result.affectedRows });
        }).catch((error) => {
            console.error('Error deleting invoice lines:', error);
            res.status(500).send('Failed to delete invoice lines');
        });
        
    } catch (error) {
        console.error('Error deleting invoice lines:', error);
        res.status(500).send('Failed to delete invoice lines');
    }
});

router.get('/check-entry-number/:entryNumber', async (req, res) => {
    const entryNumber = req.params.entryNumber;

    try {
        const connection = await getConnection();
        const result = await checkEntryNumberExists(connection, entryNumber);

        if (result.exists) {
            res.status(409).json({ message: result.message });
        } else {
            res.status(200).json({ message: result.message });
        }
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
});

router.get('/trade_agreements', async (req, res) => {
    try {
        const connection = await getConnection(); // Ensure getConnection() is defined and returns a valid database connection
        const tradeAgreements = await getAllTradeAgreements(connection);
        res.json(tradeAgreements);
    } catch (error) {
        console.error('Error fetching trade agreements:', error);
        res.status(500).send('Error retrieving trade agreements');
    }
});

router.post('/invoice-ai-performance', async (req, res) => {
    const { file, entryId, processing_start, processing_end, processing_time, number_of_lines, number_of_invoices, status, error_message, model_utlized } = req.body;

    const metric = {
        file_size: file.size,
        processing_start: processing_start,
        processing_end: processing_end,
        processing_time: processing_time,
        number_of_lines: number_of_lines,
        number_of_invoices: number_of_invoices,
        status: status || 'N/A',
        error_message: error_message || '',
        model_utlized: model_utlized || ''
    };
    console.log('Invoice AI Performance Metric:', metric);
    console.log('Entry ID:', entryId);

    let connection;

    try {
        connection = await getConnection();
        await insertInvoicePerformanceMetric(connection, metric, entryId);
        res.status(200).send('Metrics recorded successfully');
    } catch (error) {
        res.status(500).send('Failed to record metrics');
    }
    finally{
        if(connection){
            connection.release();
        }
    }
});

router.post('/classification-performance', async (req, res) => {
    const { processing_start, processing_end, processing_time, number_of_lines, number_of_invoices, entry_id } = req.body;

    const metric = {
        processing_start: processing_start,
        processing_end: processing_end,
        processing_time: processing_time,
        number_of_lines: number_of_lines,
        number_of_invoices: number_of_invoices,
        entry_id: entry_id
    };
    console.log('Classification Performance Metric:', metric);
    let connection;

    try {
        connection = await getConnection();
        await insertClassificationPerformanceMetric(connection, metric);
        res.status(200).send('Metrics recorded successfully');
    } catch (error) {
        console.error('Error recording metrics:', error);
        res.status(500).send('Failed to record metrics');
    }
    finally{
        if(connection){
            connection.release();
        }
    }
});

router.post('/classification-accuracy-performance-metrics', async (req, res) => {
    const metrics = req.body.metrics;

    if (!metrics || !Array.isArray(metrics)) {
        return res.status(400).send('Invalid metrics data');
    }

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
        await insertPerformanceMetrics(connection, metrics);
        await connection.commit();
        res.send('Performance metrics inserted successfully.');
    } catch (error) {
        console.error('Error inserting performance metrics:', error);
        if (connection) {
            await connection.rollback();
        }
        res.status(500).send('Error inserting performance metrics');
    } finally {
        connection.release();
    }
});

router.put('/update-classification-accuracy-performance-metrics', async (req, res) => {
    const metrics = req.body.metrics;

    if (!metrics || !Array.isArray(metrics)) {
        return res.status(400).send('Invalid metrics data');
    }

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
        await updatePerformanceMetrics(connection, metrics);
        await connection.commit();
        res.send('Performance metrics updated successfully.');
    } catch (error) {
        console.error('Error updating performance metrics:', error);
        if (connection) {
            await connection.rollback();
        }
        res.status(500).send('Error updating performance metrics');
    } finally {
        connection.release();
    }
});


module.exports = router;