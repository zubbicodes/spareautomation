export const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment ProductCardFields on Product {
    id
    handle
    title
    vendor
    description
    availableForSale
    productType
    tags
    featuredImage {
      url
      altText
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 10) {
      nodes {
        id
        title
        sku
        availableForSale
        quantityAvailable
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

export const PRODUCT_DETAIL_FRAGMENT = `#graphql
  ${PRODUCT_CARD_FRAGMENT}
  fragment ProductDetailFields on Product {
    ...ProductCardFields
    descriptionHtml
    images(first: 8) {
      nodes {
        url
        altText
        width
        height
      }
    }
    metafields(identifiers: [
      { namespace: "custom", key: "brand" }
      { namespace: "custom", key: "mpn_range" }
      { namespace: "custom", key: "setup_video_url" }
      { namespace: "custom", key: "datasheets" }
      { namespace: "custom", key: "manuals" }
      { namespace: "custom", key: "video_guide" }
      { namespace: "custom", key: "pdf_guide" }
    ]) {
      namespace
      key
      value
      type
    }
  }
`;

export const CART_FRAGMENT = `#graphql
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 50) {
      nodes {
        id
        quantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            sku
            availableForSale
            quantityAvailable
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
            product {
              id
              handle
              title
              featuredImage {
                url
                altText
                width
                height
              }
            }
          }
        }
      }
    }
  }
`;
