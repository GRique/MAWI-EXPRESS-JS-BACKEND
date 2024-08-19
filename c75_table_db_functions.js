const pool = require('./dbConfig'); // Assuming you have a separate file for database connection pooling

function convertToFloat(value) {
    if (value === null || value === undefined || value === '') {
        return 0.00;
    }
    return parseFloat(value);
}

// Function to insert a record into the customs_declaration_c75 table
async function insertCustomsDeclaration(connection, declaration) {
    console.log('Inserting customs declaration:', declaration);
    try{
        const query = `INSERT INTO customs_declaration_c75 (seller_name_and_address, buyer_name_address, declarant_name_address, 
        terms_of_delivery, number_date_invoice, name_date_contract, related_parties_boolean, 
        influence_price_boolean, 
        transaction_value_approximate_boolean, restrictions_disposal_boolean, 
        sale_price_condition_boolean, 
        royalties_boolean, resale_disposal_boolean, 
        signatory_name, date_signed, status_of_signatory, signatory_phone_number, costs_commissions, costs_brokerage, 
        costs_containers_packing, goods_free_of_charge_materials, goods_free_of_charge_tools, royalties_license_fee, 
        procees_resale_disposal, cost_delivery_transport, cost_delivery_loading, cost_delivery_insurance, 
        cost_transport_after_arrival, charges_construction, other_charges, customs_duties_taxes, entry_id, seller_id, buyer_id, declarant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        return new Promise((resolve, reject) => {
            connection.query(query, [
                declaration.sellerNameAddress, declaration.buyerNameAddress, declaration.declarantNameAddress,
                declaration.incoTerms, declaration.invoiceNumbersDates, declaration.numberAndDateofContract, declaration.relatedParties,
                declaration.influencePrice,
                declaration.transactionValueBoolean, declaration.restrictionsDisposalBoolean,
                declaration.salePriceConditionBoolean,
                declaration.royaltiesBoolean, declaration.resaleDisposalBoolean,
                declaration.signatory_name, declaration.date_signed, declaration.status_of_signatory, declaration.signatory_phone_number, convertToFloat(declaration.costs_commissions), convertToFloat(declaration.costs_brokerage),
                convertToFloat(declaration.costs_containers_packing), convertToFloat(declaration.goods_free_of_charge_materials), convertToFloat(declaration.goods_free_of_charge_tools), convertToFloat(declaration.royalties_license_fee),
                convertToFloat(declaration.procees_resale_disposal),convertToFloat( declaration.cost_delivery_transport), convertToFloat(declaration.cost_delivery_loading), convertToFloat(declaration.cost_delivery_insurance),
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
    catch(err){
        console.log(err);
        throw err;
    }
    finally{
        connection.release();
    }
    
}

// Function to fetch a customs declaration record by entry_id
async function fetchCustomsDeclarationByEntryId(connection, entryId) {
    const query = 'SELECT * FROM customs_declaration_c75 WHERE entry_id = ?';
    try{
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
    catch(err){
        console.log(err);
        throw err;
    }
    finally{
        connection.release();
    }
}

async function updateCustomsDeclaration(connection, declaration, entryId) {
    console.log('Updating customs declaration with entry ID:', entryId);
    // console.log('Declaration:', declaration);
    try {
        const query = `UPDATE customs_declaration_c75 SET 
        seller_name_and_address = ?, buyer_name_address = ?, declarant_name_address = ?, 
        terms_of_delivery = ?, number_date_invoice = ?, name_date_contract = ?, related_parties_boolean = ?, 
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
                declaration.incoTerms, declaration.invoiceNumbersDates, declaration.numberAndDateofContract, declaration.relatedParties,
                declaration.influencePrice,
                declaration.transactionValueApproximate, declaration.restrictions,
                declaration.conditions,
                declaration.royalties, declaration.resale_disposal_boolean,
                declaration.signatory_name, declaration.date_signed, declaration.status_of_signatory, declaration.signatory_phone_number, convertToFloat(declaration.costs_commissions), convertToFloat(declaration.costs_brokerage),
                convertToFloat(declaration.costs_containers_packing), convertToFloat(declaration.goods_free_of_charge_materials_consumed), convertToFloat(declaration.goods_engineering_development), convertToFloat(declaration.royalties_license_fee),
                convertToFloat(declaration.procees_resale_disposal), convertToFloat(declaration.cost_delivery_transport), convertToFloat(declaration.cost_delivery_loading), convertToFloat(declaration.cost_delivery_insurance),
                convertToFloat(declaration.cost_transport_after_arrival), convertToFloat(declaration.charges_construction), convertToFloat(declaration.other_charges), convertToFloat(declaration.customs_duties_taxes), declaration.sellerId, declaration.buyerId, declaration.declarantId,
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
    catch(err){
        console.log(err);
        throw err;
    }
    finally{
        connection.release();
    }
}


module.exports = { insertCustomsDeclaration, fetchCustomsDeclarationByEntryId, updateCustomsDeclaration };