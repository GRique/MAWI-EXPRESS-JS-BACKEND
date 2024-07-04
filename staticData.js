async function getCpcCodesAndRegimeTypes(connection, country) {
    const query = `
        SELECT 
            rt.id AS regimeTypeId,
            rt.code AS regimeTypeCode,
            rt.name AS regimeTypeName,
            rt.country AS country,
            cpc.code AS code,
            cpc.name AS name,
            cpc.id AS cpcId
        FROM regime_type AS rt
        JOIN cpc_code AS cpc ON rt.id = cpc.regime_type
        WHERE rt.country = ?
    `;

    return new Promise((resolve, reject) => {
        connection.query(query, [country], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function formatCpcCodes(data) {
    const regimeTypeMap = new Map();
    
    data.forEach(item => {
        const { regimeTypeCode, regimeTypeName, code, name , regimeTypeId, cpcId} = item;
        const regimeTypeKey = `${regimeTypeCode} - ${regimeTypeName}`;
        
        if (!regimeTypeMap.has(regimeTypeKey)) {
            regimeTypeMap.set(regimeTypeKey, {
                regimeType: regimeTypeKey,
                regimeTypeId: regimeTypeId,
                regimeTypeCode: regimeTypeCode,
                cpcCodes: []
            });
        }
        
        regimeTypeMap.get(regimeTypeKey).cpcCodes.push({ code, name, cpcId, cpcDisplay: `${code} - ${name}`});
    });

    return Array.from(regimeTypeMap.values());
}

async function getPortsByCountry(connection, country) {
    const query = `
        SELECT 
            id,
            name,
            country,
            port_code AS portCode,
            asycuda_code AS asycudaCode
        FROM port
        WHERE country = ?
    `;

    try{
        return new Promise((resolve, reject) => {
            connection.query(query, [country], (err, results) => {
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

async function getAllVessels(connection) {
    const query = `
        SELECT 
            id,
            name,
            imo_number AS imoNumber
        FROM vessel
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
    }
    finally {
        await connection.release();
    }
}

async function getCustomsEntryDeclarants(connection) {
    const query = `
        SELECT 
            id,
            name,
            country,
            address,
            tax_identification_number AS taxIdentificationNumber
        FROM customs_entry_declarant
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
    }
    finally {
        await connection.release();
    }

}

async function getSpecialExemptionsDeclarations(connection, importerId) {
    const query = `
        SELECT 
            id,
            content,
            declaration_number,
            importer_id,
            extension_code AS extensionCode
        FROM special_exemption_declaration
        WHERE importer_id = ?
    `;

    try {
        return new Promise((resolve, reject) => {
            connection.query(query, [importerId], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    } catch (error) {
        console.error('Error fetching special exemptions declarations:', error);
        throw error;
    } finally {
        await connection.release();
    }
}

async function getAllNpcCodes(connection) {
    const query = `
        SELECT 
            code,
            description,
            reference,
            formC84Required,
            CONCAT(code, ' - ', description) AS code_description
        FROM 
            npc_codes;
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
    } catch (error) {
        console.error('Error fetching NPC codes:', error);
        throw error;
    } finally {
        await connection.release();
    }
}

async function getRatesOfExchange(targetCurrency, connection) {
    const query = `
        SELECT *
        FROM 
            rate_of_exchange
        WHERE 
            target_currency = ?
    `;

    try {
        return new Promise((resolve, reject) => {
            connection.query(query, [targetCurrency], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
    catch (error) {
        console.error('Error fetching exchange rates:', error);
        throw error;
    } finally{
        await connection.release();
    
    }
}

async function insertRateOfExchange(connection, rateOfExchange) {
    const query = `
        INSERT INTO rate_of_exchange
        (base_currency, target_currency, rate, last_updated)
        VALUES
        (?, ?, ?, ?)
    `;

    try {
        return new Promise((resolve, reject) => {
            connection.query(query, [rateOfExchange.baseCurrency, rateOfExchange.targetCurrency, rateOfExchange.rate, rateOfExchange.lastUpdated], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
    catch (error) {
        console.error('Error inserting exchange rate:', error);
        throw error;
    } finally {
        await connection.release();
    }

}

async function getRatesOfExchangeBasedOnShippedOnBoardDate(targetCurrency, shippedOnBoardDate, connection) {
    const query = `
        SELECT roe.*
        FROM rate_of_exchange roe
        INNER JOIN (
            SELECT base_currency, MAX(last_updated) AS max_date
            FROM rate_of_exchange
            WHERE last_updated < ? AND target_currency = ?
            GROUP BY base_currency
        ) subquery
        ON roe.base_currency = subquery.base_currency AND roe.last_updated = subquery.max_date
        WHERE roe.target_currency = ?;
    `;

    try {
        return new Promise((resolve, reject) => {
            connection.query(query, [shippedOnBoardDate, targetCurrency, targetCurrency], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        throw error;
    } finally {
        await connection.release();
    }
}




module.exports = { getCpcCodesAndRegimeTypes, formatCpcCodes, getPortsByCountry, getAllVessels, getCustomsEntryDeclarants, getSpecialExemptionsDeclarations, getAllNpcCodes, getRatesOfExchange, insertRateOfExchange, getRatesOfExchangeBasedOnShippedOnBoardDate };