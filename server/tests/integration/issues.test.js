import request from 'supertest';
import express from 'express';
import cors from 'cors';
import issuesRoutes from '../../src/routes/issues.js';
import Issue from '../../src/models/Issue.js';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/issues', issuesRoutes);

describe('Issues Routes', () => {
  let citizenUser, representativeUser, citizenToken, representativeToken;

  beforeAll(async () => {
    // Create test users once for the entire test suite
    citizenUser = await global.testUtils.createTestUser({
      email: `citizen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
      role: 'citizen',
      county: 'Nairobi',
      ward: 'Ward 1'
    });

    representativeUser = await global.testUtils.createTestUser({
      email: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
      role: 'representative',
      county: 'Nairobi',
      ward: 'Ward 1'
    });

    citizenToken = global.testUtils.generateTestToken(citizenUser);
    representativeToken = global.testUtils.generateTestToken(representativeUser);
  });

  describe('POST /api/issues', () => {
    it('should create issue successfully for citizen', async () => {
      const issueData = {
        title: 'Road Repair Needed',
        description: 'The road on Main Street has potholes',
        category: 'infrastructure',
        location: 'Main Street, Nairobi'
      };

      const response = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(issueData)
        .expect(201);

      expect(response.body.title).toBe(issueData.title);
      expect(response.body.description).toBe(issueData.description);
      expect(response.body.category).toBe(issueData.category);
      expect(response.body.citizenId).toBe(citizenUser.id);
      expect(response.body.status).toBe('reported');
    });

    it('should not create issue without authentication', async () => {
      const issueData = {
        title: 'Road Repair Needed',
        description: 'The road on Main Street has potholes'
      };

      await request(app)
        .post('/api/issues')
        .send(issueData)
        .expect(401);
    });

    it('should not create issue without required fields', async () => {
      const issueData = {
        title: 'Road Repair Needed'
        // Missing description
      };

      const response = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(issueData)
        .expect(400);

      expect(response.body.message).toBe('title and description are required');
    });
  });

  describe('GET /api/issues', () => {
    let otherCitizen;

    beforeAll(async () => {
      // Create an additional user for "other citizen" test
      otherCitizen = await global.testUtils.createTestUser({
        email: `other_citizen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
        role: 'citizen',
        county: 'Other County',
        ward: 'Other Ward'
      });

      // Create test issues
      await Issue.create({
        title: 'Citizen Issue 1',
        description: 'Description 1',
        citizenId: citizenUser.id,
        county: citizenUser.county,
        ward: citizenUser.ward
      });

      await Issue.create({
        title: 'Other Citizen Issue',
        description: 'Description 2',
        citizenId: otherCitizen.id,
        county: otherCitizen.county,
        ward: otherCitizen.ward
      });
    });

    it('should return issues for citizen (own issues only)', async () => {
      const response = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // All returned issues should belong to the citizen user
      response.body.forEach(issue => {
        expect(issue.citizenId).toBe(citizenUser.id);
      });
      
      // Should contain the specifically created issue
      const citizenIssue = response.body.find(issue => issue.title === 'Citizen Issue 1');
      expect(citizenIssue).toBeTruthy();
    });

    it('should return all issues for representative', async () => {
      const response = await request(app)
        .get('/api/issues')
        .set('Authorization', `Bearer ${representativeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/issues/:id/assign', () => {
    let issue;

    beforeAll(async () => {
      issue = await Issue.create({
        title: 'Test Issue for Assignment',
        description: 'Test Description',
        citizenId: citizenUser.id,
        county: citizenUser.county,
        ward: citizenUser.ward
      });
    });

    it('should allow representative to assign issue to themselves', async () => {
      const response = await request(app)
        .post(`/api/issues/${issue.id}/assign`)
        .set('Authorization', `Bearer ${representativeToken}`)
        .send({})
        .expect(200);

      expect(response.body.representativeId).toBe(representativeUser.id);
      expect(response.body.status).toBe('acknowledged');
    });

    it('should not allow citizen to assign issue', async () => {
      await request(app)
        .post(`/api/issues/${issue.id}/assign`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({})
        .expect(403);
    });

    it('should return 404 for non-existent issue', async () => {
      const fakeUUID = global.testUtils.generateUUID();
      await request(app)
        .post(`/api/issues/${fakeUUID}/assign`)
        .set('Authorization', `Bearer ${representativeToken}`)
        .send({})
        .expect(404);
    });
  });

  describe('PATCH /api/issues/:id/status', () => {
    let statusTestIssue, statusCitizenUser, statusRepUser;

    beforeAll(async () => {
      // Create fresh users for this test section to avoid cleanup interference
      statusCitizenUser = await global.testUtils.createTestUser({
        email: `status_citizen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
        role: 'citizen',
        county: 'Nairobi',
        ward: 'Ward 1'
      });

      statusRepUser = await global.testUtils.createTestUser({
        email: `status_rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
        role: 'representative',
        county: 'Nairobi',
        ward: 'Ward 1'
      });

      statusTestIssue = await Issue.create({
        title: 'Test Issue for Status',
        description: 'Test Description',
        citizenId: statusCitizenUser.id,
        county: statusCitizenUser.county,
        ward: statusCitizenUser.ward,
        representativeId: statusRepUser.id
      });
    });

    it('should allow citizen to update their own issue status', async () => {
      const statusCitizenToken = global.testUtils.generateTestToken(statusCitizenUser);
      
      const response = await request(app)
        .patch(`/api/issues/${statusTestIssue.id}/status`)
        .set('Authorization', `Bearer ${statusCitizenToken}`)
        .send({ status: 'resolved' })
        .expect(200);

      expect(response.body.status).toBe('resolved');
    });

    it('should allow assigned representative to update issue status', async () => {
      const statusRepToken = global.testUtils.generateTestToken(statusRepUser);
      
      const response = await request(app)
        .patch(`/api/issues/${statusTestIssue.id}/status`)
        .set('Authorization', `Bearer ${statusRepToken}`)
        .send({ status: 'acknowledged' })
        .expect(200);

      expect(response.body.status).toBe('acknowledged');
    });

    it('should not allow invalid status values', async () => {
      const statusCitizenToken = global.testUtils.generateTestToken(statusCitizenUser);
      
      const response = await request(app)
        .patch(`/api/issues/${statusTestIssue.id}/status`)
        .set('Authorization', `Bearer ${statusCitizenToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.message).toBe('Invalid status');
    });
  });
}); 