import { FieldState } from '@angular/forms/signals';
import { computed, Signal } from '@angular/core';

export const STORAGE_PREFIX = 'inventory_system_';

export const randomId = () => Date.now().toString(36) + Math.random().toString(16).substring(2);

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
