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
    if(invoice.rate_of_exchange == null || invoice.rate_of_exchange == undefined) invoice.rate_of_exchange = 1
    const invoiceQuery = 'INSERT INTO commercial_invoice (invoice_number, invoice_date, invoice_total, sub_total, supplier_name, taxed_amount, supplier_address, purchase_order_number, entry_id, inland, insurance, other_charges, currency, rate_of_exchange) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        connection.query(invoiceQuery, [invoice.invoice_id, invoice.invoice_date, invoice.invoice_total, invoice.subtotal, invoice.vendor_name, invoice.total_tax, invoice.vendor_address, invoice.purchase_order, entryId, invoice.inland, invoice.insurance, invoice.otherCharges, invoice.currency, invoice.rate_of_exchange], (err, results) => {
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
    const importer = waybill.importer === '' ? null : waybill.importer;
    const shipper = waybill.shipper === '' ? null : waybill.shipper;
    const vessel = waybill.vessel === '' ? null : waybill.vessel;
    const portOfDischarge = waybill.portOfDischarge === '' ? null : waybill.portOfDischarge;
    const invoiceQuery = 'INSERT INTO waybill (waybill_number, waybill_date, mode_of_transport, freight_type, marks_and_numbers, country_of_origin, cpc_code, npc_code, package_type, package_quantity, importer, shipper, vessel, port_of_discharge, entry_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        connection.query(invoiceQuery, [waybill.waybillNumber, waybill.waybillDate, waybill.modeOfTransport, waybill.freightType, waybill.marksAndNumbers, waybill.countryOfOrigin, waybill.cpcCode, waybill.npcCode, waybill.kindOfPackage, waybill.numberOfPackages, importer, shipper, vessel, portOfDischarge, entryId], (err, results) => {
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
        console.log(line)
        if(line.description == null) line.description = "Not Available"
        const lineQuery = 'INSERT INTO commercial_invoice_line (description, quantity, unit_price, extension_price, invoice_id, tariff_code, product_code, country_of_origin, cpc_code, npc_code, vat_applicable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        await new Promise((resolve, reject) => {
            connection.query(lineQuery, [line.description, line.quantity, line.unit_price, line.amount, invoiceId, line.thn_code, line.product_code, line.country_of_origin, line.cpcCode, line.npcCode, line.vatApplicable], err => {
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
    console.log(entry)
    console.log(customDateString)
    const sql = `
      INSERT INTO customs_entry (
        mawi_invoice,
        entry_number,
        entry_date,
        consignee,
        supplier_name,
        invoice_total,
        freight_charge,
        rate_of_exchange,
        net_weight,
        gross_weight,
        declarant, 
        incoterms,
        regimeType,
        deposit,
        container_charges,
        additional_charges,
        local_fee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        connection.query(
            sql,
            [
                mawiInvoiceNumber,
                entry.referenceNumber,
                customDateString,
                entry.consignee,
                entry.supplier,
                entry.totalCargoValue,
                entry.freightCharge,
                entry.rateOfExchange,
                entry.netWeight,
                entry.grossWeight, 
                entry.declarant,
                entry.incoterms,
                entry.regimeType,
                entry.deposit,
                entry.containerCharges,
                entry.additionalCharges,
                entry.localFee
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
          ce.declarant,
          ce.incoterms,
          ce.regimeType,
          ce.deposit,
          ce.container_charges,
          ce.additional_charges,
          ce.local_fee,
          w.waybill_number,
          w.waybill_date,
          w.mode_of_transport,
          w.freight_type,
          w.marks_and_numbers,
          w.country_of_origin,
          bu.name AS importerName,
          w.importer,
          w.shipper,
          w.vessel,
          w.port_of_discharge,
          ci.invoice_number,
          ci.invoice_date,
          ci.sub_total,
          ci.invoice_total,
          ci.supplier_name AS ciSupplierName,
          ci.purchase_order_number
        FROM customs_entry ce
        LEFT JOIN waybill w ON ce.entry_id = w.entry_id
        LEFT JOIN commercial_invoice ci ON ce.entry_id = ci.entry_id
        LEFT JOIN buyer bu ON w.importer = bu.id
        GROUP BY ce.entry_id
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
      await connection.release();
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
      await connection.release();
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
      console.log("HEREEE")
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
      await connection.release();
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
      await connection.release();
    }
}

async function updateWaybillDetails(connection, waybill, waybill_id) {

    const { waybill_number, waybill_date, mode_of_transport, freight_type, marks_and_numbers, country_of_origin, cpc_code, npc_code, package_type, package_quantity, importer, shipper, vessel, port_of_discharge} = waybill;
    try {
        const query = `
          UPDATE waybill
          SET waybill_number = ?, waybill_date = ?, mode_of_transport = ?, freight_type = ?, marks_and_numbers = ?, country_of_origin = ?, cpc_code = ?, npc_code = ?, package_type = ?, package_quantity = ?, importer = ?, shipper = ?, vessel = ?, port_of_discharge = ?
          WHERE waybill_id = ?
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [waybill_number, waybill_date, mode_of_transport, freight_type, marks_and_numbers, country_of_origin, cpc_code, npc_code, package_type, package_quantity, importer, shipper, vessel, port_of_discharge, waybill_id], (err, results) => {
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
        await connection.release();
      }
}

async function updateCustomsEntry(connection, entryData, entry_id) {
    console.log(entryData)

    try {
        const query = `
            UPDATE customs_entry
            SET mawi_invoice = ?, entry_date = ?, invoice_total = ?, supplier_name = ?,
                gross_weight = ?, net_weight = ?, entry_number = ?, freight_charge = ?,
                rate_of_exchange = ?, consignee = ?, declarant = ?, incoterms = ?, regimeType = ?, deposit = ?, container_charges = ?, additional_charges = ?, local_fee = ?
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
                entryData.declarant,
                entryData.incoterms,
                entryData.regime_type,
                entryData.deposit,
                entryData.container_charges,
                entryData.additional_charges,
                entryData.local_fee,
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
        await connection.release();
      }
}

async function updateCommercialInvoice(connection, invoiceId, invoiceData) {
    console.log(invoiceData)
    const query = `
        UPDATE commercial_invoice
        SET invoice_number = ?, invoice_date = ?, invoice_total = ?, sub_total = ?, 
            supplier_name = ?, taxed_amount = ?, supplier_address = ?, purchase_order_number = ?, inland = ?, insurance = ?, other_charges = ?, currency = ?, rate_of_exchange = ?
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
        invoiceData.inland,
        invoiceData.insurance,
        invoiceData.other_charges,
        invoiceData.currency,
        invoiceData.rate_of_exchange,
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
    console.log(lineData)
    const query = `
        UPDATE commercial_invoice_line
        SET description = ?, quantity = ?, unit_price = ?, extension_price = ?, tariff_code = ?, product_code = ?, country_of_origin = ?
        WHERE invoice_line_id = ?
      `;
      const params = [
        lineData.description,
        lineData.quantity,
        lineData.unit_price,
        lineData.extension_price,
        lineData.tariff_code,
        lineData.product_code,
        lineData.country_of_origin,
        lineData.invoice_line_id
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
