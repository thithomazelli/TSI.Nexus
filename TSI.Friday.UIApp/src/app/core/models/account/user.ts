export interface User {
  id: number;
  userName: string;
  email: string;
  emailConfirmed: boolean;
  firstName: string;
  lastName: string;
  jwt: string;
  mainPhoto: string;
}
