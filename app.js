const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const apiRoutes = require('./api-routes');

const fs = require('fs');
const path = require('path');

const app = express();
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
