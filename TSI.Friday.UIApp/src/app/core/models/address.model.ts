import { AddressType } from '../enums/address-type.enum';

export class Address {
  id?: number | null;
  name?: string | null;
  street?: string | null;
  number?: number | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  comments?: string | null;
  type?: AddressType | null;
  businessPartnerId?: number | null;
  isDefault?: boolean | null;

  constructor(init?: Partial<Address>) {
    Object.assign(this, init);
  }

  get address(): string {
    return `${this.street || ''}, ${this.number || ''} - ${this.city || ''}, ${this.state || ''}, ${this.zipCode || ''}, ${this.country || ''}`;
  }
}
