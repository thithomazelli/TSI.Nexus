import { ProductUnit } from '../enums';
import { ProductType } from '../enums/product-type.enum';
import { BaseModel } from './base.model';

export interface Product extends BaseModel {
  id: string;
  sku: string;
  name: string;
  description: string;
  photo: string;
  price: number;
  unit: ProductUnit;
  type: ProductType;
  quantityInStock: number;
  disabled?: boolean;
  alreadyUsed?: boolean;
}
