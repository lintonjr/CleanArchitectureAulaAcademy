const express = require('express');
const morgan = require('morgan');
const routes = require('./interfaces/http/routes');
require('dotenv').config();


const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use('/api', routes);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));


module.exports = app;