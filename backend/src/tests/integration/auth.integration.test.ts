import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import request from 'supertest';
import app from '../../index';
import { DatabaseTestHelpers } from '../utils/database-helpers';

// Mock the database helpers for integration tests
jest.mock('../utils/database-helpers', () => ({
  DatabaseTestHelpers: {
    cleanupTestData: jest.fn(),
    createTestUser: jest.fn(),
  },
}));

describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    await DatabaseTestHelpers.cleanupTestData();
  });

  describe('POST /v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User',
        phone: '+1234567890',
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();
    });

    it('should return error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User',
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Please provide a valid email address');
    });

    it('should return error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        first_name: 'Test',
        last_name: 'User',
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    });
  });

  describe('POST /v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user first
      await DatabaseTestHelpers.createTestUser();
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!',
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();
      // Check that roles array is present
      expect(response.body.data.user.roles).toBeDefined();
      expect(Array.isArray(response.body.data.user.roles)).toBe(true);
      // Check that permissions array is present
      expect(response.body.data.user.permissions).toBeDefined();
      expect(Array.isArray(response.body.data.user.permissions)).toBe(true);
    });

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });
});