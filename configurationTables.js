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
          tax_identification_number AS taxIdentificationNumber
        FROM shipper
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
          tax_identification_number AS taxIdentificationNumber
        FROM buyer
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
          importer AS importerCode
        FROM declarant
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
    const { name, address, country, phoneContact, emailAddress, status } = declarantData;
    const query = `
        INSERT INTO declarant (name, address, country, phone_contact, email_address, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        connection.query(query, [name, address, country, phoneContact, emailAddress, status], (err, results) => {
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

module.exports = { getSellers, getBuyers, getDeclarants, insertSeller, insertBuyer, insertDeclarant, getShippers, insertShipper };
