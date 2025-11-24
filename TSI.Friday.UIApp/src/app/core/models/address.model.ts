import { AddressType } from '../enums/address-type.enum';

export interface Address {
  id: number;
  street?: string | null;
  number?: number | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  comments?: string | null;
  addressType?: AddressType;
  personId?: number | null;
}
