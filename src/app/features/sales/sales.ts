import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Item } from '../../core/interfaces/item.interface';
import { Sale } from '../../core/interfaces/sale.interface';
import { UserParams } from '../../core/interfaces/user.interface';
import { ItemService } from '../../core/services/item-service';
import { showToast } from '../../core/services/helper.service';
import { SaleService } from '../../core/services/sale.service';
import { AuthService } from '../../core/services/auth.service';
import { Permission } from '../../core/enums/permission.enum';

@Component({
  selector: 'app-sales',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './sales.html',
  styleUrl: './sales.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sales implements OnInit {
  private destroyRef = inject(DestroyRef);
  itemsSignal = signal<Item[]>([]);
  salesSignal = signal<Sale[]>([]);
  searchTerm = signal('');
  currentUser = signal<UserParams | null>(null);
  saleQuantities = signal<Record<string, number>>({});
  canManageItems = signal(false);

  availableItems = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const items = this.itemsSignal();

    return search
      ? items.filter((item) => item.name.toLowerCase().includes(search) && item.stock > 0)
      : items;
  });

  // Restock modal state
  showRestockModal = signal(false);
  itemToRestock = signal<Item | null>(null);
  restockQuantity = signal(10);

  constructor(
    private itemsService: ItemService,
    private saleService: SaleService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();

    this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.currentUser.set(user);
      this.canManageItems.set(this.auth.canAccess([Permission.MANAGE_ITEMS]));
    });
  }

  loadData() {
    this.itemsService.items$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((items) => this.itemsSignal.set(items));

    this.saleService.sales$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((sales) => this.salesSignal.set(sales));
  }

  // Search functionality
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  // Sale functionality
  getSaleQuantity(item: Item): number {
    return this.saleQuantities()[item.id] || 1;
  }

  incrementQuantity(item: Item): void {
    const current = this.getSaleQuantity(item);
    if (current < item.stock) {
      this.saleQuantities.update((quantities) => ({
        ...quantities,
        [item.id]: current + 1,
      }));
    }
  }

  decrementQuantity(item: Item): void {
    const current = this.getSaleQuantity(item);
    if (current > 1) {
      this.saleQuantities.update((quantities) => ({
        ...quantities,
        [item.id]: current - 1,
      }));
    }
  }

  updateQuantity(item: Item, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value);

    if (!isNaN(value) && value >= 1 && value <= item.stock) {
      this.saleQuantities.update((quantities) => ({
        ...quantities,
        [item.id]: value,
      }));
    } else {
      // Reset to valid value
      input.value = this.getSaleQuantity(item).toString();
    }
  }

  sellItem(item: Item): void {
    const quantity = this.getSaleQuantity(item);

    if (quantity > item.stock) {
      showToast(`Cannot sell ${quantity} items. Only ${item.stock} in stock.`, 'danger');
      return;
    }

    const confirmation = confirm(`Sell ${quantity} ${item.name}(s) for ${item.price * quantity}?`);

    if (!confirmation) {
      return;
    }

    this.saleService.sellItem(item.id, quantity, this.currentUser()?.id || 'system').subscribe({
      next: (sale) => {
        this.saleQuantities.update((quantities) => {
          const newQuantities = { ...quantities };
          delete newQuantities[item.id]; // Reset quantity for this item
          return newQuantities;
        });

        showToast(`Sold ${quantity} ${item.name}(s) for ${sale.total}`, 'success');
      },
      error: (error) => showToast(error.message, 'danger'),
    });
  }
  /* ---- Sale logic ---- */

  /* Restock functionality */
  openRestockModal(item: Item) {
    this.itemToRestock.set(item);
    this.showRestockModal.set(true);
  }

  closeRestockModal(): void {
    this.showRestockModal.set(false);
    this.itemToRestock.set(null);
  }

  incrementRestockQuantity(): void {
    this.restockQuantity.update((qty) => qty + 1);
  }

  decrementRestockQuantity(): void {
    this.restockQuantity.update((qty) => qty - 1);
  }

  confirmRestock() {
    const item = this.itemToRestock();
    if (!item) return;

    const updatedItem = {
      ...item,
      stock: item.stock + this.restockQuantity(),
    };

    this.itemsService.updateItem(item.id, updatedItem).subscribe({
      next: () => {
        showToast(`Added ${this.restockQuantity()} units to ${item.name}`, 'success');
        this.closeRestockModal();
      },
      error: (err) => showToast(err.message, 'danger'),
    });
  }

  calculateRestockCost(): number {
    const item = this.itemToRestock();
    return item ? item.cost * this.restockQuantity() : 0;
  }

  /* --- Restock logic --- */

  calculateTotal(item: Item): number {
    return item.price * this.getSaleQuantity(item);
  }

  getMarginPercentage(item: Item): number {
    return Math.round(((item.price - item.cost) / item.price) * 100);
  }
}
