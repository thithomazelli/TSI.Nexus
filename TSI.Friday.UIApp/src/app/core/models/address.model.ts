import { AddressType } from '../enums/address-type.enum';

export class Address {
  id?: string;
  name?: string;
  street?: string;
  number?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  comments?: string;
  type?: AddressType;
  businessPartnerId?: string;
  isDefault?: boolean;

  constructor(init?: Partial<Address>) {
    Object.assign(this, init);
  }

  get address(): string {
    return `${this.street || ''}, ${this.number || ''} - ${this.city || ''}, ${this.state || ''}, ${this.zipCode || ''}, ${this.country || ''}`;
  }
}
