import { DriverStatus } from '../enums/driver-status.enum';
import { EmploymentType } from '../enums/employment-type.enum';
import { BaseModel } from './base.model';

export interface Driver extends BaseModel {
  id: string;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  photo?: string;
  socialSecurityCard: string;
  nationalIdCard: string;
  birthday: Date;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: Date;
  employmentType: EmploymentType;
  admissionDate?: Date | null;
  status: DriverStatus;
  commissionPercentage: number;
}
