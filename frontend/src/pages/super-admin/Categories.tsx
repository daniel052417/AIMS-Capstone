import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Package, Eye } from 'lucide-react';
import { CategoryModal, ConfirmModal } from '../../components/modals';
// TODO: Replace with actual API calls when backend is connected

const Categories: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<{type: string, category: any} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Static data for demonstration
  const categories = [
    {
      id: '1',
      name: 'Feeds',
      description: 'Animal feed and nutrition products',
      productCount: 450,
      totalValue: 1250000,
      color: 'bg-red-500',
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      name: 'Medicine',
      description: 'Veterinary medicines and treatments',
      productCount: 320,
      totalValue: 890000,
      color: 'bg-green-500',
      createdAt: '2024-01-01'
    },
    {
      id: '3',
      name: 'Tools',
      description: 'Agricultural tools and equipment',
      productCount: 180,
      totalValue: 670000,
      color: 'bg-blue-500',
      createdAt: '2024-01-01'
    },
    {
      id: '4',
      name: 'Supplements',
      description: 'Nutritional supplements and additives',
      productCount: 250,
      totalValue: 450000,
      color: 'bg-purple-500',
      createdAt: '2024-01-01'
    },
    {
      id: '5',
      name: 'Agriculture',
      description: 'Farming and agricultural supplies',
      productCount: 95,
      totalValue: 380000,
      color: 'bg-orange-500',
      createdAt: '2024-01-01'
    },
    {
      id: '6',
      name: 'Accessories',
      description: 'Farm accessories and miscellaneous items',
      productCount: 120,
      totalValue: 220000,
      color: 'bg-teal-500',
      createdAt: '2024-01-01'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  // Modal handlers
  const handleAddCategory = () => {
    setModalMode('add');
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setModalMode('edit');
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (category: any) => {
    setPendingAction({ type: 'delete', category });
    setIsConfirmModalOpen(true);
  };

  const handleSaveCategory = async (categoryData: any) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save category
      console.log('Saving category:', categoryData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    
    setIsLoading(true);
    try {
      // TODO: Implement API call based on action type
      console.log(`${pendingAction.type} category:`, pendingAction.category);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsConfirmModalOpen(false);
      setPendingAction(null);
    } catch (error) {
      console.error('Error performing action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Categories</h1>
          <p className="text-gray-600">Manage product categories and classifications</p>
        </div>
        <button 
          onClick={handleAddCategory}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center`}>
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button className="text-blue-600 hover:text-blue-900 p-1" title="View Category">
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleEditCategory(category)}
                  className="text-green-600 hover:text-green-900 p-1" 
                  title="Edit Category"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteCategory(category)}
                  className="text-red-600 hover:text-red-900 p-1" 
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Products</span>
                <span className="text-sm font-semibold text-gray-900">{category.productCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Value</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(category.totalValue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm text-gray-900">{category.createdAt}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Average Value per Product</span>
                <span className="text-xs font-semibold text-gray-900">
                  {formatCurrency(category.totalValue / category.productCount)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{categories.reduce((sum, c) => sum + c.productCount, 0)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(categories.reduce((sum, c) => sum + c.totalValue, 0))}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter category description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex space-x-2">
                  {['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'].map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full ${color} border-2 border-gray-300 hover:border-gray-400`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Modals */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        category={selectedCategory}
        mode={modalMode}
        isLoading={isLoading}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmAction}
        title="Confirm Action"
        message={`Are you sure you want to ${pendingAction?.type} the category "${pendingAction?.category?.name}"?`}
        confirmText={pendingAction?.type === 'delete' ? 'Delete' : 'Confirm'}
        type="danger"
        isLoading={isLoading}
      />
    </div>
  );
};

export default Categories;