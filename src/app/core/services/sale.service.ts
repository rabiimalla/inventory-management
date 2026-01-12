import { Injectable, signal } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { delay, Observable, of } from "rxjs";

import { Sale } from "../interfaces/sale.interface";
import { randomId } from "./helper.service";
import { ItemService } from "./item-service";
import { StorageService } from "./storage.service";

@Injectable({providedIn: 'root'})
export class SaleService {
  salesSignal = signal<Sale[]>(StorageService.getFromStorage<Sale[]>('sales') || []);
  sales$ = toObservable(this.salesSignal)

  constructor(
    private itemsService: ItemService
  ){}

  sellItem(itemId: string, quantity: number, soldBy: string): Observable<Sale> {
    const items = this.itemsService.itemsSignal();
    const itemIndex = items.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }
    
    const item = items[itemIndex];
    
    // Business rule validation
    if (item.stock < quantity) {
      throw new Error('Insufficient stock');
    }
    
    // Update item stock
    const updatedItem = {
      ...item,
      stock: item.stock - quantity,
      updatedAt: new Date()
    };
    
    // Create sale record
    const sale: Sale = {
      id: randomId(),
      itemId,
      quantity,
      salePrice: item.price,
      total: item.price * quantity,
      soldBy,
      soldAt: new Date()
    };
    
    // Update both signals atomically
    const updatedItems = [...items];
    updatedItems[itemIndex] = updatedItem;
    
    const updatedSales = [...this.salesSignal(), sale];
    
    this.itemsService.updateItems(updatedItems);
    
    this.salesSignal.set(updatedSales);
    StorageService.saveToStorage('sales', updatedSales);
    
    return of(sale).pipe(delay(600));
  }
}