import { ProductUnit } from '../enums';
import { BaseModel } from './base.model';

export interface Product extends BaseModel {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  unit: ProductUnit;
  quantityInStock: number;
  imageUrl: string | null;
  mainPhoto: string;
}
