import { CommissionStatus } from '../enums/commission-status.enum';
import { ServiceOrderStatus } from '../enums/service-order-status.enum';
import { BaseModel } from './base.model';

export interface Commission extends BaseModel {
  id: string;
  percentage: number;
  baseAmount: number;
  amount: number;
  status: CommissionStatus;
  paidDate?: Date | null;
  serviceOrderId: string;
  driverId: string;
}

export interface ServiceOrder extends BaseModel {
  id: string;
  number: string;
  issueDate: Date;
  completionDate?: Date | null;
  description: string;
  status: ServiceOrderStatus;
  orderId: string;
  driverId: string;
  vehicleId?: string | null;
  commission?: Commission | null;
}
