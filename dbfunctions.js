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

    if(invoice.fileUrl == null || invoice.fileUrl == undefined) invoice.fileUrl = "";
    const invoiceQuery = 'INSERT INTO commercial_invoice (invoice_number, invoice_date, invoice_total, sub_total, supplier_name, taxed_amount, supplier_address, purchase_order_number, entry_id, inland, insurance, other_charges, currency, rate_of_exchange, file_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        connection.query(invoiceQuery, [invoice.invoice_id, invoice.invoice_date, invoice.invoice_total, invoice.subtotal, invoice.vendor_name, invoice.total_tax, invoice.vendor_address, invoice.purchase_order, entryId, invoice.inland, invoice.insurance, invoice.otherCharges, invoice.currency, invoice.rate_of_exchange, invoice.fileUrl], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.insertId);
            }
        });
    });
}

async function insertInvoiceLine(connection, line, invoiceId) {
    const lineQuery = 'INSERT INTO commercial_invoice_line (description, quantity, unit_price, extension_price, invoice_id, tariff_code, product_code, country_of_origin, cpc_code, npc_code, vat_applicable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        connection.query(lineQuery, [line.description, line.quantity, line.unit_price, line.amount, invoiceId, line.thn_code, line.product_code, line.country_of_origin, line.cpcCode, line.npcCode, line.vatApplicable], (err, results) => {
            if (err) {
                reject(err);
            } else {
                console.log("Line inserted. Line Id: ", results.insertId);
                resolve(results.insertId);
            }
        });
    });
}

async function insertVehicleLine(connection, line, invoiceLineId){
    console.log("Inserting vehicle line. Line Id: ", invoiceLineId)
    const lineQuery = 'INSERT INTO vehicle (gross_weight, net_weight, curb_weight, fuel_type, seat_position, model_code, number_of_seats, number_of_doors, tyre_size, engine_displacement, chassis_number, engine_number, exterior_color, customer_name, customer_tin, broker_instructions, ed_number, manufacture_year, invoice_line_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    await new Promise((resolve, reject) => {
        connection.query(lineQuery, [line.grossWeight, line.netWeight, line.curbWeight, line.fuelType, line.seatPosition, line.modelCode, line.numberOfSeats, line.numberOfDoors, line.tyreSize, line.engineDisplacement, line.chassisNumber, line.engineNumber, line.exteriorColor, line.customerName, line.tinNumber, line.brokerInstructions, line.edNumber, line.manufactureYear, invoiceLineId], (err, results) => {
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
    const invoiceQuery = 'INSERT INTO waybill (waybill_number, waybill_date, mode_of_transport, freight_type, marks_and_numbers, country_of_origin, country_of_final_destination, cpc_code, npc_code, package_type, package_quantity, importer, shipper, vessel, port_of_discharge, entry_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        connection.query(invoiceQuery, [waybill.waybillNumber, waybill.waybillDate, waybill.modeOfTransport, waybill.freightType, waybill.marksAndNumbers, waybill.countryOfOrigin, waybill.countryOfFinalDestination, waybill.cpcCode, waybill.npcCode, waybill.kindOfPackage, waybill.numberOfPackages, importer, shipper, vessel, portOfDischarge, entryId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.insertId);
            }
        });
    });
}

async function insertVehicleInvoiceLines(connection, invoice, entryId) {
    const invoiceId = await insertInvoice(connection, invoice, entryId);
    for (const line of invoice.invoice_items) {
        console.log(line);
        if (line.description == null) line.description = "Not Available";
        
        // Await the insertion of each invoice line
        const lineId = await insertInvoiceLine(connection, line, invoiceId);
        console.log("Line Id: ", lineId);
        
        // Call insertVehicleLine after obtaining the lineId
        const vehicleId = await insertVehicleLine(connection, line, lineId);
    }
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
        // const lineId = await insertInvoiceLine(connection, line, invoiceId);
    }
}

async function insertEntry(connection, entry) {

    const mawiInvoiceNumber = "0001"
    const currentDate = new Date();
    const customDateString = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
    const sql = `
      INSERT INTO customs_entry (
        mawi_invoice,
        entry_number,
        entry_date,
        consignee,
        supplier_name,
        invoice_total,
        freight_charge,
        insurance_amount,
        other_charges,
        rate_of_exchange,
        net_weight,
        gross_weight,
        declarant, 
        incoterms,
        regimeType,
        deposit,
        container_charges,
        additional_charges,
        local_fee,
        country_last_provenance,
        trading_country,
        entry_type,
        classification_status,
        classification_approved,
        classification_approved_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                entry.insuranceAmount,
                entry.otherCharges,
                entry.rateOfExchange,
                entry.netWeight,
                entry.grossWeight, 
                entry.declarant,
                entry.incoTerms,
                entry.regimeType,
                entry.deposit,
                entry.containerCharges,
                entry.additionalCharges,
                entry.localFee,
                entry.countryLastProvenance,
                entry.tradingCountry,
                entry.entryType,
                entry.classificationStatus,
                entry.classificationApproved,
                entry.classificationApprovedBy
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
          ce.insurance_amount,
          ce.other_charges,
          ce.rate_of_exchange,
          ce.consignee,
          ce.declarant,
          ce.incoterms,
          ce.regimeType,
          ce.deposit,
          ce.container_charges,
          ce.additional_charges,
          ce.local_fee,
          ce.country_last_provenance,
          ce.trading_country,
          ce.entry_type,
          ce.classification_status,
          ce.classification_approved,
          ce.classification_approved_by,
          w.waybill_number,
          w.waybill_date,
          w.mode_of_transport,
          w.freight_type,
          w.marks_and_numbers,
          w.country_of_origin,
          w.country_of_final_destination,
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

async function checkEntryNumberExists(connection, entryNumber) {
    const query = `
        SELECT COUNT(*) AS count
        FROM customs_entry
        WHERE entry_number = ?
    `;

    try {
        return new Promise((resolve, reject) => {
            connection.query(query, [entryNumber], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    const count = results[0].count;
                    if (count > 0) {
                        resolve({ exists: true, message: 'Entry number already exists' });
                    } else {
                        resolve({ exists: false, message: 'Entry number is available' });
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error checking entry number:', error);
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

async function getCommercialInvoicesWithVehiclesByEntryId(entryId, connection) {
    try {
        const query = `
          SELECT 
                ci.invoice_id AS ci_invoice_id, 
                ci.invoice_number, 
                ci.invoice_date, 
                ci.invoice_total, 
                ci.sub_total, 
                ci.supplier_name, 
                ci.taxed_amount, 
                ci.supplier_address, 
                ci.purchase_order_number, 
                ci.entry_id, 
                ci.inland, 
                ci.insurance, 
                ci.other_charges,
                cil.invoice_line_id AS cil_invoice_line_id,
                cil.description, 
                cil.quantity, 
                cil.unit_price, 
                cil.extension_price, 
                cil.tariff_code, 
                cil.product_code, 
                cil.country_of_origin, 
                cil.cpc_code, 
                cil.npc_code,
                v.id,
                v.gross_weight, 
                v.net_weight, 
                v.curb_weight, 
                v.fuel_type, 
                v.seat_position, 
                v.model_code, 
                v.number_of_seats, 
                v.number_of_doors, 
                v.tyre_size, 
                v.engine_displacement, 
                v.chassis_number, 
                v.engine_number, 
                v.exterior_color, 
                v.customer_name, 
                v.broker_instructions, 
                v.ed_number, 
                v.manufacture_year
            FROM commercial_invoice ci
            LEFT JOIN commercial_invoice_line cil ON ci.invoice_id = cil.invoice_id
            LEFT JOIN vehicle v ON cil.invoice_line_id = v.invoice_line_id
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
    console.log("saving waybill details")
    console.log(waybill)

    const { waybill_number, waybill_date, mode_of_transport, freight_type, marks_and_numbers, country_of_origin, country_of_final_destination, cpc_code, npc_code, package_type, package_quantity, importer, shipper, vessel, port_of_discharge} = waybill;
    try {
        const query = `
          UPDATE waybill
          SET waybill_number = ?, waybill_date = ?, mode_of_transport = ?, freight_type = ?, marks_and_numbers = ?, country_of_origin = ?, country_of_final_destination = ?, cpc_code = ?, npc_code = ?, package_type = ?, package_quantity = ?, importer = ?, shipper = ?, vessel = ?, port_of_discharge = ?
          WHERE waybill_id = ?
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [waybill_number, waybill_date, mode_of_transport, freight_type, marks_and_numbers, country_of_origin, country_of_final_destination, cpc_code, npc_code, package_type, package_quantity, importer, shipper, vessel, port_of_discharge, waybill_id], (err, results) => {
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
    console.log("saving customs entry details")
    console.log(entryData)

    try {
        const query = `
            UPDATE customs_entry
            SET mawi_invoice = ?, entry_date = ?, invoice_total = ?, supplier_name = ?,
                gross_weight = ?, net_weight = ?, entry_number = ?, freight_charge = ?, insurance_amount = ?, other_charges = ?,
                rate_of_exchange = ?, consignee = ?, declarant = ?, incoterms = ?, regimeType = ?, deposit = ?, container_charges = ?, additional_charges = ?, local_fee = ?, country_last_provenance = ?, trading_country = ?, classification_status = ?, classification_approved = ?, classification_approved_by = ?
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
                entryData.insurance_amount,
                entryData.other_charges,
                entryData.rate_of_exchange,
                entryData.consignee,
                entryData.declarant,
                entryData.incoterms,
                entryData.regime_type,
                entryData.deposit,
                entryData.container_charges,
                entryData.additional_charges,
                entryData.local_fee,
                entryData.country_last_provenance,
                entryData.trading_country,
                entryData.classification_status,
                entryData.classification_approved,
                entryData.classification_approved_by,
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
    console.log("Updating Invoice Line ID: ", lineData.invoice_line_id)
    console.log(lineData)
    const query = `
        UPDATE commercial_invoice_line
        SET description = ?, quantity = ?, unit_price = ?, extension_price = ?, tariff_code = ?, product_code = ?, country_of_origin = ?, cpc_code = ?, npc_code = ?, vat_applicable = ?
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
        lineData.cpc_code,
        lineData.npc_code,
        lineData.vat_applicable,
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

async function deleteInvoiceLines(connection, invoiceLineIds) {
    console.log("DB Functions Deleting Invoice Lines: ", invoiceLineIds)
    try {
        const query = `
        DELETE FROM commercial_invoice_line
        WHERE invoice_line_id IN (?)
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [invoiceLineIds], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
    catch (error) {
        throw error;
    }
    finally {
        await connection.release();
    }
}

module.exports = { getConnection, beginTransaction, insertInvoice, insertVehicleInvoiceLines, insertInvoiceLines, commitTransaction, insertEntry, insertWaybill, getEntriesWithDetails, getCommercialInvoicesByEntryId, getCommercialInvoicesWithVehiclesByEntryId, getCommercialInvoicesWithLinesByEntryId, getEntryAndWaybillByEntryId, updateWaybillDetails, updateCustomsEntry, updateCommercialInvoice, updateCommercialInvoiceLine, deleteInvoiceLines, checkEntryNumberExists };
