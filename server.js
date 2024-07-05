const express = require('express');
const cron = require('node-cron');
// const fetch = require('node-fetch');

const app = express();
const port = 3008;
require('dotenv').config();
const openOrdersRouter = require('./openOrders');

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.use('/getOrders', openOrdersRouter)

//run it every 4 hours 0 */4 * * *
// cron.schedule('*/2 * * * *', function() {
//     fetch(`http://localhost:${port}/getOrders`)
//         .then(res => res.text())
//         .then(body => console.log(body))
//         .catch(err => console.error(err));
// });


app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});