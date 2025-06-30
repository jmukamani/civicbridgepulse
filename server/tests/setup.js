import dotenv from 'dotenv';
import sequelize from '../src/config/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Load test environment variables
dotenv.config({ path: '.env.test' });

let isDbSetup = false;

// Set up test database
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log('Test database connected successfully.');
    
    // Import all models to ensure they're registered
    await import('../src/models/User.js');
    await import('../src/models/Issue.js');
    await import('../src/models/Poll.js');
    await import('../src/models/PollVote.js');
    await import('../src/models/PolicyDocument.js');
    await import('../src/models/PolicyComment.js');
    await import('../src/models/Message.js');
    await import('../src/models/MessageRating.js');
    await import('../src/models/ForumThread.js');
    await import('../src/models/ForumPost.js');
    await import('../src/models/Interaction.js');
    
    // Sync database - this will create tables if they don't exist
    await sequelize.sync({ force: false, alter: true });
    console.log('Test database synced.');
    
    isDbSetup = true;
  } catch (error) {
    console.error('Unable to connect to test database:', error);
    process.exit(1);
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    // Clean up data before closing
    if (isDbSetup) {
      await sequelize.query('DELETE FROM "forum_posts";');
      await sequelize.query('DELETE FROM "forum_threads";');
      await sequelize.query('DELETE FROM "message_ratings";');
      await sequelize.query('DELETE FROM "messages";');
      await sequelize.query('DELETE FROM "policy_comments";');
      await sequelize.query('DELETE FROM "policy_documents";');
      await sequelize.query('DELETE FROM "poll_votes";');
      await sequelize.query('DELETE FROM "polls";');
      await sequelize.query('DELETE FROM "interactions";');
      await sequelize.query('DELETE FROM "issues";');
      await sequelize.query('DELETE FROM "users";');
    }
    
    await sequelize.close();
    console.log('Test database connection closed.');
  } catch (error) {
    console.error('Error closing test database:', error);
  }
});

// Global test utilities
global.testUtils = {
  createTestUser: async (userData = {}) => {
    const User = (await import('../src/models/User.js')).default;
    
    const defaultUser = {
      name: 'Test User',
      email: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
      password: await bcrypt.hash('password123', 10),
      role: 'citizen',
      isVerified: true,
      county: 'Nairobi',
      ward: 'Ward 1',
      ...userData
    };
    
    const user = await User.create(defaultUser);
    return user;
  },
  
  generateTestToken: (user) => {
    return jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '7d' }
    );
  },
  
  // Generate a valid UUID for testing
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  
  // Wait for database operations to complete
  waitForDb: async (ms = 100) => {
    await new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // Manual cleanup function for tests that need it
  cleanDatabase: async () => {
    try {
      await sequelize.query('DELETE FROM "forum_posts";');
      await sequelize.query('DELETE FROM "forum_threads";');
      await sequelize.query('DELETE FROM "message_ratings";');
      await sequelize.query('DELETE FROM "messages";');
      await sequelize.query('DELETE FROM "policy_comments";');
      await sequelize.query('DELETE FROM "policy_documents";');
      await sequelize.query('DELETE FROM "poll_votes";');
      await sequelize.query('DELETE FROM "polls";');
      await sequelize.query('DELETE FROM "interactions";');
      await sequelize.query('DELETE FROM "issues";');
      await sequelize.query('DELETE FROM "users";');
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  }
}; 