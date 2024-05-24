const pool = require('./dbConfig'); // Assuming you have a separate file for database connection pooling

// Function to insert a record into the customs_declaration_c75 table
async function insertCustomsDeclaration(connection, declaration) {
    const query = `INSERT INTO customs_declaration_c75 (seller_name_and_address, buyer_name_address, declarant_name_address, 
        terms_of_delivery, name_date_contract, related_parties_boolean, 
        influence_price_boolean, 
        transaction_value_approximate_boolean, restrictions_disposal_boolean, 
        sale_price_condition_boolean, 
        royalties_boolean, resale_disposal_boolean, 
        signatory_name, date_signed, status_of_signatory, signatory_phone_number, costs_commissions, costs_brokerage, 
        costs_containers_packing, goods_free_of_charge_materials, goods_free_of_charge_tools, royalties_license_fee, 
        procees_resale_disposal, cost_delivery_transport, cost_delivery_loading, cost_delivery_insurance, 
        cost_transport_after_arrival, charges_construction, other_charges, customs_duties_taxes, entry_id, seller_id, buyer_id, declarant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
        connection.query(query, [
            declaration.sellerNameAddress, declaration.buyerNameAddress, declaration.declarantNameAddress,
            declaration.incoTerms, declaration.numberAndDateofContract, declaration.relatedParties,
            declaration.influencePrice,
            declaration.transactionValueApproximate, declaration.restrictions,
            declaration.conditions,
            declaration.royalties_boolean, declaration.resale_disposal_boolean,
            declaration.signatory_name, declaration.date_signed, declaration.status_of_signatory, declaration.signatory_phone_number, declaration.costs_commissions, declaration.costs_brokerage,
            declaration.costs_containers_packing, declaration.goods_free_of_charge_materials, declaration.goods_free_of_charge_tools, declaration.royalties_license_fee,
            declaration.procees_resale_disposal, declaration.cost_delivery_transport, declaration.cost_delivery_loading, declaration.cost_delivery_insurance,
            declaration.cost_transport_after_arrival, declaration.charges_construction, declaration.other_charges, declaration.customs_duties_taxes, declaration.entryId, declaration.sellerId, declaration.buyerId, declaration.declarantId
        ], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.insertId);
            }
        });
    });
}

// Function to fetch a customs declaration record by entry_id
async function fetchCustomsDeclarationByEntryId(connection, entryId) {
    const query = 'SELECT * FROM customs_declaration_c75 WHERE entry_id = ?';
    return new Promise((resolve, reject) => {
        connection.query(query, [entryId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);  // Returns an array of records
            }
        });
    });
}

async function updateCustomsDeclaration(connection, declaration, entryId) {
    console.log('Updating customs declaration with entry ID:', entryId);
    console.log('Declaration:', declaration);
    const query = `UPDATE customs_declaration_c75 SET 
        seller_name_and_address = ?, buyer_name_address = ?, declarant_name_address = ?, 
        terms_of_delivery = ?, name_date_contract = ?, related_parties_boolean = ?, 
        influence_price_boolean = ?, 
        transaction_value_approximate_boolean = ?, restrictions_disposal_boolean = ?, 
        sale_price_condition_boolean = ?, 
        royalties_boolean = ?, resale_disposal_boolean = ?, 
        signatory_name = ?, date_signed = ?, status_of_signatory = ?, signatory_phone_number = ?, costs_commissions = ?, costs_brokerage = ?, 
        costs_containers_packing = ?, goods_free_of_charge_materials = ?, goods_free_of_charge_tools = ?, royalties_license_fee = ?, 
        procees_resale_disposal = ?, cost_delivery_transport = ?, cost_delivery_loading = ?, cost_delivery_insurance = ?, 
        cost_transport_after_arrival = ?, charges_construction = ?, other_charges = ?, customs_duties_taxes = ?, seller_id = ?, buyer_id = ?, declarant_id = ?
        WHERE entry_id = ?`;
    return new Promise((resolve, reject) => {
        connection.query(query, [
            declaration.sellerNameAddress, declaration.buyerNameAddress, declaration.declarantNameAddress,
            declaration.incoTerms, declaration.numberAndDateofContract, declaration.relatedParties,
            declaration.influencePrice,
            declaration.transactionValueApproximate, declaration.restrictions,
            declaration.conditions,
            declaration.royalties, declaration.resale_disposal_boolean,
            declaration.signatory_name, declaration.date_signed, declaration.status_of_signatory, declaration.signatory_phone_number, declaration.costs_commissions, declaration.costs_brokerage,
            declaration.costs_containers_packing, declaration.goods_free_of_charge_materials_consumed, declaration.goods_engineering_development, declaration.royalties_license_fee,
            declaration.procees_resale_disposal, declaration.cost_delivery_transport, declaration.cost_delivery_loading, declaration.cost_delivery_insurance,
            declaration.cost_transport_after_arrival, declaration.charges_construction, declaration.other_charges, declaration.customs_duties_taxes, declaration.sellerId, declaration.buyerId, declaration.declarantId,
            entryId
        ], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.affectedRows);  // Number of rows affected
            }
        });
    });
}


module.exports = { insertCustomsDeclaration, fetchCustomsDeclarationByEntryId, updateCustomsDeclaration };