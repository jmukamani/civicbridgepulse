import request from 'supertest';
import app from '../src/index.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

describe('User Routes', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'citizen',
      isVerified: true
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword123'
      });

    authToken = loginResponse.body.token;
  });

  afterEach(async () => {
    // Clean up test data
    await User.destroy({ where: {} });
  });

  describe('DELETE /api/users/account', () => {
    it('should delete user account with valid password', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Account deleted successfully');

      // Verify user is actually deleted
      const deletedUser = await User.findByPk(testUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Password is required for account deletion');
    });

    it('should return 400 when password is incorrect', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid password');

      // Verify user is not deleted
      const user = await User.findByPk(testUser.id);
      expect(user).not.toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .send({
          password: 'testpassword123'
        });

      expect(response.status).toBe(401);
    });

    it('should return 404 when user not found', async () => {
      // Delete the user first
      await testUser.destroy();

      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'testpassword123'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should work for different user roles', async () => {
      // Create a representative user
      const repPassword = await bcrypt.hash('reppassword123', 10);
      const repUser = await User.create({
        name: 'Test Representative',
        email: 'rep@example.com',
        password: repPassword,
        role: 'representative',
        isVerified: true,
        isRepVerified: true,
        verificationStatus: 'approved'
      });

      // Login as representative
      const repLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'rep@example.com',
          password: 'reppassword123'
        });

      const repAuthToken = repLoginResponse.body.token;

      // Delete representative account
      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${repAuthToken}`)
        .send({
          password: 'reppassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Account deleted successfully');

      // Verify representative is deleted
      const deletedRep = await User.findByPk(repUser.id);
      expect(deletedRep).toBeNull();
    });
  });
}); 