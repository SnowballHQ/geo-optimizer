const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const SuperUserAnalysis = require('../models/SuperUserAnalysis');
const BrandShareOfVoice = require('../models/BrandShareOfVoice');
const BrandProfile = require('../models/BrandProfile');

describe('Super User SOV Table Update Fix', () => {
  let superUserToken;
  let analysisId;
  let brandId;

  beforeAll(async () => {
    // Create test super user and get auth token
    const superUserResponse = await request(app)
      .post('/api/v1/register')
      .send({
        email: 'superuser@test.com',
        password: 'testpass123',
        role: 'superuser'
      });

    const loginResponse = await request(app)
      .post('/api/v1/login')
      .send({
        email: 'superuser@test.com',
        password: 'testpass123'
      });

    superUserToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await SuperUserAnalysis.deleteMany({ domain: 'testdomain.com' });
    await BrandProfile.deleteMany({ domain: 'testdomain.com' });
    await BrandShareOfVoice.deleteMany({});
  });

  describe('Super User Analysis SOV Data Fetching', () => {
    beforeEach(async () => {
      // Create a completed Super User analysis
      const analysis = new SuperUserAnalysis({
        superUserId: 'test-user-id',
        domain: 'testdomain.com',
        brandName: 'Test Brand',
        status: 'completed',
        analysisResults: {
          brandId: new mongoose.Types.ObjectId(),
          shareOfVoice: { 'Test Brand': 50, 'Competitor A': 30, 'Competitor B': 20 },
          mentionCounts: { 'Test Brand': 10, 'Competitor A': 6, 'Competitor B': 4 },
          totalMentions: 20,
          brandShare: 50,
          competitors: ['Competitor A', 'Competitor B']
        }
      });
      
      await analysis.save();
      analysisId = analysis.analysisId;
      brandId = analysis.analysisResults.brandId;

      // Create corresponding brand profile
      const brand = new BrandProfile({
        _id: brandId,
        ownerUserId: 'test-user-id',
        brandName: 'Test Brand',
        domain: 'testdomain.com',
        competitors: ['Competitor A', 'Competitor B'],
        isAdminAnalysis: true
      });
      await brand.save();
    });

    afterEach(async () => {
      await SuperUserAnalysis.deleteMany({ domain: 'testdomain.com' });
      await BrandProfile.deleteMany({ domain: 'testdomain.com' });
      await BrandShareOfVoice.deleteMany({});
    });

    test('should fetch fresh SOV data when competitor is added', async () => {
      // 1. Create fresh SOV data in database (simulating competitor addition)
      const freshSOV = new BrandShareOfVoice({
        brandId: brandId,
        userId: 'test-user-id',
        shareOfVoice: { 
          'Test Brand': 40, 
          'Competitor A': 25, 
          'Competitor B': 20, 
          'New Competitor': 15 // New competitor added
        },
        mentionCounts: { 
          'Test Brand': 8, 
          'Competitor A': 5, 
          'Competitor B': 4, 
          'New Competitor': 3 
        },
        totalMentions: 20,
        brandShare: 40,
        competitors: ['Competitor A', 'Competitor B', 'New Competitor']
      });
      await freshSOV.save();

      // 2. Get analysis - should return fresh SOV data
      const response = await request(app)
        .get(`/api/v1/super-user/analysis/${analysisId}`)
        .set('Authorization', `Bearer ${superUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // 3. Verify fresh SOV data is returned instead of cached data
      const analysisResults = response.body.analysis.analysisResults;
      
      expect(analysisResults.shareOfVoice['Test Brand']).toBe(40); // Updated from 50
      expect(analysisResults.shareOfVoice['New Competitor']).toBe(15); // New competitor
      expect(analysisResults.competitors).toContain('New Competitor');
      expect(analysisResults.brandShare).toBe(40); // Updated from 50
    });

    test('should fallback to cached data when fresh SOV data unavailable', async () => {
      // Don't create fresh SOV data - should use cached analysisResults
      
      const response = await request(app)
        .get(`/api/v1/super-user/analysis/${analysisId}`)
        .set('Authorization', `Bearer ${superUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Should use cached data from analysisResults
      const analysisResults = response.body.analysis.analysisResults;
      expect(analysisResults.shareOfVoice['Test Brand']).toBe(50); // Original cached value
      expect(analysisResults.competitors).toEqual(['Competitor A', 'Competitor B']);
      expect(analysisResults.brandShare).toBe(50);
    });

    test('should handle errors gracefully and continue with cached data', async () => {
      // Create invalid fresh SOV data to trigger error
      const invalidSOV = new BrandShareOfVoice({
        brandId: 'invalid-brand-id', // This will cause an error
        userId: 'test-user-id',
        shareOfVoice: null, // Invalid data
        mentionCounts: null
      });
      await invalidSOV.save();

      const response = await request(app)
        .get(`/api/v1/super-user/analysis/${analysisId}`)
        .set('Authorization', `Bearer ${superUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Should still return cached data despite error
      const analysisResults = response.body.analysis.analysisResults;
      expect(analysisResults.shareOfVoice['Test Brand']).toBe(50);
      expect(analysisResults.competitors).toEqual(['Competitor A', 'Competitor B']);
    });
  });
});