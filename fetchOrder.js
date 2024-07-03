import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
import readline from 'readline';
import fs from 'fs';
import { google } from 'googleapis';
const TOKEN_PATH = './token.json';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const orderController = {
  getOrderById: async (req, res) => {
    const id = req.params.id;
    const response = await fetch(`https://horsham-coffee-roaster.myshopify.com/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
            'X-Shopify-Access-Token': process.env.HCR_AT,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: `
                {
                    order(id: "gid://shopify/Order/${id}") {
                        id
                        name
                        createdAt
                        lineItems(first: 10) {
                            edges {
                                node {
                                    product {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `
        }),
    })

    const data = await response.json();
  
    res.send(200);
},
getFulfillments: async (req, res) => {
    let hasNextPage = true;
    let afterCursor = null;
    let allData = [];
    
    while (hasNextPage) {
        const afterClause = afterCursor ? `, after: "${afterCursor}"` : "";
        const response = await fetch(`https://horsham-coffee-roaster.myshopify.com/admin/api/2024-01/graphql.json`, {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': process.env.HCR_AT,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `
                {
                    fulfillmentOrders(first: 250${afterClause}, query: "status:OPEN") {
                        edges {
                            cursor
                            node {
                                id
                                status
                                createdAt
                                updatedAt
                                order {
                                    id
                                }
                                lineItems(first: 5) {
                                    edges {
                                        node {
                                            id
                                            lineItem {
                                                product {
                                                    id
                                                    title
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        pageInfo {
                            hasNextPage
                        }
                    }
                }
                `
            })
        });

        const data = await response.json();
        
        if (data.data && data.data.fulfillmentOrders) {
            allData = allData.concat(data.data.fulfillmentOrders.edges);
            hasNextPage = data.data.fulfillmentOrders.pageInfo.hasNextPage;
            if (hasNextPage) {
                afterCursor = data.data.fulfillmentOrders.edges[data.data.fulfillmentOrders.edges.length - 1].cursor;
            }
        } else {
            console.error('Error fetching data:', data);
            hasNextPage = false;
        }
   
    }
            
const fourDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
const recentOrders = allData.filter(edge => {
  const createdAt = new Date(edge.node.createdAt);
  const updatedAt = new Date(edge.node.updatedAt);
  const hasSubscription = edge.node.lineItems.edges.some(lineItemEdge => {
    if (lineItemEdge.node.lineItem.product) {
      const title = lineItemEdge.node.lineItem.product.title.toLowerCase();
      return title.includes('EDF Coffee Subscription - 6 Month')
    }
    return false;
  });
  return updatedAt >= fourDaysAgo && hasSubscription;
  // 
});

const orderIds = recentOrders.map(order => order.node.order.id.split('/').pop());
  const orders = [];
  for (const id of orderIds) {
    const order = await fetchAndProcessOrder(id);
    orders.push(order);
    await delay(1000);  // Wait for 1 second
  }

  res.sendStatus(200);
}
}

async function fetchAndProcessOrder(id) {
  const response = await fetch(`https://horsham-coffee-roaster.myshopify.com/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': process.env.HCR_AT,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `
        {
          order(id: "gid://shopify/Order/${id}") {
            fullyPaid
            id
            name
            email
            createdAt
            updatedAt
            currencyCode
            totalTax
            displayFinancialStatus
            subtotalPrice
            totalDiscounts
            totalPrice
            currentCartDiscountAmountSet {
                shopMoney {
                    amount
                    currencyCode
                }
            }
            currentTaxLines {
                priceSet {
                    shopMoney {
                        amount
                        currencyCode
                    }
                
                }
                rate
                title
            }
            taxLines {
                title
                rate
                price
            }
            shippingLine {
                code
                deliveryCategory
                originalPriceSet {
                    shopMoney {
                        amount
                        currencyCode
                    }
                }
                source
            }
            billingAddress{
                address1
                address2
                city
                company
                country
                zip
                name
                phone
            }
            shippingAddress{
                address1
                address2
                city
                company 
                country
                countryCode
                name
                phone
                province
                zip
            }
            currencyCode
            sourceIdentifier
            customer{
                emailMarketingConsent{
                    marketingState
                }
                note
                phone
            }
            fulfillmentOrders(first: 10) {
              edges {
                node {
                  id
                  status
                  createdAt
                  updatedAt
                }
              }
            }
            lineItems(first: 100) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                    title
                    sku
                    price
                  }
                }
              }
            }
            cancelledAt
            paymentTerms {
                id
                paymentTermsName
                translatedName
            }
            refunds {
                totalRefunded {
                    amount
                    currencyCode
                }
            }
            totalOutstandingSet {
                shopMoney {
                    amount
                    currencyCode
                }
            
            }
            tags
            riskLevel
          }
        }
      `
    }),
  })

  const data = await response.json();

  const order = data.data.order;
let totalOrders = 0;
let openOrderNumber = 0;
let openedAt = null;

for (const edge of order.fulfillmentOrders.edges) {
  totalOrders++;
  if (edge.node.status === 'OPEN' && openOrderNumber === 0) {
    openOrderNumber = totalOrders;
    openedAt = edge.node.updatedAt;
  }
}
  let shipping = '';

  if (order.shippingLine.code !== null) {
    shipping = 'TRUE';
  } else {
    shipping = 'FALSE';
  }

  const translatedName = order.paymentTerms?.translatedName || '';
  const paymentTerms = order.paymentTerms?.id || '';
  const discount =  order.currentCartDiscountAmountSet[0]?.shopMoney.amount;
  const tags = order.tags.join(', ');


let fulNumber = `${order.name}.${openOrderNumber}`;
const fulfilmentStatus = `${openOrderNumber}/${totalOrders}`
// Check if openOrderNumber is 1

  // Iterate over line items
  for (const lineItem of order.lineItems.edges) {
      // Copy all the existing data
  const values = [
    '', //fulfilment date
    '', //fulfilled ?
    '', //Name 
    fulNumber, // order number 
    // order.name,
    order.email, //email
    order.displayFinancialStatus, //financial status
    order.createdAt, //paid at 
    fulfilmentStatus, // fulfilment status
    openedAt, //fulfilled at
    order.customer.emailMarketingConsent.marketingState, // accepts marketing
    order.currencyCode, //currency
    order.subtotalPrice, 
    order.shippingLine.originalPriceSet.shopMoney.amount,
    order.totalTax,
    order.totalPrice,
    order.currentCartDiscountAmountSet.shopMoney.amount || '',
    '',
    order.shippingLine.code,
    order.createdAt,
    lineItem.node.quantity,  // Update line item specific fields
    lineItem.node.variant.title,     // Update line item specific fields
    lineItem.node.price,     // Update line item specific fields
    "",
    lineItem.node.variant.sku,       // Update line item specific fields
    shipping,
    'FALSE',
    fulfilmentStatus,
    order.billingAddress.name,
    order.billingAddress.address1 + '\n' + order.billingAddress.address2,
    order.billingAddress.address1,
    order.billingAddress.address2,
    order.billingAddress.company,
    order.billingAddress.city,
    order.billingAddress.zip,
    order.billingAddress.province,
    order.billingAddress.country,
    order.billingAddress.phone,
    order.shippingAddress.name,
    order.shippingAddress.address1 + '\n' + order.shippingAddress.address2,
    order.shippingAddress.address1,
    order.shippingAddress.address2,
    order.shippingAddress.company,
    order.shippingAddress.city,
    order.shippingAddress.zip,
    order.shippingAddress.province,
    order.shippingAddress.country,
    order.shippingAddress.phone,
    order.customer.note,
    '',
    order.cancelledAt || '',
    translatedName,
    paymentTerms,
    order.refunds.totalRefunded?.amount,
    'HCR',
    order.totalOutstandingSet.shopMoney.amount,
    '',
    '',
    '',
    order.sourceIdentifier,
    tags,
    order.riskLevel,
    'web',
    discount,
    'GB VAT 20%',
    order.taxLines[0]?.price || 0,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    order.customer.phone || '',
    order.sourceIdentifier,
    '',
    order.billingAddress.province,
    order.shippingAddress.province, 
    order.paymentTerms?.id || '',
    order.paymentTerms?.translatedName || '',
    '',
    order.sourceIdentifier
 ]


  }
  return order;
}

export default orderController;
