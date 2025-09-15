# Product Update Function - Usage Examples

## 🎯 **Overview**

The updated `updateProduct` function correctly handles the separation between `products` and `product_variants` tables according to your PostgreSQL schema.

## 📋 **Database Schema**

- **`products`**: Contains general product info (name, description, category, brand, etc.)
- **`product_variants`**: Contains variant-specific info (price, cost, variant_type, variant_value, etc.)
- **`inventory`**: Contains stock levels for each variant

## 🔧 **Available Functions**

### 1. `updateProduct(id, productData)` - Standard Update
- Updates product fields in `products` table
- Updates variants in `product_variants` table
- Returns complete product with variants and inventory

### 2. `updateProductAtomic(id, productData)` - Atomic Update
- Same as above but with rollback capability
- If variant update fails, product changes are rolled back
- Better for critical operations

## 📝 **Usage Examples**

### Example 1: Update Product Basic Info Only

```typescript
const productData = {
  name: "Updated Product Name",
  description: "New description",
  brand: "New Brand",
  is_prescription_required: true
};

const result = await ProductsService.updateProduct(productId, productData);
```

### Example 2: Update Product with Variants

```typescript
const productData = {
  name: "Updated Product Name",
  description: "New description",
  variants: [
    {
      id: "existing-variant-id", // Update existing variant
      price: 25.99,
      cost: 15.00,
      variant_type: "Size",
      variant_value: "Large"
    },
    {
      // Create new variant (no id provided)
      sku: "PROD-001-L",
      name: "Large Size",
      variant_type: "Size",
      variant_value: "Extra Large",
      price: 29.99,
      cost: 18.00
    }
  ]
};

const result = await ProductsService.updateProductAtomic(productId, productData);
```

### Example 3: Update Only Variants (Keep Product Unchanged)

```typescript
const productData = {
  variants: [
    {
      id: "variant-1-id",
      price: 19.99,
      is_active: false // Deactivate variant
    },
    {
      id: "variant-2-id",
      price: 24.99,
      variant_value: "Updated Value"
    }
  ]
};

const result = await ProductsService.updateProduct(productId, productData);
```

## 🧪 **Testing with PowerShell**

### Test 1: Update Product Basic Info

```powershell
$productId = "your-product-uuid"
$updateData = @{
    name = "Updated Product Name"
    description = "New description"
    brand = "New Brand"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/v1/products/$productId" -Method PUT -Body $updateData -ContentType "application/json"
```

### Test 2: Update Product with Variants

```powershell
$productId = "your-product-uuid"
$updateData = @{
    name = "Updated Product Name"
    variants = @(
        @{
            id = "existing-variant-id"
            price = 25.99
            variant_type = "Size"
            variant_value = "Large"
        },
        @{
            sku = "PROD-001-L"
            name = "Large Size"
            variant_type = "Size"
            variant_value = "Extra Large"
            price = 29.99
        }
    )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3001/v1/products/$productId" -Method PUT -Body $updateData -ContentType "application/json"
```

## 📊 **Response Format**

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": "product-uuid",
    "name": "Updated Product Name",
    "description": "New description",
    "sku": "PROD-001",
    "category_id": "category-uuid",
    "brand": "New Brand",
    "unit_of_measure": "pcs",
    "is_prescription_required": true,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z",
    "category": {
      "id": "category-uuid",
      "name": "Category Name",
      "description": "Category description"
    },
    "unit_of_measure": {
      "id": "unit-uuid",
      "name": "Piece",
      "abbreviation": "pcs"
    },
    "variants": [
      {
        "id": "variant-uuid",
        "product_id": "product-uuid",
        "sku": "PROD-001-L",
        "name": "Large Size",
        "variant_type": "Size",
        "variant_value": "Large",
        "price": 25.99,
        "cost": 15.00,
        "is_active": true,
        "created_at": "2024-01-01T00:00:00Z",
        "inventory": [
          {
            "id": "inventory-uuid",
            "branch_id": "branch-uuid",
            "product_variant_id": "variant-uuid",
            "quantity_on_hand": 100,
            "quantity_reserved": 10,
            "quantity_available": 90,
            "reorder_level": 20,
            "max_stock_level": 200,
            "last_counted": "2024-01-01T10:00:00Z",
            "updated_at": "2024-01-01T12:00:00Z"
          }
        ]
      }
    ]
  }
}
```

## ⚠️ **Important Notes**

1. **Field Separation**: Price-related fields (`price`, `cost`) go to `product_variants`, not `products`
2. **Variant Updates**: Provide `id` to update existing variants, omit `id` to create new ones
3. **Atomic Updates**: Use `updateProductAtomic` for critical operations that need rollback
4. **Error Handling**: All functions return `CRUDResponse` with success/error status
5. **Validation**: The function validates that the product exists before updating

## 🔍 **Error Scenarios**

### Product Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

### Variant Update Failed
```json
{
  "success": false,
  "message": "Failed to update variants: Failed to update variant variant-id: [error details]"
}
```

### Invalid Field Error
```json
{
  "success": false,
  "message": "Failed to update product: Could not find the 'selling_price' column of 'products' in the schema cache"
}
```

This error should no longer occur with the updated function as it properly separates product and variant fields.
