// src/pages/SearchResultPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SearchResultCard from "../components/SearchResultCard";
import "../styles/SearchResultPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

interface Product {
  id: number;
  name: string;
  model: string;
  serialNumber: string;
  price: string;
  imageUrl: string | null;
  rating?: number;
  quantityInStocks: number;
}

const SearchResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get("query");

  const [sort, setSort] = useState("");

  useEffect(() => {
    if (!query) {
      navigate("/");
      return;
    }
    fetchProducts();
  }, [query, sort, navigate]);

  const fetchProducts = async () => {
    if (!query) return;

    setLoading(true);
    try {
      let url = `${API_BASE}/products?search=${encodeURIComponent(
        query
      )}`;
      if (sort) url += `&sort=${sort}`;

      const res = await fetch(url);
      const data = (await res.json()) as Product[];
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value);
  };

  if (!query) {
    return null;
  }

  if (loading) {
    return (
      <div className="main-page">
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="main-page">
        <div className="no-results">
          <h2>No results found for "{query}"</h2>
          <p>Try checking your spelling or using different keywords</p>
          <button onClick={() => navigate("/")}>Return to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-page">
      <div className="sort-controls">
        <div className="sort-dropdown">
          <label htmlFor="sortSelect">Sort by</label>
          <select
            id="sortSelect"
            value={sort}
            onChange={handleSortChange}
            className="modern-select"
          >
            <option value="">Featured</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <h2 className="section-title">Search results for "{query}"</h2>

      <div className="product-list">
        {products.map((product) => (
          <SearchResultCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default SearchResultsPage;
