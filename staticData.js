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
        
        regimeTypeMap.get(regimeTypeKey).cpcCodes.push({ code, name, cpcId });
    });

    return Array.from(regimeTypeMap.values());
}

async function getPortsByCountry(connection, country) {
    const query = `
        SELECT 
            id,
            name,
            country,
            port_code AS portCode
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




module.exports = { getCpcCodesAndRegimeTypes, formatCpcCodes, getPortsByCountry, getAllVessels, getCustomsEntryDeclarants, getSpecialExemptionsDeclarations };