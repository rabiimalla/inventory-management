import { FieldState } from '@angular/forms/signals';
import { computed, Signal } from '@angular/core';

import { Item } from '../interfaces/item.interface';
import { RoleParams } from '../interfaces/role.interface';
import { UserParams } from '../interfaces/user.interface';
import { Sale } from '../interfaces/sale.interface';

export const STORAGE_PREFIX = 'inventory_system_';

export const randomId = () => Date.now().toString(36) + Math.random().toString(16).substring(2);

export const getFromStorage = <T>(key: string): T | null => {
  const data = localStorage.getItem(STORAGE_PREFIX + key);
  return data ? JSON.parse(data) : null;
};

export const saveToStorage = (key: string, data: RoleParams[] | UserParams[] | Item[] | Sale[]) =>
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));

export const formFieldError = (
  field: FieldState<string | number, string>
): Signal<string | undefined> => {
  return computed(() => {
    if (field.touched() && field.dirty() && field.errors()) {
      return field.errors()[0]?.message;
    }
    return '';
  });
};

export const showToast = (message: string, type: 'success' | 'danger' | 'warning') => {
  // Simply show an alert for demo. In real project, a toast service should be used instead
  alert(`${type.toUpperCase()}: ${message}`);
};
