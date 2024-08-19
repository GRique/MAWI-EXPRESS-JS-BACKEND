async function getInvoiceAIPerformanceMetrics(connection) {
    try {
        const query = `
            SELECT 
                processing_date,
                AVG(processing_time) AS average_processing_time,
                AVG(file_size) AS average_file_size,
                AVG(number_of_lines) AS average_number_of_lines,
                AVG(number_of_invoices) AS average_number_of_invoices
            FROM (
                SELECT 
                    DATE(processing_start) AS processing_date,
                    processing_time,
                    file_size,
                    number_of_lines,
                    number_of_invoices
                FROM 
                    invoice_ai_performance_metric
                JOIN (
                    SELECT DISTINCT processing_date FROM (
                        SELECT CURDATE() AS processing_date UNION ALL
                        SELECT CURDATE() - INTERVAL 1 DAY UNION ALL
                        SELECT CURDATE() - INTERVAL 2 DAY UNION ALL
                        SELECT CURDATE() - INTERVAL 3 DAY UNION ALL
                        SELECT CURDATE() - INTERVAL 4 DAY UNION ALL
                        SELECT CURDATE() - INTERVAL 5 DAY UNION ALL
                        SELECT CURDATE() - INTERVAL 6 DAY UNION ALL
                        SELECT CURDATE() - INTERVAL 7 DAY
                    ) AS last_seven_days
                    WHERE DAYOFWEEK(processing_date) NOT IN (1, 7)
                    ORDER BY processing_date DESC
                    LIMIT 5
                ) AS last_five_business_days
                ON DATE(processing_start) = last_five_business_days.processing_date
            ) AS subquery
            GROUP BY 
                processing_date
            ORDER BY 
                processing_date;
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
        throw error;
    } finally {
        await connection.release();
    }
}

async function getClassificationScoresByDate(connection) {
    try {
        const query = `
            SELECT 
                DATE(ce.entry_date) AS entry_date,
                SUM(CASE
                    WHEN LEFT(REPLACE(llm_recommended_classification_code, '.', ''), 6) != LEFT(REPLACE(approved_classification_code, '.', ''), 6) THEN 5
                    WHEN LEFT(REPLACE(llm_recommended_classification_code, '.', ''), 6) = LEFT(REPLACE(approved_classification_code, '.', ''), 6)
                         AND MID(REPLACE(llm_recommended_classification_code, '.', ''), 7, 2) != MID(REPLACE(approved_classification_code, '.', ''), 7, 2) THEN 3
                    WHEN LEFT(REPLACE(llm_recommended_classification_code, '.', ''), 8) = LEFT(REPLACE(approved_classification_code, '.', ''), 8)
                         AND RIGHT(REPLACE(llm_recommended_classification_code, '.', ''), 3) != RIGHT(REPLACE(approved_classification_code, '.', ''), 3) THEN 1
                    ELSE 0
                END) AS total_score,
                COUNT(*) AS total_records
            FROM 
                mawi.classification_accuracy_performance_metric acc
                LEFT JOIN commercial_invoice_line cil ON acc.invoice_line_id = cil.invoice_line_id
                LEFT JOIN commercial_invoice ci ON cil.invoice_id = ci.invoice_id
                LEFT JOIN customs_entry ce ON ci.entry_id = ce.entry_id
            JOIN (
                SELECT DISTINCT DATE(processing_date) AS processing_date
                FROM (
                    SELECT CURDATE() AS processing_date UNION ALL
                    SELECT CURDATE() - INTERVAL 1 DAY UNION ALL
                    SELECT CURDATE() - INTERVAL 2 DAY UNION ALL
                    SELECT CURDATE() - INTERVAL 3 DAY UNION ALL
                    SELECT CURDATE() - INTERVAL 4 DAY UNION ALL
                    SELECT CURDATE() - INTERVAL 5 DAY UNION ALL
                    SELECT CURDATE() - INTERVAL 6 DAY UNION ALL
                    SELECT CURDATE() - INTERVAL 7 DAY
                ) AS last_seven_days
                WHERE DAYOFWEEK(processing_date) NOT IN (1, 7)
                ORDER BY processing_date DESC
                LIMIT 5
            ) AS last_five_days ON DATE(ce.entry_date) = last_five_days.processing_date
            GROUP BY 
                DATE(ce.entry_date)
            ORDER BY 
                DATE(ce.entry_date) ASC;
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
        throw error;
    } finally {
        await connection.release();
    }
}

async function getClassificationCodeMatchPercentage(connection, targetDate) {
    try {
        const query = `
            SELECT 
                ROUND(
                    (SUM(
                        CASE
                            WHEN REPLACE(acc.llm_recommended_classification_code, '.', '') = REPLACE(acc.approved_classification_code, '.', '') 
                            THEN 1 ELSE 0 END
                    ) / COUNT(*)) * 100, 2
                ) AS match_percentage,
                ROUND(
                    (SUM(
                        CASE
                            WHEN REPLACE(acc.llm_recommended_classification_code, '.', '') != REPLACE(acc.approved_classification_code, '.', '') 
                            THEN 1 ELSE 0 END
                    ) / COUNT(*)) * 100, 2
                ) AS non_match_percentage
            FROM 
                classification_accuracy_performance_metric acc
            INNER JOIN 
                commercial_invoice_line cil ON acc.invoice_line_id = cil.invoice_line_id
            LEFT JOIN 
                commercial_invoice ci ON cil.invoice_id = ci.invoice_id
            LEFT JOIN 
                customs_entry ce ON ci.entry_id = ce.entry_id
            WHERE 
                acc.approved_classification_code IS NOT NULL
                AND DATE(ce.entry_date) = ?;
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [targetDate], (err, results) => {
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

async function getInvoiceProcessingTimeBuckets(connection, targetDate) {
    try {
        const query = `
            SELECT 
                buckets.time_bucket,
                COALESCE(data.record_count, 0) AS record_count,
                COALESCE(data.average_file_size, 0) AS average_file_size,
                COALESCE(data.entry_ids, '') AS entry_ids
            FROM (
                SELECT '0 - 20' AS time_bucket
                UNION ALL SELECT '20 - 40'
                UNION ALL SELECT '40 - 60'
                UNION ALL SELECT '60 - 80'
                UNION ALL SELECT '80 - 100'
                UNION ALL SELECT '100 - 120'
                UNION ALL SELECT 'Greater than 120'
            ) AS buckets
            LEFT JOIN (
                SELECT 
                    CASE
                        WHEN processing_time BETWEEN 0 AND 20 THEN '0 - 20'
                        WHEN processing_time BETWEEN 20 AND 40 THEN '20 - 40'
                        WHEN processing_time BETWEEN 40 AND 60 THEN '40 - 60'
                        WHEN processing_time BETWEEN 60 AND 80 THEN '60 - 80'
                        WHEN processing_time BETWEEN 80 AND 100 THEN '80 - 100'
                        WHEN processing_time BETWEEN 100 AND 120 THEN '100 - 120'
                        ELSE 'Greater than 120'
                    END AS time_bucket,
                    COUNT(*) AS record_count,
                    AVG(file_size) AS average_file_size,
                    GROUP_CONCAT(entry_id ORDER BY entry_id ASC SEPARATOR ', ') AS entry_ids
                FROM 
                    invoice_ai_performance_metric
                WHERE 
                    DATE(processing_start) = ?
                GROUP BY 
                    time_bucket
            ) AS data
            ON buckets.time_bucket = data.time_bucket
            ORDER BY 
                CASE
                    WHEN buckets.time_bucket = '0 - 20' THEN 1
                    WHEN buckets.time_bucket = '20 - 40' THEN 2
                    WHEN buckets.time_bucket = '40 - 60' THEN 3
                    WHEN buckets.time_bucket = '60 - 80' THEN 4
                    WHEN buckets.time_bucket = '80 - 100' THEN 5
                    WHEN buckets.time_bucket = '100 - 120' THEN 6
                    ELSE 7
                END;
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [targetDate], (err, results) => {
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

async function getClassificationAccuracyBuckets(connection, targetDate) {
    try {
        const query = `
            SELECT 
                CASE
                    WHEN LEFT(REPLACE(acc.llm_recommended_classification_code, '.', ''), 6) != LEFT(REPLACE(acc.approved_classification_code, '.', ''), 6) THEN 5
                    WHEN LEFT(REPLACE(acc.llm_recommended_classification_code, '.', ''), 6) = LEFT(REPLACE(acc.approved_classification_code, '.', ''), 6)
                         AND MID(REPLACE(acc.llm_recommended_classification_code, '.', ''), 7, 2) != MID(REPLACE(acc.approved_classification_code, '.', ''), 7, 2) THEN 3
                    WHEN LEFT(REPLACE(acc.llm_recommended_classification_code, '.', ''), 8) = LEFT(REPLACE(acc.approved_classification_code, '.', ''), 8)
                         AND RIGHT(REPLACE(acc.llm_recommended_classification_code, '.', ''), 3) != RIGHT(REPLACE(acc.approved_classification_code, '.', ''), 3) THEN 1
                    ELSE 0
                END AS score_bucket,
                COUNT(*) AS number_of_lines,
                GROUP_CONCAT(DISTINCT cil.invoice_line_id ORDER BY cil.invoice_line_id ASC) AS invoice_line_ids,
                GROUP_CONCAT(DISTINCT ce.entry_id ORDER BY ce.entry_id ASC) AS entry_ids
            FROM 
                mawi.classification_accuracy_performance_metric acc 
            INNER JOIN 
                commercial_invoice_line cil ON acc.invoice_line_id = cil.invoice_line_id
            LEFT JOIN 
                commercial_invoice ci ON cil.invoice_id = ci.invoice_id
            LEFT JOIN 
                customs_entry ce ON ci.entry_id = ce.entry_id
            WHERE 
                DATE(ce.entry_date) = ?
                AND acc.approved_classification_code IS NOT NULL
            GROUP BY 
                score_bucket
            ORDER BY 
                score_bucket ASC;
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [targetDate], (err, results) => {
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

async function getInvoiceLineBuckets(connection, targetDate) {
    try {
        const query = `
            SELECT 
                buckets.line_bucket,
                COALESCE(data.record_count, 0) AS record_count,
                COALESCE(data.average_file_size, 0) AS average_file_size,
                COALESCE(data.average_processing_time, 0) AS average_processing_time,
                COALESCE(data.entry_ids, '') AS entry_ids
            FROM (
                SELECT '1 - 5' AS line_bucket
                UNION ALL SELECT '6 - 10'
                UNION ALL SELECT '11 - 50'
                UNION ALL SELECT '51 - 100'
                UNION ALL SELECT '101 - 200'
                UNION ALL SELECT '201 - 500'
                UNION ALL SELECT 'Greater than 500'
            ) AS buckets
            LEFT JOIN (
                SELECT 
                    CASE
                        WHEN number_of_lines BETWEEN 1 AND 5 THEN '1 - 5'
                        WHEN number_of_lines BETWEEN 6 AND 10 THEN '6 - 10'
                        WHEN number_of_lines BETWEEN 11 AND 50 THEN '11 - 50'
                        WHEN number_of_lines BETWEEN 51 AND 100 THEN '51 - 100'
                        WHEN number_of_lines BETWEEN 101 AND 200 THEN '101 - 200'
                        WHEN number_of_lines BETWEEN 201 AND 500 THEN '201 - 500'
                        ELSE 'Greater than 500'
                    END AS line_bucket,
                    COUNT(*) AS record_count,
                    AVG(file_size) AS average_file_size,
                    AVG(processing_time) AS average_processing_time,
                    GROUP_CONCAT(entry_id ORDER BY entry_id ASC SEPARATOR ', ') AS entry_ids
                FROM 
                    invoice_ai_performance_metric
                WHERE 
                    DATE(processing_start) = ?
                GROUP BY 
                    line_bucket
            ) AS data
            ON buckets.line_bucket = data.line_bucket
            ORDER BY 
                CASE
                    WHEN buckets.line_bucket = '1 - 5' THEN 1
                    WHEN buckets.line_bucket = '6 - 10' THEN 2
                    WHEN buckets.line_bucket = '11 - 50' THEN 3
                    WHEN buckets.line_bucket = '51 - 100' THEN 4
                    WHEN buckets.line_bucket = '101 - 200' THEN 5
                    WHEN buckets.line_bucket = '201 - 500' THEN 6
                    ELSE 7
                END;
        `;

        return new Promise((resolve, reject) => {
            connection.query(query, [targetDate], (err, results) => {
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


module.exports = {
    getInvoiceAIPerformanceMetrics,
    getClassificationScoresByDate,
    getClassificationCodeMatchPercentage,
    getInvoiceProcessingTimeBuckets,
    getClassificationAccuracyBuckets,
    getInvoiceLineBuckets
};