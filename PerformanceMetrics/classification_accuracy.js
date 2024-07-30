async function insertPerformanceMetrics(connection, metrics) {
    try {
        const values = metrics.map(metric => [
            metric.invoice_line_id,
            metric.llm_recommended_classification_code,
            metric.approved_classification_code
        ]);

        const query = `
            INSERT INTO classification_accuracy_performance_metric (invoice_line_id, llm_recommended_classification_code, approved_classification_code)
            VALUES ?
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [values], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results.affectedRows);
                }
            });
        });
    } catch (error) {
        throw error;
    }
}

module.exports = { insertPerformanceMetrics };