import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import { delay, Observable, of, throwError } from 'rxjs';

import { randomId } from './helper.service';
import { Item } from '../interfaces/item.interface';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ItemService {
  itemsSignal = signal<Item[]>(StorageService.getFromStorage<Item[]>('items') || []);
  items$ = toObservable(this.itemsSignal);

  addItem(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Observable<Item> {
    const duplicateError = this.checkDuplicateItem(itemData);

    if (duplicateError) {
      return duplicateError;
    }

    const newItem: Item = {
      ...itemData,
      id: randomId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedItems = [...this.itemsSignal(), newItem];
    this.itemsSignal.set(updatedItems);
    StorageService.saveToStorage('items', updatedItems);

    return of(newItem).pipe(delay(300));
  }

  updateItem(id: string, updates: Partial<Item>): Observable<Item> {
    const items = this.itemsSignal();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return throwError(() => new Error(`Item ${id} not found`));
    }

    /* Check if item with same name exists */
    if (updates.name) {
      const duplicateError = this.checkDuplicateItem(updates, index);

      if (duplicateError) {
        return duplicateError;
      }
    }

    updates.updatedAt = new Date();
    const updateItem = { ...items[index], ...updates };
    const updateItems = [...items];
    updateItems[index] = updateItem;

    this.itemsSignal.set(updateItems);
    StorageService.saveToStorage('items', updateItems);

    return of(updateItem).pipe(delay(500));
  }

  deleteItem(id: string): Observable<boolean> {
    const item = this.itemsSignal().find((item) => item.id === id);
    if (!item) {
      return throwError(() => new Error('Item not found'));
    }

    /* Required logic to prevent deleting items is implemented here 
    such as prevent deleting an item with sells data */

    const updatedItems = this.itemsSignal().filter((item) => item.id !== id);
    this.itemsSignal.set(updatedItems);
    StorageService.saveToStorage('items', updatedItems);

    return of(true).pipe(delay(500));
  }

  /* This is called from sales service. When item is sold or restocked, its(item's) changes are reflected in the sales page*/
  updateItems(items: Item[]) {
    this.itemsSignal.set(items);
    StorageService.saveToStorage('items', items);
  }

  private checkDuplicateItem(
    itemData: Partial<Item>,
    itemIndex?: number
  ): Observable<never> | null {
    const items = this.itemsSignal();

    const duplicateItem =
      itemIndex !== undefined && itemIndex > -1
        ? items.find(
            (item, i) => i !== itemIndex && item.name.toLowerCase() === itemData.name?.toLowerCase()
          )
        : items.find((item) => item.name.toLowerCase() === itemData.name!.toLowerCase());

    if (duplicateItem) {
      return throwError(() => new Error('Item with the same name already exists'));
    }

    return null;
  }
}
