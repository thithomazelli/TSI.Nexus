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
  // Free-text value matching one of the admin-managed SelectableOption rows for the
  // AddressType group (was a fixed AddressType enum).
  type?: string;
  businessPartnerId?: string;
  isDefault?: boolean;

  constructor(init?: Partial<Address>) {
    Object.assign(this, init);
  }

  get address(): string {
    return `${this.street || ''}, ${this.number || ''} - ${this.city || ''}, ${this.state || ''}, ${this.zipCode || ''}, ${this.country || ''}`;
  }
}
