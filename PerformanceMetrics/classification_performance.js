async function insertClassificationPerformanceMetric(connection, metric) {
    console.log("Inserting classification performance metric into database...");

    const metricQuery = `
        INSERT INTO classification_time_performance_metric 
        (processing_start, processing_end, processing_time, number_of_lines, number_of_invoices, entry_id) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
        connection.query(metricQuery, [
            metric.processing_start, 
            metric.processing_end, 
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

module.exports = { insertClassificationPerformanceMetric };
