export interface Sale {
  id: string;
  itemId: string;
  quantity: number;
  salePrice: number; // Price at time of sale
  total: number;
  soldBy: string; // User ID
  soldAt: Date;
}