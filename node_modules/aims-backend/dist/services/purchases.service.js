"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasesService = void 0;
const supabaseClient_1 = require("../config/supabaseClient");
class PurchasesService {
    static async getPurchaseOrders(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
                .from('purchase_orders')
                .select(`
          *,
          supplier:supplier_id (
            id,
            name,
            contact_person,
            email,
            phone
          ),
          created_by:created_by_user_id (
            first_name,
            last_name
          ),
          approved_by:approved_by_user_id (
            first_name,
            last_name
          ),
          items:purchase_order_items (
            id,
            product_id,
            quantity_ordered,
            quantity_received,
            unit_cost,
            line_total,
            product:product_id (
              id,
              sku,
              name
            )
          )
        `);
            if (filters.supplier_id) {
                query = query.eq('supplier_id', filters.supplier_id);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.date_from) {
                query = query.gte('order_date', filters.date_from);
            }
            if (filters.date_to) {
                query = query.lte('order_date', filters.date_to);
            }
            if (filters.search) {
                query = query.or(`po_number.ilike.%${filters.search}%,supplier.name.ilike.%${filters.search}%`);
            }
            const page = filters.page || 1;
            const limit = filters.limit || 25;
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('order_date', { ascending: false });
            const { data, error, count } = await query;
            if (error)
                throw error;
            return {
                orders: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch purchase orders: ${error}`);
        }
    }
    static async getPurchaseOrderById(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('purchase_orders')
                .select(`
          *,
          supplier:supplier_id (
            id,
            name,
            contact_person,
            email,
            phone,
            address,
            city,
            payment_terms
          ),
          created_by:created_by_user_id (
            id,
            first_name,
            last_name
          ),
          approved_by:approved_by_user_id (
            id,
            first_name,
            last_name
          ),
          items:purchase_order_items (
            id,
            product_id,
            quantity_ordered,
            quantity_received,
            unit_cost,
            line_total,
            received_date,
            product:product_id (
              id,
              sku,
              name,
              description,
              unit_of_measure
            )
          )
        `)
                .eq('id', id)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch purchase order: ${error}`);
        }
    }
    static async createPurchaseOrder(orderData, items) {
        try {
            const subtotal = items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_cost), 0);
            const taxAmount = subtotal * 0.12;
            const totalAmount = subtotal + taxAmount;
            const orderPayload = {
                ...orderData,
                subtotal,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data: order, error: orderError } = await supabaseClient_1.supabaseAdmin
                .from('purchase_orders')
                .insert([orderPayload])
                .select()
                .single();
            if (orderError)
                throw orderError;
            const itemsWithOrderId = items.map(item => ({
                ...item,
                purchase_order_id: order.id,
                line_total: item.quantity_ordered * item.unit_cost,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));
            const { data: orderItems, error: itemsError } = await supabaseClient_1.supabaseAdmin
                .from('purchase_order_items')
                .insert(itemsWithOrderId)
                .select();
            if (itemsError)
                throw itemsError;
            return {
                ...order,
                items: orderItems
            };
        }
        catch (error) {
            throw new Error(`Failed to create purchase order: ${error}`);
        }
    }
    static async updatePurchaseOrder(id, orderData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('purchase_orders')
                .update({
                ...orderData,
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update purchase order: ${error}`);
        }
    }
    static async approvePurchaseOrder(id, approvedByUserId) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('purchase_orders')
                .update({
                status: 'confirmed',
                approved_by_user_id: approvedByUserId,
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to approve purchase order: ${error}`);
        }
    }
    static async updatePurchaseOrderItem(id, itemData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('purchase_order_items')
                .update({
                ...itemData,
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update purchase order item: ${error}`);
        }
    }
    static async receivePurchaseOrderItem(id, quantityReceived, receivedDate) {
        try {
            const { data: item, error: itemError } = await supabaseClient_1.supabaseAdmin
                .from('purchase_order_items')
                .select('*')
                .eq('id', id)
                .single();
            if (itemError)
                throw itemError;
            const newQuantityReceived = (item.quantity_received || 0) + quantityReceived;
            const isFullyReceived = newQuantityReceived >= item.quantity_ordered;
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('purchase_order_items')
                .update({
                quantity_received: newQuantityReceived,
                received_date: receivedDate || new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            await this.updateProductStock(item.product_id, quantityReceived, 'in');
            if (isFullyReceived) {
                await this.checkAndUpdateOrderStatus(item.purchase_order_id);
            }
            return data;
        }
        catch (error) {
            throw new Error(`Failed to receive purchase order item: ${error}`);
        }
    }
    static async getSuppliers(filters = {}) {
        try {
            let query = supabaseClient_1.supabaseAdmin
                .from('suppliers')
                .select('*');
            if (filters.is_active !== undefined) {
                query = query.eq('is_active', filters.is_active);
            }
            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            }
            const { data, error } = await query.order('name');
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            throw new Error(`Failed to fetch suppliers: ${error}`);
        }
    }
    static async getSupplierById(id) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('suppliers')
                .select('*')
                .eq('id', id)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch supplier: ${error}`);
        }
    }
    static async createSupplier(supplierData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('suppliers')
                .insert([supplierData])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create supplier: ${error}`);
        }
    }
    static async updateSupplier(id, supplierData) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .from('suppliers')
                .update(supplierData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update supplier: ${error}`);
        }
    }
    static async updateProductStock(productId, quantity, movementType) {
        try {
            const { data: product, error: productError } = await supabaseClient_1.supabaseAdmin
                .from('products')
                .select('stock_quantity')
                .eq('id', productId)
                .single();
            if (productError)
                throw productError;
            const newStockQuantity = movementType === 'in'
                ? product.stock_quantity + quantity
                : product.stock_quantity - quantity;
            const { error: updateError } = await supabaseClient_1.supabaseAdmin
                .from('products')
                .update({
                stock_quantity: newStockQuantity,
                updated_at: new Date().toISOString()
            })
                .eq('id', productId);
            if (updateError)
                throw updateError;
            const { error: movementError } = await supabaseClient_1.supabaseAdmin
                .from('inventory_movements')
                .insert([{
                    product_id: productId,
                    movement_type: movementType,
                    quantity: quantity,
                    reference_type: 'purchase_order',
                    notes: `Stock ${movementType} from purchase order`,
                    created_at: new Date().toISOString()
                }]);
            if (movementError)
                throw movementError;
            return newStockQuantity;
        }
        catch (error) {
            throw new Error(`Failed to update product stock: ${error}`);
        }
    }
    static async checkAndUpdateOrderStatus(orderId) {
        try {
            const { data: items, error: itemsError } = await supabaseClient_1.supabaseAdmin
                .from('purchase_order_items')
                .select('quantity_ordered, quantity_received')
                .eq('purchase_order_id', orderId);
            if (itemsError)
                throw itemsError;
            const allItemsReceived = items.every(item => (item.quantity_received || 0) >= item.quantity_ordered);
            if (allItemsReceived) {
                const { error: updateError } = await supabaseClient_1.supabaseAdmin
                    .from('purchase_orders')
                    .update({
                    status: 'received',
                    actual_delivery_date: new Date().toISOString().split('T')[0],
                    updated_at: new Date().toISOString()
                })
                    .eq('id', orderId);
                if (updateError)
                    throw updateError;
            }
            return allItemsReceived;
        }
        catch (error) {
            throw new Error(`Failed to check order status: ${error}`);
        }
    }
    static async getPurchaseReport(filters = {}) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .rpc('get_purchase_report', {
                p_date_from: filters.date_from,
                p_date_to: filters.date_to,
                p_supplier_id: filters.supplier_id
            });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch purchase report: ${error}`);
        }
    }
    static async getSupplierPerformance(filters = {}) {
        try {
            const { data, error } = await supabaseClient_1.supabaseAdmin
                .rpc('get_supplier_performance', {
                p_date_from: filters.date_from,
                p_date_to: filters.date_to
            });
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            throw new Error(`Failed to fetch supplier performance: ${error}`);
        }
    }
    static async getPurchasesDashboard() {
        try {
            const [totalOrders, pendingOrders, totalValue, topSuppliers] = await Promise.all([
                supabaseClient_1.supabaseAdmin.from('purchase_orders').select('id', { count: 'exact' }),
                supabaseClient_1.supabaseAdmin.from('purchase_orders').select('id', { count: 'exact' }).eq('status', 'draft'),
                supabaseClient_1.supabaseAdmin.from('purchase_orders').select('total_amount'),
                supabaseClient_1.supabaseAdmin.rpc('get_top_suppliers', { p_limit: 5 })
            ]);
            const totalValueAmount = totalValue.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
            return {
                totalOrders: totalOrders.count || 0,
                pendingOrders: pendingOrders.count || 0,
                totalValue: totalValueAmount,
                topSuppliers: topSuppliers.data || [],
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch purchases dashboard: ${error}`);
        }
    }
}
exports.PurchasesService = PurchasesService;
//# sourceMappingURL=purchases.service.js.map