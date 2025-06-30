import User from '../../../src/models/User.js';
import bcrypt from 'bcryptjs';

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: `john_${Date.now()}@example.com`,
        password: await bcrypt.hash('password123', 10),
        role: 'citizen'
      };

      const user = await User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe('citizen');
      expect(user.isVerified).toBe(false);
    });

    it('should not create a user without required fields', async () => {
      const userData = {
        name: 'John Doe'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should not create a user with duplicate email', async () => {
      const email = `duplicate_${Date.now()}@example.com`;
      const userData = {
        name: 'John Doe',
        email: email,
        password: await bcrypt.hash('password123', 10),
        role: 'citizen'
      };

      await User.create(userData);

      // Try to create another user with same email
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: await bcrypt.hash('password123', 10),
        role: 'citizen'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('User Roles', () => {
    it('should default to citizen role', async () => {
      const userData = {
        name: 'John Doe',
        email: `default_role_${Date.now()}@example.com`,
        password: await bcrypt.hash('password123', 10)
      };

      const user = await User.create(userData);
      expect(user.role).toBe('citizen');
    });

    it('should accept valid roles', async () => {
      const roles = ['citizen', 'representative', 'admin'];
      const timestamp = Date.now();

      for (let i = 0; i < roles.length; i++) {
        const role = roles[i];
        const userData = {
          name: `User ${role}`,
          email: `${role}_${timestamp}_${i}_${Math.random().toString(36).substr(2, 5)}@example.com`, // Extra unique
          password: await bcrypt.hash('password123', 10),
          role
        };

        const user = await User.create(userData);
        expect(user.role).toBe(role);
        
        // Wait a bit between operations to ensure database consistency
        await global.testUtils.waitForDb(50);
      }
    });
  });

  describe('User Authentication', () => {
    it('should hash password before saving', async () => {
      const plainPassword = 'password123';
      const userData = {
        name: 'John Doe',
        email: `auth_test_${Date.now()}@example.com`,
        password: await bcrypt.hash(plainPassword, 10),
        role: 'citizen'
      };

      const user = await User.create(userData);
      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/);
    });
  });
}); 