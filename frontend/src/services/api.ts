import type { Product } from "@/data/mockProducts";

const API_BASE = "http://localhost:8080";

export async function fetchProducts(query?: string): Promise<Product[]> {
  const url = new URL(`${API_BASE}/search`);
  if (query) url.searchParams.set("q", query);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchProductById(id: number): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
  return res.json();
}


