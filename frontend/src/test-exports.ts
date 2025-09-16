// Test file to verify exports are working
import { apiClient } from './services/api';
import { authService } from './services/authService';
import { productsService } from './services/productsService';

console.log('API Client:', apiClient);
console.log('Auth Service:', authService);
console.log('Products Service:', productsService);

export { apiClient, authService, productsService };
