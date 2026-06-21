"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product, categoryGroups } from "@/data/mockProducts";
import { fetchProducts } from "@/services/api";

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md flex flex-col overflow-hidden">
      <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2" />
        ) : (
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="block mt-2 text-xs text-gray-400 font-medium">Image</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        {product.subcategory && (
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">{product.subcategory}</span>
        )}
        <h3 className="mt-1 text-sm font-semibold text-gray-900 leading-snug">{product.name}</h3>
        {product.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2 flex-1">{product.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">{product.price.toLocaleString()} TND</span>
          <Link
            href={`/product/${product.id}`}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 cursor-pointer inline-block text-center"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categoryGroups.map((g) => g.name))
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<"default" | "price-asc" | "price-desc">("default");

  useEffect(() => {
    let cancelled = false;
    fetchProducts().then((data) => {
      if (!cancelled) {
        setProducts(data);
        setLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Failed to load products");
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleCategoryClick = (name: string) => {
    toggleCategory(name);
    setSelectedCategory((prev) => (prev === name ? null : name));
    setSelectedSubcategory(null);
  };

  const handleSubcategoryClick = (categoryName: string, subName: string) => {
    if (selectedCategory === categoryName && selectedSubcategory === subName) {
      setSelectedSubcategory(null);
    } else {
      setSelectedCategory(categoryName);
      setSelectedSubcategory(subName);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      p.name.toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q) ||
      (p.subcategory ?? "").toLowerCase().includes(q)
    );
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || p.subcategory === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === "price-asc") return a.price - b.price;
    if (sortOption === "price-desc") return b.price - a.price;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Tunisianet Product Explorer
            </h1>
            <div className="relative flex-1 max-w-md">
              <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-700 transition-colors lg:hidden cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Categories
        </button>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-64 -translate-x-full transform bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-200 ease-in-out
            lg:static lg:z-auto lg:w-56 lg:translate-x-0 lg:border-r-0 lg:bg-transparent lg:shrink-0
            ${sidebarOpen ? "translate-x-0" : ""}
          `}
        >
          <div className="p-4 lg:px-0">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Categories
            </h2>
            <nav className="space-y-1">
              <button
                onClick={handleClearFilters}
                className={`w-full rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors cursor-pointer ${
                  !selectedCategory && !selectedSubcategory
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                All Products
              </button>
              {categoryGroups.map((group) => {
                const isOpen = expandedCategories.has(group.name);
                const isCategorySelected = selectedCategory === group.name;
                return (
                  <div key={group.name}>
                    <button
                      onClick={() => handleCategoryClick(group.name)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                        isCategorySelected
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {group.name}
                      <svg
                        className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="ml-2 mt-1 space-y-0.5">
                        {group.subcategories.map((sub) => {
                          const isSubSelected = selectedCategory === group.name && selectedSubcategory === sub;
                          return (
                            <button
                              key={sub}
                              onClick={() => handleSubcategoryClick(group.name, sub)}
                              className={`block w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                                isSubSelected
                                  ? "bg-blue-50 text-blue-700 font-semibold"
                                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                              }`}
                            >
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <p className="mt-4 text-sm text-gray-500">Loading products...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
              <p className="mt-1 text-xs text-gray-500">Make sure the backend is running on port 8080</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  fetchProducts().then((data) => setProducts(data)).catch((err) => setError(err.message)).finally(() => setLoading(false));
                }}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
                </p>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as "default" | "price-asc" | "price-desc")}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                >
                  <option value="default">Default</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                </select>
              </div>
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="mt-4 text-sm text-gray-500">No products match your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
