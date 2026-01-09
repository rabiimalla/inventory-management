import { randomId } from "../services/helper.service";

export class UserModel {
  id: string;
  fullname: string;
  username: string;
  email: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, fullname: string, username: string, email:string, roleId: string, createdAt: Date, updatedAt: Date){
    this.id = id || randomId();
    this.fullname = fullname;
    this.username = username;
    this.email = email;
    this.roleId = roleId;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
}