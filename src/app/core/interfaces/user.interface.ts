export interface UserParams {
  id: string;
  fullname: string;
  username: string;
  email: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
  roleName?: string 
}