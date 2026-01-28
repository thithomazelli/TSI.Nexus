export interface User {
  id: string;
  userName: string;
  email: string;
  emailConfirmed: boolean;
  firstName: string;
  lastName: string;
  jwt: string;
  photo: string;
  // singular role used when creating/updating via forms
  role?: string;
  // roles array from token
  roles?: string[];
}
