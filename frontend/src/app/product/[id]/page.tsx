"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Product } from "@/data/mockProducts";
import { fetchProductById } from "@/services/api";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchProductById(Number(id))
      .then((data) => {
        if (!cancelled) {
          setProduct(data ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProduct(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900">Product Not Found</h2>
        <p className="text-sm text-gray-500">The product you are looking for does not exist.</p>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </Link>

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className={`aspect-[16/9] flex items-center justify-center ${product.image ? "bg-gray-100" : "bg-gradient-to-br from-gray-50 to-gray-100"}`}>
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="text-center">
                <svg className="w-20 h-20 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="block mt-3 text-sm font-medium text-gray-400">Product Image</span>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div>
              {product.subcategory && (
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                  {product.subcategory}
                </span>
              )}
              <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {product.price.toLocaleString()} TND
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-gray-100 pt-5">
              {product.category && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{product.category}</dd>
                </div>
              )}
              {product.subcategory && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{product.subcategory}</dd>
                </div>
              )}
            </div>

            {product.description && (
              <div className="border-t border-gray-100 pt-5">
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</h2>
                <p className="mt-2 text-sm text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
