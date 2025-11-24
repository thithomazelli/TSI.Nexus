import { PersonType } from '../enums/person-type.enum';
import { Person } from './person.model';

export interface Company extends Person {
  type: PersonType;
  nationalRegistry: string;
  stateRegistration: string;
  businessName: string;
}
