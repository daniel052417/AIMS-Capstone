import { DatabaseTestHelpers } from '../utils/database-helpers';

beforeAll(async () => {
  // Clean up any existing test data
  await DatabaseTestHelpers.cleanupTestData();
});

afterAll(async () => {
  // Clean up test data after all tests
  await DatabaseTestHelpers.cleanupTestData();
});

afterEach(async () => {
  // Clean up after each test
  await DatabaseTestHelpers.cleanupTestData();
});