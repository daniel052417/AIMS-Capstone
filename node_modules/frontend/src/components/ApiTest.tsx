import React, { useState } from 'react';
import { productsService, Product } from '../services/productsService';
import { authService } from '../services/authService';

export const ApiTest: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testProductsAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await productsService.getProducts({ limit: 10 });
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.message || 'Failed to fetch products');
      }
    } catch (err: any) {
      setError(err.message || 'API call failed');
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/health');
      console.log('Health check response:', response);
      alert('Health check successful! Check console for details.');
    } catch (err: any) {
      setError(err.message || 'Health check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">API Test Component</h2>
      
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={testHealthCheck}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Health Check
          </button>
          
          <button
            onClick={testProductsAPI}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Products API
          </button>
        </div>

        {loading && <p>Loading...</p>}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}

        {products.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Products ({products.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.product_id} className="border p-4 rounded">
                  <h4 className="font-semibold">{product.product_name}</h4>
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                  <p className="text-sm text-gray-600">Price: ${product.price}</p>
                  <p className="text-sm text-gray-600">
                    Status: {product.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};