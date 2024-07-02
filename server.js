const express = require('express');
const { google } = require('googleapis');
const keys = require('./energy.json'); 
const app = express();
const port = 3008;
require('dotenv').config();

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

async function appendDataToSheet(data) {
    const client = new google.auth.JWT(
      keys.client_email,
      null,
      keys.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
  
    const sheets = google.sheets({ version: 'v4', auth: client });
  
    const spreadsheetId = process.env.SPREAD_SHEET_ID; 
    const range = 'Sheet1!A2:BV2'; 
    const valueInputOption = 'USER_ENTERED';
    const resource = {
      values: [data],
    };
  
    try {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption,
        resource,
      });
      console.log(response.data);
    } catch (err) {
      console.error('The API returned an error: ' + err);
    }
  }

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});