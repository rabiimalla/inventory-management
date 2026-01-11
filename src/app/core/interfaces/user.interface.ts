export interface UserParams {
  id: string;
  fullname: string;
  username: string;
  email: string;
  roleId: string;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
  roleName?: string;
}
