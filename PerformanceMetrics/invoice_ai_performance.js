async function insertInvoicePerformanceMetric(connection, metric, entryId) {
    console.log("Inserting invoice performance metric into database...");
    console.log("metric", metric);
    if (metric.status == null) metric.status = "N/A";
    if (metric.error_message == null) metric.error_message = "";

    const metricQuery = `
        INSERT INTO invoice_ai_performance_metric 
        (file_size, processing_start, processing_end, processing_time, number_of_lines, number_of_invoices, status, error_message, model_utlized , entry_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        connection.query(metricQuery, [
            metric.file_size, 
            convertToMySQLDatetime(metric.processing_start), 
            convertToMySQLDatetime(metric.processing_end), 
            metric.processing_time, 
            metric.number_of_lines,
            metric.number_of_invoices,
            metric.status, 
            metric.error_message, 
            metric.model_utlized || "",
            entryId
        ], (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(results.insertId);
            }
        });
    });
}

async function insertClassificationPerformanceMetric(connection, metric) {
    console.log("Inserting classification performance metric into database...");
    console.log("metric", metric);

    const metricQuery = `
        INSERT INTO classification_time_performance_metric 
        (processing_start, processing_end, processing_time, number_of_lines, number_of_invoices, entry_id) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        connection.query(metricQuery, [
            convertToMySQLDatetime(metric.processing_start), 
            convertToMySQLDatetime(metric.processing_end), 
            metric.processing_time, 
            metric.number_of_lines, 
            metric.number_of_invoices, 
            metric.entry_id
        ], (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                resolve(results.insertId);
            }
        });
    });
}

const convertToMySQLDatetime = (isoDatetime) => {
    const date = new Date(isoDatetime);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

module.exports = { insertInvoicePerformanceMetric, insertClassificationPerformanceMetric };