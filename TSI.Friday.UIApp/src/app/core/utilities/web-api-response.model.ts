import { ResponseStatus } from '../enums/response-status.enum';

export interface WebApiResponse<T> {
  data?: T | null;
  message: string;
  status: ResponseStatus;
}
