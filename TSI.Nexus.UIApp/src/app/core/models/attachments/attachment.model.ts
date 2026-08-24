export interface Attachment {
  id: string;
  fileName: string;
  path: string;
  downloadUrl: string;
  businessPartnerId?: string | null;
  businessPartnerName: string;
  orderId?: string | null;
  orderNumber: string;
  purchaseOrderId?: string | null;
  purchaseOrderNumber?: string;
  tripId?: string | null;
  tripNumber?: string;
  transactionId?: string | null;
  paymentId?: string | null;
  productId?: string | null;
  vehicleId?: string | null;
  driverId?: string | null;
  vehicleMaintenanceId?: string | null;
  userId?: string | null;
  createDate?: Date;
  modifyDate?: Date;
  file?: File;
}
