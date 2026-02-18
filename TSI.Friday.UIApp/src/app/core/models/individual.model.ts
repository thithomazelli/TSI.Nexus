import { Client } from './client.model';

export interface Individual extends Client {
  nationalIdCard?: string | null;
  birthday: Date;
}
