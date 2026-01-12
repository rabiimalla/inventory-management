import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Field, form, required } from '@angular/forms/signals';

import { AuthService } from '../../../core/services/auth.service';
import { Permission } from '../../../core/enums/permission.enum';
import { Item } from '../../../core/interfaces/item.interface';
import { formFieldError, showToast } from '../../../core/services/helper.service';
import { ItemService } from '../../../core/services/item-service';

@Component({
  selector: 'app-item-list',
  imports: [Field],
  templateUrl: './item-list.html',
  styleUrl: './item-list.scss',
})
export class ItemList implements OnInit {
  private destroyRef = inject(DestroyRef);
  canManageItems = signal(false);
  items = signal<Item[]>([]);
  
  /* Modal state */
  showItemModal = signal(false);
  editingItem = signal<Item | null>(null);

  private emptyItem: Item = {
    id: '',
    name: '',
    description: '',
    stock: 0,
    price: 0,
    cost: 0,
    minStockLevel: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  /* Create signal form to with basic validations */
  itemFormModel = signal<Item>(this.emptyItem);
  itemForm = form(this.itemFormModel, (itemFormSchema) => {
    required(itemFormSchema.name, {message: 'Name is required'});
    required(itemFormSchema.stock, {message: 'Stock is required'});
    required(itemFormSchema.price, {message: 'Price is required'});
    required(itemFormSchema.cost, {message: 'Cost is required'});
    required(itemFormSchema.minStockLevel, {message: 'Min stock level is required'});
  });

  nameError = formFieldError(this.itemForm.name());
  stockError = formFieldError(this.itemForm.stock());
  costError = formFieldError(this.itemForm.cost());
  priceError = formFieldError(this.itemForm.price());
  minStockLevelError = formFieldError(this.itemForm.minStockLevel());
  
  constructor(
    private auth: AuthService,
    private itemService: ItemService
  ) {}

  ngOnInit(): void {
    this.canManageItems.set(this.auth.canAccess([Permission['MANAGE_ITEMS']]));
    this.loadItems()
  }

  loadItems() {
    this.itemService.items$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(items => this.items.set(items));
  }

  
  openItemModal(item?: Item) {
    this.editingItem.set(item || null);
    item
      ? this.itemFormModel.set(item)
      : this.itemForm().reset(this.emptyItem);

    this.showItemModal.set(true);
  }

  closeItemModal() {
    this.showItemModal.set(false);
    this.editingItem.set(null);
    this.itemForm().reset(this.emptyItem);
  }

  saveItem(event: SubmitEvent) {
    event.preventDefault();

    const itemData = this.itemForm().value();

    if (this.editingItem()) {
      this.itemService
        .updateItem(this.editingItem()!.id!, itemData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            showToast('Item updated successfully', 'success');
            this.closeItemModal();
          },
          error: (error) => showToast(error.message || 'Failed to update item', 'danger'),
        });
    } else {
      this.itemService
        .addItem(itemData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            showToast('Item added successfully', 'success');
            this.closeItemModal();
          },
          error: (error) => {
            showToast(error.message || 'Failed to add new item', 'danger');
          },
        });
    }
  }

  deleteItem(itemId: string) {
    /* Just show normal js confirm for simplicity sake. */
    const confirmDelete = confirm('DANGER: Are you sure, you want to delete this item?');
    
    if(confirmDelete){
      this.itemService.deleteItem(itemId)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => showToast('Item deleted successfully', 'success'),
        error: (error) => showToast(error.message || 'Failed to delete item', 'danger')
      })
    }
  }
}
