import { Router } from 'express';
import authRoutes from './auth.routes';
import rbacRoutes from './rbac.routes';
import superAdminRoutes from './superAdmin.routes';
import hrRoutes from './hr.routes';
import marketingRoutes from './marketing.routes';
import posRoutes from './pos.routes';
import inventoryRoutes from './inventory.routes';
import clientRoutes from './client.routes';
import accountsRoutes from './accounts.routes';
import productsRoutes from './products.routes';
import salesRoutes from './sales.routes';
import purchasesRoutes from './purchases.routes';
import notificationsRoutes from './notifications.routes';

const router = Router();

// API version prefix
const API_VERSION = '/v1';

// Route definitions
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/rbac`, rbacRoutes);
router.use(`${API_VERSION}/super-admin`, superAdminRoutes);
router.use(`${API_VERSION}/hr`, hrRoutes);
router.use(`${API_VERSION}/marketing`, marketingRoutes);
router.use(`${API_VERSION}/pos`, posRoutes);
router.use(`${API_VERSION}/inventory`, inventoryRoutes);
router.use(`${API_VERSION}/client`, clientRoutes);
router.use(`${API_VERSION}/accounts`, accountsRoutes);
router.use(`${API_VERSION}/products`, productsRoutes);
router.use(`${API_VERSION}/sales`, salesRoutes);
router.use(`${API_VERSION}/purchases`, purchasesRoutes);
router.use(`${API_VERSION}/notifications`, notificationsRoutes);

// API info endpoint - handle both /v1 and /v1/
router.get(['/', ''], (req, res) => {
  res.json({
    success: true,
    message: 'AIMS API Server',
    version: '1.0.0',
    endpoints: {
      auth: `${API_VERSION}/auth`,
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
      notifications: `${API_VERSION}/notifications`,
    },
    documentation: '/api/docs',
    health: '/health',
  });
});

export default router;
