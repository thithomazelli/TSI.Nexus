export interface QuoteProduct {
  id: string;
  quantity: number;
  previousQuantity: number;
  discount: number;
  price: number;
  totalPrice: number;
  status: number;
  orderId: string;
  orderNumber: string;
  businessPartnerId: string;
  businessPartnerName: string;
  productId: string;
  productName: string;
  productSku: string;
  productType: number;
}
