import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { form, minLength, required, Field } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../core/services/auth.service';
import { Permission } from '../../../core/enums/permission.enum';
import { RoleParams } from '../../../core/interfaces/role.interface';
import { RoleService } from '../../../core/services/role.service';

@Component({
  selector: 'app-role-list',
  imports: [Field],
  templateUrl: './role-list.html',
  styleUrl: './role-list.scss',
})
export class RoleList implements OnInit {
  private destroyRef = inject(DestroyRef);
  canManageRoles = signal(false);
  roles = signal<RoleParams[]>([]);

  /* Modal state */
  showRoleModal = signal(false);
  showDeleteModal = signal(false);
  editingRole = signal<RoleParams | null>(null);

  roleSelectTouched = signal(false);
  selectedPermissions = signal<Permission[]>([]);
  allPermissionOptions = Object.values(Permission);

  isRoleFormValid = computed(() => this.roleForm().valid() && this.selectedPermissions().length);

  emptyRole = {
    id: undefined,
    name: '',
    createdAt: undefined,
    permissions: [] as Permission[],
  };

  /* Had to handle multiple permissions selection separately because signal form don't 
  work with multiple select element yet */
  roleModel = signal<RoleParams>(this.emptyRole);
  roleForm = form(this.roleModel, (roleScheme) => {
    required(roleScheme.name, { message: 'Role name is required' });
    minLength(roleScheme.name, 6, { message: 'Role name must be at least 6 characters' });
  });

  roleNameError = computed(() => {
    const field = this.roleForm.name();
    if (field.invalid() && field.touched()) {
      return field.errors()[0]?.message;
    }

    return null;
  });

  permissionsError = computed(() =>
    this.roleSelectTouched() && !this.selectedPermissions().length
      ? 'At least one permission must be selected'
      : ''
  );

  constructor(private auth: AuthService, private roleService: RoleService) {}

  ngOnInit(): void {
    this.canManageRoles.set(this.auth.canAccess([Permission['MANAGE_ROLES']]));
    this.loadRoles();
  }

  loadRoles() {
    this.roleService.roles$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((roles) => this.roles.set(roles));
  }

  openRoleModal(role?: RoleParams) {
    this.editingRole.set(role ? role : null);
    this.selectedPermissions.set(role ? [...role.permissions] : []);
    role ? 
      this.roleModel.update((current) => ({ ...current, name: role.name })) : 
      this.roleForm().reset(this.emptyRole);

    this.showRoleModal.set(true);
  }

  closeRoleModal() {
    this.showRoleModal.set(false);
    this.editingRole.set(null);
    this.roleForm().reset(this.emptyRole);
  }

  // Permission handling
  togglePermission(permission: Permission, event: Event): void {
    /* mark role select options as touched */
    if (!this.roleSelectTouched()) {
      this.roleSelectTouched.set(true);
    }

    const checked = (event.target as HTMLInputElement).checked;
    const current = this.selectedPermissions();

    if (checked && !current.includes(permission)) {
      this.selectedPermissions.set([...current, permission]);
    } else if (!checked && current.includes(permission)) {
      this.selectedPermissions.set(current.filter((p) => p !== permission));
    }
  }

  saveRole(event: SubmitEvent) {
    event.preventDefault();

    const roleData: Omit<RoleParams, 'id' | 'createdAt'> = {
      name: this.roleForm.name().value(),
      permissions: this.selectedPermissions(),
    };

    if (this.editingRole()) {
      this.roleService
        .updateRole(this.editingRole()?.id!, roleData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.showToast('Role updated successfully', 'success');
            this.closeRoleModal();
          },
          error: (error) => this.showToast(error.message || 'Failed to update role', 'danger'),
        });
    } else {
      this.roleService
        .createRole(roleData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.showToast('Role created successfully', 'success');
            this.closeRoleModal();
          },
          error: (error) => {
            this.showToast(error.message || 'Failed to create role', 'danger');
          },
        });
    }
  }

  private showToast(message: string, type: 'success' | 'danger' | 'warning') {
    // Simply show an alert for demo. In real project, a toast service should be used instead
    alert(`${type.toUpperCase()}: ${message}`);
  }
}
