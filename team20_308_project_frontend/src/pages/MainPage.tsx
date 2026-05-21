import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { fetchProducts, Product } from "../services/productService";
import "../styles/MainPage.css";

const MainPage: React.FC = () => {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sort, setSort] = useState<string>("");

  // 🟡 URL'den kategori parametresini al
  const queryParams = new URLSearchParams(location.search);
  const categoryIdParam = queryParams.get("categoryId");
  const categoryId = categoryIdParam ? parseInt(categoryIdParam) : null;

  const getProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts(sort, categoryId);
      setProducts(data);
    } catch (err) {
      console.error("Could not load Products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, [sort, categoryIdParam]);


  return (
      <div className="main-page">
        <div className="layout-with-sidebar">
          <div className="content-with-header">
            <div className="upper-page">
              <h2 className="section-title">Featured Products</h2>
              <div className="sort-dropdown">
                <label htmlFor="sortSelect">
                  <i className="sort-icon">↕️</i> Sort by
                </label>
                <select
                    id="sortSelect"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="modern-select"
                >
                  <option value="">Featured</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                  <option value="popularity">Most Popular</option>
                </select>
              </div>
            </div>

            <div className="content">
              {loading ? (
                  <p className="loading-text">Loading products...</p>
              ) : (
                  <div className="product-grid">
                    {products.length > 0 ? (
                        products.map((product) => (
                            <ProductCard key={product.id} {...product} />
                        ))
                    ) : (
                        <p className="no-products">No products found.</p>
                    )}
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default MainPage;
