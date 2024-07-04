const { google } = require('googleapis');
const keys = require('./energy.json'); 
require('dotenv').config();
const moment = require('moment');


async function appendDataToSheet(data) {
    // console.log("data in google", JSON.stringify(data));
    // console.log(JSON.stringify(data.order.lineItems))
    const client = new google.auth.JWT(
      keys.client_email,
      null,
      keys.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
  
    const sheets = google.sheets({ version: 'v4', auth: client });
  
    const spreadsheetId = process.env.SPREAD_SHEET_ID; 
    const range = 'Database!A2:BV2'; 
    const valueInputOption = 'USER_ENTERED';

    

    // Transform data into rows
    const rows = [];

    data.forEach(order => {
        for (let i = 1; i <= 6; i++) {
            const fulfilmentNumber = `${order.name}.${i}`;
            const createdAt = moment(order.createdAt);
            const fulfilledAt = i === 1 ? createdAt.format() : createdAt.add(i - 1, 'months').format();

    const row = [
               
    fulfilmentNumber,
      order.name,
      order.email,
      order.displayFinancialStatus,
      order.createdAt,
      '', 
     fulfilledAt,
      order.customer.emailMarketingConsent.marketingState,
      order.currencyCode,
      order.subtotalPrice,
      'is shipping free as well ? ',
      order.totalTax,
      'total what ? if it is free',
      'discount code ?',
      order.totalDiscounts,
      'i guess it will be the same for all orders ?',
      order.createdAt,
      order.lineItems.edges[0] ? order.lineItems.edges[0].node.quantity : '',
      order.lineItems.edges[0] ? order.lineItems.edges[0].node.variant.title : '', // Correctly access the first lineItem's variant title
    order.totalPrice,
    'what is that ?',
    order.lineItems.edges[0] ? order.lineItems.edges[0].node.variant.sku : '',
    'is it always true ?',
    'that is always false, coffe is not taxable right ?',
    '??  ', 
    order.billingAddress ? order.billingAddress.name : '',
    (order.billingAddress?.address1 ?? 'N/A') + '\n' + (order.billingAddress?.address2 ?? 'N/A'),
    order.billingAddress ? order.billingAddress.address1 : '',
    order.billingAddress ? order.billingAddress.address2 : '',
    order.billingAddress ? order.billingAddress.company : '',
    order.billingAddress ? order.billingAddress.city : '',
    order.billingAddress ? order.billingAddress.zip : '',
    order.billingAddress ? order.billingAddress.province : '',
    order.billingAddress ? order.billingAddress.country : '',
    order.billingAddress ? order.billingAddress.phone : '',
    order.shippingAddress ? order.shippingAddress.name : '',
    (order.shippingAddress?.address1 ?? 'N/A') + '\n' + (order.shippingAddress?.address2 ?? 'N/A'),
    order.shippingAddress ? order.shippingAddress.address1 : '',
    order.shippingAddress ? order.shippingAddress.address2 : '',
    order.shippingAddress ? order.shippingAddress.company : '',
    order.shippingAddress ? order.shippingAddress.city : '',
    order.shippingAddress ? order.shippingAddress.zip : '',
    order.shippingAddress ? order.shippingAddress.province : '',
    order.shippingAddress ? order.shippingAddress.country : '',
    order.shippingAddress ? order.shippingAddress.phone : '',
    order.customer ? order.customer.note : '',
    
      // Repeat for other nested objects/fields
    ]
    rows.push(row);
        }
    });

    const resource = {
      values: rows,
    };
  
    try {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption,
        resource,
      });
      console.log(response.data);
    } catch (error) {
      console.error('The API returned an error: ' + error);
    }
}

module.exports = appendDataToSheet;