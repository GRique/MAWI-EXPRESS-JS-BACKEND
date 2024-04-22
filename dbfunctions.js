// db.js

const pool = require('./dbConfig'); // Assuming you have a separate file for database connection pooling

async function getConnection() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });
}

async function beginTransaction(connection) {
    return new Promise((resolve, reject) => {
        connection.beginTransaction(err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function insertInvoice(connection, invoice, entryId) {
    if(invoice.supplier_address == null) invoice.supplier_address = "N/A"
    if(invoice.purchase_order == null) invoice.purchase_order = "N/A"
    const invoiceQuery = 'INSERT INTO commercial_invoice (invoice_number, invoice_date, invoice_total, sub_total, supplier_name, taxed_amount, supplier_address, purchase_order_number, entry_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        connection.query(invoiceQuery, [invoice.invoice_id, invoice.invoice_date, invoice.invoice_total, invoice.subtotal, invoice.vendor_name, invoice.total_tax, invoice.vendor_address, invoice.purchase_order, entryId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.insertId);
            }
        });
    });
}

async function insertWaybill(connection, waybill, entryId) {
    console.log(waybill)
    const invoiceQuery = 'INSERT INTO waybill (waybill_number, waybill_date, mode_of_transport, freight_type, marks_and_numbers, country_of_origin, cpc_code, npc_code, package_type, package_quantity, entry_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        connection.query(invoiceQuery, [waybill.waybillNumber, waybill.waybillDate, waybill.modeOfTransport, waybill.freightType, waybill.marksAndNumbers, waybill.countryOfOrigin, waybill.cpcCode, waybill.npcCode, waybill.kindOfPackage, waybill.numberOfPackages, entryId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.insertId);
            }
        });
    });
}

async function insertInvoiceLines(connection, invoice, entryId) {
    const invoiceId = await insertInvoice(connection, invoice, entryId);
    for (const line of invoice.invoice_items) {
        if(line.description == null) line.description = "Not Available"
        const lineQuery = 'INSERT INTO commercial_invoice_line (description, quantity, unit_price, extension_price, invoice_id, tariff_code, product_code) VALUES (?, ?, ?, ?, ?, ?, ?)';
        await new Promise((resolve, reject) => {
            connection.query(lineQuery, [line.description, line.quantity, line.unit_price, line.amount, invoiceId, line.tariffCode, line.product_code], err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

async function insertEntry(connection, entry) {

    const mawiInvoiceNumber = "0001"
    const currentDate = new Date();
    const customDateString = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
    console.log(customDateString)
    const sql = `
      INSERT INTO customs_entry (
        mawi_invoice,
        entry_number,
        entry_date,
        consignee,
        shipper,
        supplier_name,
        invoice_total,
        freight_charge,
        rate_of_exchange,
        net_weight,
        gross_weight
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        connection.query(
            sql,
            [
                mawiInvoiceNumber,
                entry.referenceNumber,
                customDateString,
                entry.consignee,
                entry.shipper,
                entry.supplier,
                entry.totalCargoValue,
                entry.freightCharge,
                entry.rateOfExchange,
                entry.netWeight,
                entry.grossWeight
            ],
            (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results.insertId);
                }
            }
        );
    });
}

async function commitTransaction(connection) {
    return new Promise((resolve, reject) => {
        connection.commit(err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Function to get entry data with joins
async function getEntriesWithDetails(connection) {
    try {
      const query = `
        SELECT 
          ce.entry_id,
          ce.mawi_invoice AS mawiInvoice,
          ce.entry_date,
          ce.invoice_total,
          ce.supplier_name,
          ce.gross_weight,
          ce.net_weight,
          ce.entry_number,
          ce.freight_charge,
          ce.rate_of_exchange,
          ce.consignee,
          ce.shipper,
          w.waybill_number,
          w.waybill_date,
          ci.invoice_number,
          ci.invoice_date,
          ci.sub_total,
          ci.invoice_total,
          ci.supplier_name AS ciSupplierName,
          ci.purchase_order_number
        FROM customs_entry ce
        LEFT JOIN waybill w ON ce.entry_id = w.entry_id
        LEFT JOIN commercial_invoice ci ON ce.entry_id = ci.entry_id
      `;

    return new Promise((resolve, reject) => {
        connection.query(query, (err, results) => {
            if (err) {
            reject(err);
            } else {
            resolve(results);
            }
        });
    });
    } catch (error) {
      console.error('Error fetching entries with details:', error);
      throw error;
    } finally {
      await connection.end();
    }
}

async function getCommercialInvoicesByEntryId(entryId, connection) {
    try {
      const query = `
        SELECT *
        FROM commercial_invoice
        WHERE entry_id = ?
      `;
        return new Promise((resolve, reject) => {
            connection.query(query, [entryId], (err, results) => {
                if (err) {
                reject(err);
                } else {
                resolve(results);
                }
            });
        });
    } catch (error) {
      throw error;
    } finally {
      await connection.end();
    }
}

async function getCommercialInvoicesWithLinesByEntryId(entryId, connection) {
    try {
      const query = `
        SELECT ci.*, cil.*
        FROM commercial_invoice ci
        LEFT JOIN commercial_invoice_line cil ON ci.invoice_id = cil.invoice_id
        WHERE ci.entry_id = ?
      `;
      return new Promise((resolve, reject) => {
        connection.query(query, [entryId], (err, results) => {
            if (err) {
            reject(err);
            } else {
            resolve(results);
            }
        });
    });
    } catch (error) {
      throw error; // We throw the error to handle it in the route
    } finally {
      await connection.end();
    }
}

async function getEntryAndWaybillByEntryId(entryId, connection) {
    try {
      const query = `
        SELECT ce.*, wb.*
        FROM customs_entry ce
        LEFT JOIN waybill wb ON ce.entry_id = wb.entry_id
        WHERE ce.entry_id = ?
      `;
        return new Promise((resolve, reject) => {
            connection.query(query, [entryId], (err, results) => {
                if (err) {
                reject(err);
                } else {
                resolve(results);
                }
            });
        });
    } catch (error) {
      throw error;
    } finally {
      await connection.end();
    }
}

async function updateWaybillDetails(connection, waybill, waybill_id) {

    const { waybill_number, waybill_date, mode_of_transport, freight_type, marks_and_numbers, country_of_origin, cpc_code, npc_code, package_type, package_quantity} = waybill;
    try {
        const query = `
          UPDATE waybill
          SET waybill_number = ?, waybill_date = ?, mode_of_transport = ?, freight_type = ?, marks_and_numbers = ?, country_of_origin = ?, cpc_code = ?, npc_code = ?, package_type = ?, package_quantity = ?
          WHERE waybill_id = ?
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [waybill_number, waybill_date, mode_of_transport, freight_type, marks_and_numbers, country_of_origin, cpc_code, npc_code, package_type, package_quantity, waybill_id], (err, results) => {
                if (err) {
                reject(err);
                } else {
                resolve(results.affectedRows);
                }
            });
        });
      } catch (error) {
        throw error;
      } finally {
        await connection.end();
      }
}

async function updateCustomsEntry(connection, entryData, entry_id) {

    try {
        const query = `
            UPDATE customs_entry
            SET mawi_invoice = ?, entry_date = ?, invoice_total = ?, supplier_name = ?,
                gross_weight = ?, net_weight = ?, entry_number = ?, freight_charge = ?,
                rate_of_exchange = ?, consignee = ?, shipper = ?
            WHERE entry_id = ?
            `;
            const params = [
                entryData.mawi_invoice,
                entryData.entry_date,
                entryData.invoice_total,
                entryData.supplier_name,
                entryData.gross_weight,
                entryData.net_weight,
                entryData.entry_number,
                entryData.freight_charge,
                entryData.rate_of_exchange,
                entryData.consignee,
                entryData.shipper,
                entry_id
            ];

        return new Promise((resolve, reject) => {
            connection.query(query, params, (err, results) => {
                if (err) {
                reject(err);
                } else {
                resolve(results.affectedRows);
                }
            });
        });
      } catch (error) {
        throw error;
      } finally {
        await connection.end();
      }
}

async function updateCommercialInvoice(connection, invoiceId, invoiceData) {
    const query = `
        UPDATE commercial_invoice
        SET invoice_number = ?, invoice_date = ?, invoice_total = ?, sub_total = ?, 
            supplier_name = ?, taxed_amount = ?, supplier_address = ?, purchase_order_number = ?
        WHERE invoice_id = ?
      `;
      const params = [
        invoiceData.invoice_number,
        invoiceData.invoice_date,
        invoiceData.invoice_total,
        invoiceData.sub_total,
        invoiceData.supplier_name,
        invoiceData.taxed_amount,
        invoiceData.supplier_address,
        invoiceData.purchase_order_number,
        invoiceId
      ];

    return new Promise((resolve, reject) => {
        connection.query(query, params, (err, results) => {
            if (err) {
            reject(err);
            } else {
            resolve(results.affectedRows);
            }
        });
     });
}

function updateCommercialInvoiceLine(connection, invoiceLineId, lineData) {
    const query = `
        UPDATE commercial_invoice_line
        SET description = ?, quantity = ?, unit_price = ?, extension_price = ?, tariff_code = ?, product_code = ?
        WHERE invoice_line_id = ?
      `;
      const params = [
        lineData.description,
        lineData.quantity,
        lineData.unit_price,
        lineData.extension_price,
        lineData.tariff_code,
        lineData.product_code,
        invoiceLineId
      ];

    return new Promise((resolve, reject) => {
        connection.query(query, params, (err, results) => {
            if (err) {
            reject(err);
            } else {
            resolve(results.affectedRows);
            }
        });
    });
}

module.exports = { getConnection, beginTransaction, insertInvoice, insertInvoiceLines, commitTransaction, insertEntry, insertWaybill, getEntriesWithDetails, getCommercialInvoicesByEntryId, getCommercialInvoicesWithLinesByEntryId, getEntryAndWaybillByEntryId, updateWaybillDetails, updateCustomsEntry, updateCommercialInvoice, updateCommercialInvoiceLine };
