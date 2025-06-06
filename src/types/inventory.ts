
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stockQuantity: number;
  status: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  lastUpdated?: string;
}
