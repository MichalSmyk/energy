const fetch = require('node-fetch');
const  dotenv = require('dotenv');
const { response } = require('express');
const appendDataToSheet = require('./addToGoogle.js');
const fetchAndProcessOrder = require('./procesOrder.js');
dotenv.config();


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
          
  const fourDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const recentOrders = allData.filter(edge => {
    const createdAt = new Date(edge.node.createdAt);
    const updatedAt = new Date(edge.node.updatedAt);
    const hasSubscription = edge.node.lineItems.edges.some(lineItemEdge => {
      if (lineItemEdge.node.lineItem.product) {
        const title = lineItemEdge.node.lineItem.product.title;
        return title.includes('EDF Coffee Subscription - 6 Month')
      }
      return false;
    });
    return updatedAt >= fourDaysAgo && hasSubscription;
  });

  const orderIds = recentOrders.map(order => order.node.order.id.split('/').pop());
  // console.log("orders id " , orderIds);
  const orders = [];
  for (const id of orderIds) {
    const order = await fetchAndProcessOrder(id);
    orders.push(order);
    await delay(1000);  // Wait for 1 second
  }

  res.sendStatus(200);
  await appendDataToSheet(orders);
}

}



 



module.exports = orderController;