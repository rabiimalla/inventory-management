import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { Item } from '../../core/interfaces/item.interface';
import { Sale } from '../../core/interfaces/sale.interface';
import { UserParams } from '../../core/interfaces/user.interface';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sales',
  imports: [FormsModule],
  templateUrl: './sales.html',
  styleUrl: './sales.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sales {
  itemsSignal = signal<Item[]>([]);
  salesSignal = signal<Sale[]>([]);
  searchTerm = signal('');
  currentUser = signal<UserParams | null>(null);

  availableItems = computed(() => {
    const search = this.searchTerm().toLowerCase();

    return this.itemsSignal().filter(
      (item) => item.name.toLowerCase().includes(search) && item.stock > 0
    );
  });

  constructor() {}

  // Search functionality
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  clearSearch() {
    this.searchTerm.set('');
  }
}
