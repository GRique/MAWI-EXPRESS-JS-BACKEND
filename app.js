const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const apiRoutes = require('./api-routes');

const fs = require('fs');
const path = require('path');

const bodyParser = require('body-parser');

const app = express();
app.use(express.json({ limit: '100mb' }));

app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use(fileUpload({
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
}));

app.use(cors());
app.use(fileUpload());
const port = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'dist')));



app.use('/api', apiRoutes);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
