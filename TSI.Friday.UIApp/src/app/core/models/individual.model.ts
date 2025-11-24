import { PersonType } from '../enums/person-type.enum';
import { Address } from './address.model';
import { Person } from './person.model';

export interface Individual extends Person {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  addresses?: Address[] | null;
  type: PersonType;
  socialSecurityCard?: string | null;
  nationalIdCard?: string | null;
  birthday: Date;
}
