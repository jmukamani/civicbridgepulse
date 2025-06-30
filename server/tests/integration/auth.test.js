import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../src/routes/auth.js';
import User from '../../src/models/User.js';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Routes', () => {

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
        password: 'password123',
        role: 'citizen'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toContain('Registration successful');
      
 
      // Implement retry mechanism for database transaction timing
      let user = null;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!user && attempts < maxAttempts) {
        // Progressively longer delays
        await new Promise(resolve => setTimeout(resolve, 100 + (attempts * 50)));
        
        try {
          user = await User.findOne({ where: { email: userData.email } });
        } catch (error) {
          console.log(`Attempt ${attempts + 1} failed:`, error.message);
        }
        
        attempts++;
        
        if (user) break;
        
        console.log(`Attempt ${attempts}: User not found yet, retrying...`);
      }
      
      expect(user).toBeTruthy();
      if (user) {
        expect(user.name).toBe(userData.name);
        expect(user.role).toBe(userData.role);
        expect(user.isVerified).toBe(false);
      } else {
        throw new Error(`User not found after ${maxAttempts} attempts. This suggests a database transaction issue.`);
      }
    });

    it('should not register user with missing fields', async () => {
      const userData = {
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('All fields are required');
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: `duplicate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
        password: 'password123',
        role: 'citizen'
      };

      // Create first user directly in database to ensure it exists
      await global.testUtils.createTestUser({
        email: userData.email,
        name: userData.name,
        role: userData.role
      });

      // Try to create second user with same email via API
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeAll(async () => {
      // Create a verified test user for this test suite
      testUser = await global.testUtils.createTestUser({
        email: `login_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
        isVerified: true
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: testUser.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
    });

    it('should not login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should not login with invalid password', async () => {
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should not login with unverified email', async () => {
      // Create unverified user
      const unverifiedUser = await global.testUtils.createTestUser({
        email: `unverified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
        isVerified: false
      });

      const loginData = {
        email: unverifiedUser.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toBe('Please verify your email first');
    });
  });

  describe('GET /api/auth/verify', () => {
    let verifyUser;

    beforeAll(async () => {
      verifyUser = await global.testUtils.createTestUser({
        email: `verify_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
        isVerified: false
      });
    });

    it('should verify user email with valid token', async () => {
      const token = global.testUtils.generateTestToken(verifyUser);

      const response = await request(app)
        .get(`/api/auth/verify?token=${token}`)
        .expect(200);

      expect(response.body.message).toBe('Email verified successfully');

      // Check user is verified in database
      await verifyUser.reload();
      expect(verifyUser.isVerified).toBe(true);
    });

    it('should not verify with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify?token=invalid_token')
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired token');
    });
  });
}); 