import { ResponseStatus } from '../enums/response-status.enum';

export interface WebApiResponse<T> {
  data: T;
  message: string;
  status: ResponseStatus;
}
