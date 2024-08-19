// Function to get seller data from the database
async function getSellers(connection) {
    const query = `
        SELECT 
          id,
          name,
          address,
          country,
          phone_contact AS phoneContact,
          email_address AS emailAddress
        FROM seller
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
}

async function getShippers(connection){
    const query = `
        SELECT 
          id,
          name,
          address,
          country,
          phone_contact AS phoneContact,
          email_address AS emailAddress,
          tax_identification_number AS taxIdentificationNumber,
          active
        FROM shipper
        WHERE active = 1
    `;
    
    try { 
        return new Promise((resolve, reject) => {
            connection.query(query, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
    catch (error) {
        console.error('Error fetching entries with details:', error);
        throw error;
    } finally {
        await connection.release();
    }

}

async function getBuyers(connection) {
    const query = `
        SELECT 
          id,
          name,
          address,
          country,
          phone_contact AS phoneContact,
          email_address AS emailAddress,
          tax_identification_number AS taxIdentificationNumber,
          active
        FROM buyer
        WHERE active = 1
    `;
    
    try{
        return new Promise((resolve, reject) => {
            connection.query(query, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
    catch (error) {
        console.error('Error fetching entries with details:', error);
        throw error;
    } finally {
        await connection.release();
    }
}

async function getDeclarants(connection) {
    const query = `
        SELECT 
          id,
          name,
          address,
          country,
          phone_contact AS phoneContact,
          email_address AS emailAddress,
          status,
          importer AS importerCode,
          active
        FROM declarant
        WHERE active = 1
    `;
    
    try{
        return new Promise((resolve, reject) => {
            connection.query(query, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
    catch (error) {
        console.error('Error fetching entries with details:', error);
        throw error;
    } finally {
        await connection.release();
    }
}

async function insertSeller(connection, sellerData) {
    const { name, address, country, phoneContact, emailAddress } = sellerData;
    const query = `
        INSERT INTO seller (name, address, country, phone_contact, email_address)
        VALUES (?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        connection.query(query, [name, address, country, phoneContact, emailAddress], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

async function insertBuyer(connection, buyerData) {
    const { name, address, country, phoneContact, emailAddress, taxIdentificationNumber} = buyerData;
    const query = `
        INSERT INTO buyer (name, address, country, phone_contact, email_address, tax_identification_number)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        connection.query(query, [name, address, country, phoneContact, emailAddress, taxIdentificationNumber], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// Function to insert a declarant into the database
async function insertDeclarant(connection, declarantData) {
    const { name, address, country, phoneContact, emailAddress, status, importerId } = declarantData;
    const query = `
        INSERT INTO declarant (name, address, country, phone_contact, email_address, status, importer)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        connection.query(query, [name, address, country, phoneContact, emailAddress, status, importerId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

async function insertShipper(connection, shipperData) {
    const { name, address, country, phoneContact, emailAddress, taxIdentificationNumber } = shipperData;
    const query = `
        INSERT INTO shipper (name, address, country, phone_contact, email_address, tax_identification_number)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        connection.query(query, [name, address, country, phoneContact, emailAddress, taxIdentificationNumber], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

async function insertVessel(connection, vesselData) {
    const { name, imoNumber } = vesselData;
    const query = `
        INSERT INTO vessel (name, imo_number)
        VALUES (?, ?)
    `;

    return new Promise((resolve, reject) => {
        connection.query(query, [name, imoNumber], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

async function updateVessel(connection, vesselData) {
    console.log("Vessel Data", vesselData);
    const { id, name, imoNumber, active } = vesselData;

    // Prepare the query and log it to a file for debugging
    const query = `
        UPDATE vessel
        SET name = ?, imo_number = ?, active = ?
        WHERE id = ?
    `;
    
    const queryParams = [name, imoNumber, active, id];

    try {
        return new Promise((resolve, reject) => {
            connection.query(query, queryParams, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    console.log("Results", results);
                    resolve(results);
                }
            });
        });
    } catch (error) {
        console.error('Error updating vessel:', error);
        throw error;
    } finally {
        await connection.release();
    }
}

async function updateBuyer(connection, buyerData) {
    const { id, name, address, country, phoneContact, emailAddress, taxIdentificationNumber, active } = buyerData;
    const query = `
        UPDATE buyer
        SET name = ?, address = ?, country = ?, phone_contact = ?, email_address = ?, tax_identification_number = ?, active = ?
        WHERE id = ?
    `;

    try {
        return new Promise((resolve, reject) => {
            connection.query(query, [name, address, country, phoneContact, emailAddress, taxIdentificationNumber, active, id], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
    catch (error) {
        console.error('Error fetching entries with details:', error);
        throw error;
    } finally {
        await connection.release();
    }
}

async function updateShipper(connection, shipperData) {
    const { id, name, address, country, phoneContact, emailAddress, taxIdentificationNumber, active } = shipperData;
    const query = `
        UPDATE shipper
        SET name = ?, address = ?, country = ?, phone_contact = ?, email_address = ?, tax_identification_number = ?, active = ?
        WHERE id = ?
    `;

    try{
        return new Promise((resolve, reject) => {
            connection.query(query, [name, address, country, phoneContact, emailAddress, taxIdentificationNumber, active, id], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
    catch (error) {
        console.error('Error fetching entries with details:', error);
        throw error;
    } finally {
        await connection.release();
    }
}

async function updateDeclarant(connection, declarantData) {
    const { id, name, address, country, phoneContact, emailAddress, status, importerCode, active } = declarantData;
    const query = `
        UPDATE declarant
        SET name = ?, address = ?, country = ?, phone_contact = ?, email_address = ?, status = ?, importer = ?, active = ?
        WHERE id = ?
    `;

    try{
        return new Promise((resolve, reject) => {
            connection.query(query, [name, address, country, phoneContact, emailAddress, status, importerCode, active, id], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
    catch (error) {
        console.error('Error fetching entries with details:', error);
        throw error;
    } finally {
        await connection.release();
    }
}

module.exports = { getSellers, getBuyers, getDeclarants, insertSeller, insertBuyer, insertDeclarant, getShippers, insertShipper, insertVessel, updateBuyer, updateShipper, updateDeclarant, updateVessel };
