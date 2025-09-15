import { Request, Response } from 'express';
import { ProductsService } from '../services/products.service';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class ProductsController {
  private static productsService = new ProductsService();

  // Create product
  static create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await ProductsController.productsService.create(req.body);
    res.status(result.success ? 201 : 400).json(result);
  });

  // Get product by ID
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ProductsController.productsService.getById(id);
    res.status(result.success ? 200 : 404).json(result);
  });

  // Get all products with pagination and filters
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sort_by: req.query.sort_by as string || 'created_at',
      sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc'
    };

    const filters = {
      search: req.query.search as string,
      status: req.query.status as string,
      branch_id: req.query.branch_id as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string
    };

    const result = await ProductsController.productsService.getProductsWithDetails(pagination, filters);
    res.status(result.success ? 200 : 400).json(result);
  });

  // Update product
  static update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await ProductsController.productsService.update(id, req.body);
    res.status(result.success ? 200 : 400).json(result);
  });

  // Delete product
  static delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await ProductsController.productsService.delete(id);
    res.status(result.success ? 200 : 400).json(result);
  });

  // Soft delete product
  static softDelete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await ProductsController.productsService.softDelete(id);
    res.status(result.success ? 200 : 400).json(result);
  });

  // Restore product
  static restore = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await ProductsController.productsService.restore(id);
    res.status(result.success ? 200 : 400).json(result);
  });

  // Get product variants
  static getVariants = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const result = await ProductsController.productsService.getProductVariants(productId);
    res.status(result.success ? 200 : 400).json(result);
  });

  // Create product variant
  static createVariant = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { productId } = req.params;
    const result = await ProductsController.productsService.createVariant(productId, req.body);
    res.status(result.success ? 201 : 400).json(result);
  });

  // Get categories
  static getCategories = asyncHandler(async (req: Request, res: Response) => {
    const result = await ProductsController.productsService.getCategories();
    res.status(result.success ? 200 : 400).json(result);
  });

  // Search products
  static search = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;
    const branchId = req.query.branch_id as string;

    if (!q) {
      res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
      return;
    }

    const result = await ProductsController.productsService.searchProducts(q as string, branchId);
    res.status(result.success ? 200 : 400).json(result);
  });
}