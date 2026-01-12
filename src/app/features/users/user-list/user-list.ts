import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { email, Field, form, minLength, required } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../core/services/auth.service';
import { Permission } from '../../../core/enums/permission.enum';
import { UserParams } from '../../../core/interfaces/user.interface';
import { RoleParams } from '../../../core/interfaces/role.interface';
import { RoleService } from '../../../core/services/role.service';
import { UserService } from '../../../core/services/user.service';
import { formFieldError, showToast } from '../../../core/services/helper.service';

@Component({
  selector: 'app-user-list',
  imports: [Field],
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
  editingUser = signal<UserParams | null>(null);

  private emptyUser: UserParams = {
    id: '',
    fullname: '',
    email: '',
    username: '',
    roleId: '',
    createdAt: undefined,
    updatedAt: undefined,
  };

  /* create signal form with basic validation */
  userFormModel = signal<UserParams>(this.emptyUser);
  userForm = form(this.userFormModel, (userFormSchema) => {
    required(userFormSchema.fullname, { message: 'Name is required.' });
    minLength(userFormSchema.fullname, 4, { message: 'Name must have at least 4 characters' });
    email(userFormSchema.email, { message: 'Provide a valid email address.' });
    required(userFormSchema.username, { message: 'Username is required' });
    minLength(userFormSchema.username, 6, { message: 'Username must have at least 6 characters' });
    required(userFormSchema.roleId, { message: 'Must select one role.' });
  });

  fullnameError = formFieldError(this.userForm.fullname());
  emailError = formFieldError(this.userForm.email());
  usernameError = formFieldError(this.userForm.username());
  roleIdError = formFieldError(this.userForm.roleId());

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

  loadRoles() {
    this.roleService.roles$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((roles) => this.roles.set(roles));
  }

  loadUsers() {
    this.userService.users$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((users) => this.users.set(users));
  }

  openUserModal(user?: UserParams) {
    this.editingUser.set(user ? user : null);
    user
      ? this.userFormModel.set(user)
      : this.userForm().reset(this.emptyUser);

    this.showUserModal.set(true);
  }

  closeUserModal() {
    this.showUserModal.set(false);
    this.editingUser.set(null);
    this.userForm().reset(this.emptyUser);
  }

  saveUser(event: SubmitEvent) {
    event.preventDefault();

    const userData = this.userForm().value();

    if (this.editingUser()) {
      this.userService
        .updateUser(this.editingUser()!.id!, userData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            showToast('User updated successfully', 'success');
            this.closeUserModal();
          },
          error: (error) => showToast(error.message || 'Failed to update user', 'danger'),
        });
    } else {
      this.userService
        .createUser(userData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            showToast('User created successfully', 'success');
            this.closeUserModal();
          },
          error: (error) => {
            showToast(error.message || 'Failed to create user', 'danger');
          },
        });
    }
  }

  getRoleName(roleId: string): string{
    return this.roles().find(r => r.id === roleId)?.name || '';
  }

  deleteUser(userId: string) {
    /* Just show normal js confirm for simplicity sake. */
    const confirmDelete = confirm('DANGER: Are you sure, you want to delete this user?');
    
    if(confirmDelete){
      this.userService.deleteUser(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => showToast('User deleted successfully', 'success'),
        error: (error) => showToast(error.message || 'Failed to delete user', 'danger')
      })
    }
  }
}
