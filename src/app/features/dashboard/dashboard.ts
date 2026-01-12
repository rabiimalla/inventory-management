import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { switchMap, tap } from 'rxjs';

import { SaleService } from '../../core/services/sale.service';
import { ItemService } from '../../core/services/item-service';
import { Item } from '../../core/interfaces/item.interface';
import { Sale } from '../../core/interfaces/sale.interface';

interface DashboardMetrics {
  totalItemsSold: number;
  itemsSoldToday: number;
  mostPopularItem: string;
  totalRevenue: number;
  revenueToday: number;
  lowStockItems: number;
  outOfStockItems: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, CurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  lastUpdated = signal(new Date());
  yesterdaySales = 0;
  today = new Date();

  sales = signal<Sale[]>([]);
  items = signal<Item[]>([]);

  metrics = signal<DashboardMetrics>({
    totalItemsSold: 0,
    itemsSoldToday: 0,
    mostPopularItem: 'N/A',
    totalRevenue: 0,
    revenueToday: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });

  constructor(
    private saleService: SaleService,
    private itemsService: ItemService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);

    this.saleService.sales$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((sales) => {
          this.sales.set(sales);
          this.calculateYesterdaySales(sales);
        }),
        switchMap(() => this.itemsService.items$.pipe(takeUntilDestroyed(this.destroyRef)))
      )
      .subscribe((items) => {
        this.items.set(items);
        this.calculateMetrics();
        this.loading.set(false);
        this.lastUpdated.set(new Date());
      });
  }

  private calculateMetrics() {
    const sales: Sale[] = this.sales() || [];
    const items: Item[] = this.items() || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Total Items Sold (all time) - SUM of quantities
    const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);

    // 2. Items Sold Today - SUM of quantities for today
    const salesToday = sales.filter((sale) => new Date(sale.soldAt) >= today);
    const itemsSoldToday = salesToday.reduce((sum, sale) => sum + sale.quantity, 0);

    // 3. Most Popular Item - Item with highest total quantity sold
    const itemSalesMap = new Map<string, number>();
    sales.forEach((sale) => {
      const current = itemSalesMap.get(sale.itemId) || 0;
      itemSalesMap.set(sale.itemId, current + sale.quantity);
    });

    let mostPopularItemId = '';
    let maxSales = 0;

    itemSalesMap.forEach((quantity, itemId) => {
      if (quantity > maxSales) {
        maxSales = quantity;
        mostPopularItemId = itemId;
      }
    });

    const mostPopularItem = items.find((item) => item.id === mostPopularItemId)?.name || 'N/A';

    /* Additional metrics */
    // 4. Total Revenue (all time) - SUM of sale totals
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);

    // 5. Today's Revenue - SUM of sale totals for today
    const revenueToday = salesToday.reduce((sum, sale) => sum + sale.total, 0);

    // 6. Low Stock Items - Items at or below min stock level but not zero
    const lowStockItems = items.filter(item => 
      item.stock <= item.minStockLevel && item.stock > 0
    ).length;

    // 7. Out of Stock Items - Items with zero stock
    const outOfStockItems = items.filter(item => item.stock === 0).length;

    this.metrics.set({
      totalItemsSold,
      itemsSoldToday,
      mostPopularItem,
      totalRevenue,
      revenueToday,
      lowStockItems,
      outOfStockItems
    });
  }

  private calculateYesterdaySales(sales: Sale[]): void {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterdaySales = sales.filter((sale) => {
      const saleDate = new Date(sale.soldAt);
      return saleDate >= yesterday && saleDate < today;
    });

    this.yesterdaySales = yesterdaySales.reduce((sum, sale) => sum + sale.quantity, 0);
  }

  getPopularItemSalesCount(): number {
    const sales = this.sales();
    const items = this.items();
    const mostPopularItemName = this.metrics().mostPopularItem;

    if (mostPopularItemName === 'N/A') return 0;

    const item = items.find((i) => i.name === mostPopularItemName);
    if (!item) return 0;

    return sales
      .filter((sale) => sale.itemId === item.id)
      .reduce((sum, sale) => sum + sale.quantity, 0);
  }
}

/* 
// State signals
  loading = signal(true);
  lastUpdated = signal(new Date());
  metrics = signal<DashboardMetrics>({
    totalItemsSold: 0,
    itemsSoldToday: 0,
    mostPopularItem: 'N/A',
    totalRevenue: 0,
    revenueToday: 0,
    averageSaleValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });

  // Helper data
  items = signal<any[]>([]);
  sales = signal<any[]>([]);
  today = new Date();
  yesterdaySales = 0;

  // Computed values for derived metrics
  private allSales = computed(() => this.sales());
  private allItems = computed(() => this.items());

  constructor(
    private storage: StorageService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);
    
    // Load sales data
    this.storage.getSales().subscribe(sales => {
      this.sales.set(sales);
      this.calculateYesterdaySales(sales);
      
      // Load items data
      this.storage.getItems().subscribe(items => {
        this.items.set(items);
        this.calculateMetrics();
        this.loading.set(false);
        this.lastUpdated.set(new Date());
      });
    });
  }

  private calculateMetrics(): void {
    const sales = this.sales();
    const items = this.items();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Total Items Sold (all time) - SUM of quantities
    const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);

    // 2. Items Sold Today - SUM of quantities for today
    const salesToday = sales.filter(sale => 
      new Date(sale.soldAt) >= today
    );
    const itemsSoldToday = salesToday.reduce((sum, sale) => sum + sale.quantity, 0);

    // 3. Most Popular Item - Item with highest total quantity sold
    const itemSalesMap = new Map<string, number>();
    sales.forEach(sale => {
      const current = itemSalesMap.get(sale.itemId) || 0;
      itemSalesMap.set(sale.itemId, current + sale.quantity);
    });

    let mostPopularItemId = '';
    let maxSales = 0;
    
    itemSalesMap.forEach((quantity, itemId) => {
      if (quantity > maxSales) {
        maxSales = quantity;
        mostPopularItemId = itemId;
      }
    });

    const mostPopularItem = items.find(item => item.id === mostPopularItemId)?.name || 'N/A';

    // 4. Total Revenue (all time) - SUM of sale totals
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);

    // 5. Today's Revenue - SUM of sale totals for today
    const revenueToday = salesToday.reduce((sum, sale) => sum + sale.total, 0);

    // 6. Average Sale Value - Average of sale totals
    const averageSaleValue = sales.length > 0 ? totalRevenue / sales.length : 0;

    // 7. Low Stock Items - Items at or below min stock level but not zero
    const lowStockItems = items.filter(item => 
      item.stock <= item.minStockLevel && item.stock > 0
    ).length;

    // 8. Out of Stock Items - Items with zero stock
    const outOfStockItems = items.filter(item => item.stock === 0).length;

    this.metrics.set({
      totalItemsSold,
      itemsSoldToday,
      mostPopularItem,
      totalRevenue,
      revenueToday,
      averageSaleValue: Number(averageSaleValue.toFixed(2)),
      lowStockItems,
      outOfStockItems
    });
  }

  private calculateYesterdaySales(sales: any[]): void {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterdaySales = sales.filter(sale => {
      const saleDate = new Date(sale.soldAt);
      return saleDate >= yesterday && saleDate < today;
    });
    
    this.yesterdaySales = yesterdaySales.reduce((sum, sale) => sum + sale.quantity, 0);
  }

  // Public methods
  refreshData(): void {
    this.loadDashboardData();
  }

  getDailyTrend(): number {
    const todaySales = this.metrics().itemsSoldToday;
    if (this.yesterdaySales === 0) return todaySales > 0 ? 100 : 0;
    
    const trend = ((todaySales - this.yesterdaySales) / this.yesterdaySales) * 100;
    return Math.round(trend);
  }

  getPopularItemSalesCount(): number {
    const sales = this.sales();
    const items = this.items();
    const mostPopularItemName = this.metrics().mostPopularItem;
    
    if (mostPopularItemName === 'N/A') return 0;
    
    const item = items.find(i => i.name === mostPopularItemName);
    if (!item) return 0;
    
    return sales
      .filter(sale => sale.itemId === item.id)
      .reduce((sum, sale) => sum + sale.quantity, 0);
  }

  getTotalItems(): number {
    return this.items().length;
  }

  // Helper method to format currency (if needed)
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

*/
