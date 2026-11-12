export const arcticOfferEnd = Date.parse('2027-01-01T00:00:00+02:00');
export const arcticOfferIds = [
  'acfre00106a', 'acfan00258a', 'acfan00254a', 'acfan00170a',
  'actpd00052a', 'actpd00053a', 'actpd00054a', 'actpd00058a', 'actpd00059a'
].map(sku => 'lunatech-' + sku);

export function isArcticOffer(product) {
  return arcticOfferIds.includes(product.id) && product.compare_at_verified === true &&
    Date.parse(product.deal_ends_at) === arcticOfferEnd && Number(product.compare_at_price) > Number(product.retail_price);
}
