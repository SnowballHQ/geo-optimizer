const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();
const { authenticationMiddleware: auth } = require('../middleware/auth');
const CMSCredentials = require('../models/CMSCredentials');
const cmsIntegration = require('../utils/cmsIntegration');

// Apply auth middleware to all routes except callback (Shopify needs to access it)
// Note: We'll apply auth directly to each route instead of using router.use

// Step 1: Redirect user to Shopify OAuth authorization URL
router.get('/connect', auth, (req, res) => {
  const { shop } = req.query;
  const shopifyApiKey = process.env.SHOPIFY_API_KEY;
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  const userId = req.user.id;
  
  if (!shopifyApiKey) {
    console.error('❌ SHOPIFY_API_KEY environment variable is not set');
    return res.status(500).json({ 
      error: 'SHOPIFY_API_KEY environment variable not configured. Please check your .env file.',
      debug: {
        SHOPIFY_API_KEY: shopifyApiKey ? 'Set' : 'NOT SET',
        SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? 'Set' : 'NOT SET',
        APP_URL: process.env.APP_URL || 'Using default: http://localhost:5000'
      }
    });
  }

  console.log(`🔑 Shopify OAuth initiated for user: ${userId}`);
  console.log(`🌐 App URL: ${appUrl}`);

  // Required scopes for content management
  const scopes = 'read_content,write_content';
  
  // Generate state parameter for CSRF protection (user ID + random)
  const state = crypto.createHash('sha256').update(`${userId}-${Date.now()}-${Math.random()}`).digest('hex');
  
  if (shop) {
    // If shop parameter is provided, validate and redirect to specific shop
    if (!shop.includes('.myshopify.com')) {
      return res.status(400).json({ 
        error: 'Invalid shop domain. Must be in format: your-shop-name.myshopify.com' 
      });
    }
    
    // Build OAuth authorization URL for specific shop
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${shopifyApiKey}&scope=${scopes}&redirect_uri=${appUrl}/api/v1/shopify/callback&state=${state}&response_type=code`;
    
    console.log(`🔗 Providing Shopify OAuth URL for specific shop: ${shop}`);
    
    res.json({ authUrl });
  } else {
    // No shop parameter - redirect to Shopify's app installation page
    // This will let Shopify handle the shop selection automatically
    const appInstallUrl = `https://accounts.shopify.com/oauth/authorize?client_id=${shopifyApiKey}&scope=${scopes}&redirect_uri=${appUrl}/api/v1/shopify/callback&state=${state}&response_type=code`;
    
    console.log(`🔗 Providing Shopify app installation URL`);
    
    res.json({ authUrl: appInstallUrl });
  }
});

// Step 2: Handle Shopify OAuth callback
router.get('/callback', async (req, res) => {
  const { code, shop, state, hmac, timestamp } = req.query;
  
  if (!code || !shop || !state) {
    return res.status(400).json({ 
      error: 'Missing required OAuth parameters: code, shop, or state' 
    });
  }

  console.log(`🔄 Shopify OAuth callback received for shop: ${shop}`);
  console.log(`📝 Authorization code: ${code.substring(0, 10)}...`);
  
  // HMAC verification for security
  const shopifyApiSecret = process.env.SHOPIFY_API_SECRET;
  if (hmac && shopifyApiSecret) {
    const queryString = Object.keys(req.query)
      .filter(key => key !== 'hmac')
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&');
    
    const computedHmac = crypto
      .createHmac('sha256', shopifyApiSecret)
      .update(queryString)
      .digest('hex');
    
    if (computedHmac !== hmac) {
      console.error('❌ HMAC verification failed');
      return res.status(401).json({ error: 'HMAC verification failed' });
    }
    console.log('✅ HMAC verification successful');
  }

  try {
    const shopifyApiKey = process.env.SHOPIFY_API_KEY;
    const shopifyApiSecret = process.env.SHOPIFY_API_SECRET;
    
    if (!shopifyApiKey || !shopifyApiSecret) {
      throw new Error('SHOPIFY_API_KEY or SHOPIFY_API_SECRET environment variables not configured');
    }

    // Exchange authorization code for access token
    const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: shopifyApiKey,
      client_secret: shopifyApiSecret,
      code: code
    });

    const { access_token } = tokenResponse.data;
    
    if (!access_token) {
      throw new Error('No access token received from Shopify');
    }

    // Extract user ID from state (for now, we'll redirect to frontend to handle auth)
    console.log(`✅ Successfully obtained Shopify access token for shop: ${shop}`);
    console.log(`🔑 Access token: ${access_token.substring(0, 10)}...`);
    
    // Since this is a callback route without user context, we'll redirect to frontend
    // The frontend will need to make an authenticated request to save the credentials
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?shopify_success=1&shop=${encodeURIComponent(shop)}&access_token=${encodeURIComponent(access_token)}`;
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Error during Shopify OAuth callback:', error);
    
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?shopify_error=1&error=${encodeURIComponent(error.message)}`;
    res.redirect(redirectUrl);
  }
});

// Route to save Shopify credentials after OAuth (called by frontend)
router.post('/save-credentials', auth, async (req, res) => {
  try {
    const { shop, accessToken } = req.body;
    const userId = req.user.id;
    
    if (!shop || !accessToken) {
      return res.status(400).json({ error: 'Shop domain and access token are required' });
    }
    
    // Test the connection before saving
    const testResult = await cmsIntegration.testShopifyConnection({
      authDetails: {
        shopDomain: shop,
        accessToken: accessToken,
        apiVersion: '2024-10'
      }
    });
    
    if (!testResult.success) {
      return res.status(400).json({ 
        error: 'Failed to connect to Shopify store',
        details: testResult.error 
      });
    }
    
    // Save credentials to database
    const credentials = await CMSCredentials.findOneAndUpdate(
      { userId, platform: 'shopify' },
      { 
        authDetails: {
          shopDomain: shop,
          accessToken: accessToken,
          apiVersion: '2024-10'
        },
        isActive: true 
      },
      { upsert: true, new: true, runValidators: true }
    );
    
    console.log(`✅ Shopify credentials saved for user ${userId} and shop ${shop}`);
    
    res.json({
      success: true,
      message: `Successfully connected to Shopify store: ${shop}`,
      data: {
        shop: shop,
        platform: 'shopify',
        isActive: true,
        connectedAt: credentials.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error saving Shopify credentials:', error);
    res.status(500).json({
      error: 'Failed to save Shopify credentials',
      details: error.message
    });
  }
});

// Step 3: Publish content to Shopify
router.post('/publish', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, keywords, targetAudience } = req.body;
    
    // Get user's Shopify credentials
    const credentials = await CMSCredentials.findOne({ 
      userId, 
      platform: 'shopify', 
      isActive: true 
    });
    
    if (!credentials) {
      return res.status(401).json({ 
        error: 'Not connected to Shopify. Please connect your store first.' 
      });
    }

    console.log(`📝 Publishing article to Shopify shop: ${credentials.authDetails.shopDomain}`);
    console.log('📄 Content being published:', {
      title: title,
      contentLength: content ? content.length : 0,
      contentPreview: content ? content.substring(0, 200) + '...' : 'NO CONTENT',
      keywords: keywords,
      targetAudience: targetAudience
    });
    
    // Validate required content
    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required'
      });
    }
    
    // Use existing CMS integration service
    const publishResult = await cmsIntegration.publishContent('shopify', credentials, {
      title,
      description: content,
      keywords: keywords || [],
      targetAudience: targetAudience || 'General Audience'
    });
    
    if (!publishResult.success) {
      return res.status(500).json({
        error: 'Failed to publish to Shopify',
        details: publishResult.error
      });
    }

    res.json({
      success: true,
      message: publishResult.message,
      data: {
        postId: publishResult.postId,
        url: publishResult.url,
        platform: 'shopify',
        shop: credentials.authDetails.shopDomain
      }
    });

  } catch (error) {
    console.error('❌ Error publishing to Shopify:', error);
    
    res.status(500).json({
      error: 'Failed to publish to Shopify',
      details: error.message
    });
  }
});

// Get connection status
router.get('/status', auth, async (req, res) => {
  try {
    console.log('🔍 Shopify status check for user:', req.user.id);
    const userId = req.user.id;
    
    const credentials = await CMSCredentials.findOne({ 
      userId, 
      platform: 'shopify', 
      isActive: true 
    });
    
    if (credentials) {
      res.json({
        status: 'connected',
        shop: credentials.authDetails.shopDomain,
        platform: 'shopify',
        connectedAt: credentials.createdAt,
        scopes: 'read_content,write_content'
      });
    } else {
      res.json({
        status: 'disconnected',
        message: 'Not connected to Shopify. Complete OAuth flow to connect.'
      });
    }
  } catch (error) {
    console.error('❌ Error checking Shopify status:', error);
    res.status(500).json({
      error: 'Failed to check connection status',
      details: error.message
    });
  }
});

// Disconnect Shopify store
router.delete('/disconnect', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await CMSCredentials.findOneAndDelete({ 
      userId, 
      platform: 'shopify' 
    });
    
    if (result) {
      console.log(`✅ Shopify disconnected for user ${userId}`);
      res.json({
        success: true,
        message: 'Successfully disconnected from Shopify store'
      });
    } else {
      res.json({
        success: false,
        message: 'No Shopify connection found to disconnect'
      });
    }
  } catch (error) {
    console.error('❌ Error disconnecting Shopify:', error);
    res.status(500).json({
      error: 'Failed to disconnect Shopify store',
      details: error.message
    });
  }
});

// Debug endpoint to check environment variables
router.get('/debug-env', (req, res) => {
  res.json({
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY ? `${process.env.SHOPIFY_API_KEY.substring(0, 8)}...` : 'NOT SET',
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET ? 'Set (hidden for security)' : 'NOT SET',
    APP_URL: process.env.APP_URL || 'Using default: http://localhost:5000',
    NODE_ENV: process.env.NODE_ENV || 'Not set'
  });
});

module.exports = router;