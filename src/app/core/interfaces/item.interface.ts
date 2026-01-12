export interface Item {
  id: string;
  name: string;
  description: string;
  price: number; // selling price
  cost: number; // purchase cost
  stock: number;
  minStockLevel: number;
  createdAt: Date;
  updatedAt: Date;
}
