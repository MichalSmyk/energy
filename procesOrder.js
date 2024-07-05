require('dotenv').config();

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
              discountCode
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
  
  // console.log("orders: ", data)
    const order = data.data.order;
    let totalOrders = 0;
    let openOrderNumber = 0;
  
  
  for (const edge of order.fulfillmentOrders.edges) {
    totalOrders++;
    if (edge.node.status === 'OPEN' && openOrderNumber === 0) {
      openOrderNumber = totalOrders;
      openedAt = edge.node.updatedAt;
    }
  }
    let shipping = '';
  
    // if (order.shippingLine.code !== null) {
    //   shipping = 'TRUE';
    // } else {
    //   shipping = 'FALSE';
    // }
  
    const translatedName = order.paymentTerms?.translatedName || '';
    const paymentTerms = order.paymentTerms?.id || '';
    const discount =  order.currentCartDiscountAmountSet[0]?.shopMoney.amount;
    const tags = order.tags.join(', ');
  
  
  // Check if openOrderNumber is 1
  
    // Iterate over line items
    for (const lineItem of order.lineItems.edges) {
        // Copy all the existing data
const values = [
  order.name ?? 'N/A', // order number + fulfilments after dot
  order.name ?? 'N/A', // order number
  order.email ?? 'N/A', //email
  order.displayFinancialStatus ?? 'N/A', //financial status
  order.createdAt ?? 'N/A', //paid at 
  // fulfilment status TODO
  order.createdAt ?? 'N/A', //fulfilled at
  order.customer?.emailMarketingConsent?.marketingState ?? 'N/A', // accepts marketing
  order.currencyCode ?? 'N/A', //currency
  order.subtotalPrice ?? 'N/A', //subtotal
  '', //shipping order.shippingLine?.originalPriceSet?.shopMoney?.amount ?? 'N/A', 
  order.totalTax ?? 'N/A', //taxes
  order.totalPrice ?? 'N/A', //total
  '', // order.currentCartDiscountAmountSet?.shopMoney?.amount ?? 'N/A',//TODO discount 
  order.totalDiscounts ?? 'N/A', //discount amount
  '', // TODO shipping Method
  '', // TODO created at 
  '', // TODO line quantity 6 ?
  lineItem.node.variant.title ?? 'N/A', // lineitem name
  lineItem.node.price ?? 'N/A', // lineitem price
  "", //lineitem compare at price TODO
  lineItem.node.variant.sku ?? 'N/A', // lineitem sku
  shipping ?? 'N/A',
  'FALSE',
  '', // TODO fulfilmentStatus, 
  order.billingAddress?.name ?? 'N/A',
  (order.billingAddress?.address1 ?? 'N/A') + '\n' + (order.billingAddress?.address2 ?? 'N/A'),
  order.billingAddress?.address1 ?? 'N/A',
  order.billingAddress?.address2 ?? 'N/A',
  order.billingAddress?.company ?? 'N/A',
  order.billingAddress?.city ?? 'N/A',
  order.billingAddress?.zip ?? 'N/A',
  order.billingAddress?.province ?? 'N/A',
  order.billingAddress?.country ?? 'N/A',
  order.billingAddress?.phone ?? 'N/A',
  order.shippingAddress?.name ?? 'N/A',
  (order.shippingAddress?.address1 ?? 'N/A') + '\n' + (order.shippingAddress?.address2 ?? 'N/A'),
  order.shippingAddress?.address1 ?? 'N/A',
  order.shippingAddress?.address2 ?? 'N/A',
  order.shippingAddress?.company ?? 'N/A',
  order.shippingAddress?.city ?? 'N/A',
  order.shippingAddress?.zip ?? 'N/A',
  order.shippingAddress?.province ?? 'N/A',
  order.shippingAddress?.country ?? 'N/A',
  order.shippingAddress?.phone ?? 'N/A',
  order.customer?.note ?? 'N/A',
  '',
  order.cancelledAt ?? 'N/A',
  translatedName ?? 'N/A',
  paymentTerms ?? 'N/A',
  order.refunds?.totalRefunded?.amount ?? 'N/A',
  'HCR',
  order.totalOutstandingSet?.shopMoney?.amount ?? 'N/A',
  '',
  '',
  '',
  order.sourceIdentifier ?? 'N/A',
  tags ?? 'N/A',
  order.riskLevel ?? 'N/A',
  'web',
  discount ?? 'N/A',
  'GB VAT 20%',
  order.taxLines[0]?.price ?? 'N/A',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  order.customer?.phone ?? 'N/A',
  order.sourceIdentifier ?? 'N/A',
  '',
  order.billingAddress?.province ?? 'N/A',
  order.shippingAddress?.province ?? 'N/A',
  order.paymentTerms?.id ?? 'N/A',
  order.paymentTerms?.translatedName ?? 'N/A',
  '',
  order.sourceIdentifier ?? 'N/A',
  order.doscountCode ?? 'N/A'
];
  
    }
    return order
    }

    module.exports = fetchAndProcessOrder;