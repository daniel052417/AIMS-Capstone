import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ProductsService } from '../services/products.service';

// Product Management
export const getProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      category_id: req.query.category_id as string,
      supplier_id: req.query.supplier_id as string,
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      search: req.query.search as string,
      low_stock: req.query.low_stock === 'true',
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 25
    };

    const result = await ProductsService.getProducts(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

export const getProductById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await ProductsService.getProductById(id);
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const productData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const product = await ProductsService.createProduct(productData);
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const productData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const product = await ProductsService.updateProduct(id, productData);
    
    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await ProductsService.deleteProduct(id);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

// Category Management
export const getCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      parent_id: req.query.parent_id === 'null' ? null : req.query.parent_id as string,
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      search: req.query.search as string
    };

    const categories = await ProductsService.getCategories(filters);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categoryData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const category = await ProductsService.createCategory(categoryData);
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
};

export const updateCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const categoryData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const category = await ProductsService.updateCategory(id, categoryData);
    
    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await ProductsService.deleteCategory(id);
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
};

// Supplier Management
export const getSuppliers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      search: req.query.search as string
    };

    const suppliers = await ProductsService.getSuppliers(filters);
    
    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers'
    });
  }
};

export const createSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const supplierData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const supplier = await ProductsService.createSupplier(supplierData);
    
    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully'
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create supplier'
    });
  }
};

export const updateSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supplierData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const supplier = await ProductsService.updateSupplier(id, supplierData);
    
    res.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier'
    });
  }
};

export const deleteSupplier = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await ProductsService.deleteSupplier(id);
    
    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete supplier'
    });
  }
};

// Inventory Management
export const getInventoryLevels = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      product_id: req.query.product_id as string,
      branch_id: req.query.branch_id as string,
      low_stock: req.query.low_stock === 'true'
    };

    const levels = await ProductsService.getInventoryLevels(filters);
    
    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    console.error('Error fetching inventory levels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory levels'
    });
  }
};

export const updateInventoryLevel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const levelData = {
      ...req.body,
      last_updated: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const level = await ProductsService.updateInventoryLevel(id, levelData);
    
    res.json({
      success: true,
      data: level,
      message: 'Inventory level updated successfully'
    });
  } catch (error) {
    console.error('Error updating inventory level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory level'
    });
  }
};

export const getInventoryMovements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      product_id: req.query.product_id as string,
      movement_type: req.query.movement_type as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string
    };

    const movements = await ProductsService.getInventoryMovements(filters);
    
    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory movements'
    });
  }
};

export const createInventoryMovement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const movementData = {
      ...req.body,
      created_by_user_id: req.user?.id,
      created_at: new Date().toISOString()
    };

    const movement = await ProductsService.createInventoryMovement(movementData);
    
    res.status(201).json({
      success: true,
      data: movement,
      message: 'Inventory movement created successfully'
    });
  } catch (error) {
    console.error('Error creating inventory movement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory movement'
    });
  }
};

// Stock Management
export const adjustStock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { quantity, movementType, notes } = req.body;

    const result = await ProductsService.adjustStock(
      productId, 
      quantity, 
      movementType, 
      notes, 
      req.user?.id
    );
    
    res.json({
      success: true,
      data: result,
      message: 'Stock adjusted successfully'
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adjust stock'
    });
  }
};

// Reports
export const getLowStockProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const products = await ProductsService.getLowStockProducts();
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products'
    });
  }
};

export const getProductSalesReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const filters = {
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
      product_id: req.query.product_id as string
    };

    const report = await ProductsService.getProductSalesReport(filters);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching product sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product sales report'
    });
  }
};

