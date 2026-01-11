import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../core/services/auth.service';
import { Permission } from '../../../core/enums/permission.enum';
import { UserParams } from '../../../core/interfaces/user.interface';
import { RoleParams } from '../../../core/interfaces/role.interface';
import { RoleService } from '../../../core/services/role.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-list',
  imports: [],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList implements OnInit {
  private destroyRef = inject(DestroyRef);
  canManageUsers = signal(false);
  users = signal<UserParams[]>([]);
  roles = signal<RoleParams[]>([]);

  /* Modal state */
  showUserModal = signal(false);
  editingUser = signal<RoleParams | null>(null);

  constructor(
    private auth: AuthService,
    private roleService: RoleService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.canManageUsers.set(this.auth.canAccess([Permission['MANAGE_USERS']]));
    this.loadRoles();
    this.loadUsers();
  }

  loadRoles(){
    this.roleService.roles$
    .pipe(
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe((roles) => this.roles.set(roles));
  }

  loadUsers(){
    this.userService.users$
    .pipe(
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe((users) => this.users.set(users));
  }

  openUserModal(user?: UserParams) {

  }

  closeUserModal() {

  }

  saveUser(event: SubmitEvent) {

  }

  deleteUser(userId: string) {

  }
}
