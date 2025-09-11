"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const superAdmin_routes_1 = __importDefault(require("./superAdmin.routes"));
const hr_routes_1 = __importDefault(require("./hr.routes"));
const marketing_routes_1 = __importDefault(require("./marketing.routes"));
const pos_routes_1 = __importDefault(require("./pos.routes"));
const inventory_routes_1 = __importDefault(require("./inventory.routes"));
const client_routes_1 = __importDefault(require("./client.routes"));
const accounts_routes_1 = __importDefault(require("./accounts.routes"));
const products_routes_1 = __importDefault(require("./products.routes"));
const sales_routes_1 = __importDefault(require("./sales.routes"));
const purchases_routes_1 = __importDefault(require("./purchases.routes"));
const notifications_routes_1 = __importDefault(require("./notifications.routes"));
const router = (0, express_1.Router)();
const API_VERSION = '/v1';
router.use(`${API_VERSION}/super-admin`, superAdmin_routes_1.default);
router.use(`${API_VERSION}/hr`, hr_routes_1.default);
router.use(`${API_VERSION}/marketing`, marketing_routes_1.default);
router.use(`${API_VERSION}/pos`, pos_routes_1.default);
router.use(`${API_VERSION}/inventory`, inventory_routes_1.default);
router.use(`${API_VERSION}/client`, client_routes_1.default);
router.use(`${API_VERSION}/accounts`, accounts_routes_1.default);
router.use(`${API_VERSION}/products`, products_routes_1.default);
router.use(`${API_VERSION}/sales`, sales_routes_1.default);
router.use(`${API_VERSION}/purchases`, purchases_routes_1.default);
router.use(`${API_VERSION}/notifications`, notifications_routes_1.default);
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'AIMS API Server',
        version: '1.0.0',
        endpoints: {
            superAdmin: `${API_VERSION}/super-admin`,
            hr: `${API_VERSION}/hr`,
            marketing: `${API_VERSION}/marketing`,
            pos: `${API_VERSION}/pos`,
            inventory: `${API_VERSION}/inventory`,
            client: `${API_VERSION}/client`,
            accounts: `${API_VERSION}/accounts`,
            products: `${API_VERSION}/products`,
            sales: `${API_VERSION}/sales`,
            purchases: `${API_VERSION}/purchases`,
            notifications: `${API_VERSION}/notifications`
        },
        documentation: '/api/docs',
        health: '/health'
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map