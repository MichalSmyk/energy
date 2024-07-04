const express = require('express');

const app = express();
const port = 3008;
require('dotenv').config();
const openOrdersRouter = require('./openOrders');

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.use('/getOrders', openOrdersRouter)


app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});