const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();
const { authenticationMiddleware: auth } = require('../middleware/auth');
const CMSCredentials = require('../models/CMSCredentials');
const cmsIntegration = require('../utils/cmsIntegration');

// Step 1: Redirect user to Webflow OAuth authorization URL
router.get('/connect', auth, (req, res) => {
  const webflowClientId = process.env.WEBFLOW_CLIENT_ID;
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  const userId = req.user.id;
  
  if (!webflowClientId) {
    console.error('❌ WEBFLOW_CLIENT_ID environment variable is not set');
    return res.status(500).json({ 
      error: 'WEBFLOW_CLIENT_ID environment variable not configured. Please check your .env file.',
      debug: {
        WEBFLOW_CLIENT_ID: webflowClientId ? 'Set' : 'NOT SET',
        WEBFLOW_CLIENT_SECRET: process.env.WEBFLOW_CLIENT_SECRET ? 'Set' : 'NOT SET',
        APP_URL: process.env.APP_URL || 'Using default: http://localhost:5000'
      }
    });
  }

  console.log(`🔑 Webflow OAuth initiated for user: ${userId}`);
  console.log(`🌐 App URL: ${appUrl}`);

  // Required scopes for content management
  const scopes = 'sites:read sites:write cms:read cms:write';
  
  // Generate state parameter for CSRF protection (user ID + random)
  const state = crypto.createHash('sha256').update(`${userId}-${Date.now()}-${Math.random()}`).digest('hex');
  
  // Build OAuth authorization URL
  const authUrl = `https://webflow.com/oauth/authorize?response_type=code&client_id=${webflowClientId}&redirect_uri=${encodeURIComponent(appUrl + '/api/v1/webflow/callback')}&scope=${encodeURIComponent(scopes)}&state=${state}`;
  
  console.log(`🔗 Providing Webflow OAuth URL`);
  
  res.json({ authUrl });
});

// Step 2: Handle Webflow OAuth callback
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('❌ Webflow OAuth error:', error);
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?webflow_error=1&error=${encodeURIComponent(error)}`;
    return res.redirect(redirectUrl);
  }
  
  if (!code || !state) {
    return res.status(400).json({ 
      error: 'Missing required OAuth parameters: code or state' 
    });
  }

  console.log(`🔄 Webflow OAuth callback received`);
  console.log(`📝 Authorization code: ${code.substring(0, 10)}...`);
  
  try {
    const webflowClientId = process.env.WEBFLOW_CLIENT_ID;
    const webflowClientSecret = process.env.WEBFLOW_CLIENT_SECRET;
    
    if (!webflowClientId || !webflowClientSecret) {
      throw new Error('WEBFLOW_CLIENT_ID or WEBFLOW_CLIENT_SECRET environment variables not configured');
    }

    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://api.webflow.com/oauth/access_token', {
      client_id: webflowClientId,
      client_secret: webflowClientSecret,
      code: code,
      redirect_uri: `${process.env.APP_URL || 'http://localhost:5000'}/api/v1/webflow/callback`,
      grant_type: 'authorization_code'
    });

    const { access_token, user } = tokenResponse.data;
    
    if (!access_token) {
      throw new Error('No access token received from Webflow');
    }

    console.log(`✅ Successfully obtained Webflow access token`);
    console.log(`🔑 Access token: ${access_token.substring(0, 10)}...`);
    console.log(`👤 User info:`, user);
    
    // Redirect to frontend with success parameters
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?webflow_success=1&access_token=${encodeURIComponent(access_token)}&user_id=${encodeURIComponent(user?.id || 'unknown')}&user_email=${encodeURIComponent(user?.email || 'unknown')}`;
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Error during Webflow OAuth callback:', error);
    
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?webflow_error=1&error=${encodeURIComponent(error.message)}`;
    res.redirect(redirectUrl);
  }
});

// Route to save Webflow credentials after OAuth (called by frontend)
router.post('/save-credentials', auth, async (req, res) => {
  try {
    const { accessToken, userId: webflowUserId, userEmail } = req.body;
    const userId = req.user.id;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    // Test the connection before saving
    const testResult = await cmsIntegration.testWebflowConnection({
      authDetails: {
        accessToken: accessToken,
        apiVersion: '2.0.0'
      }
    });
    
    if (!testResult.success) {
      return res.status(400).json({ 
        error: 'Failed to connect to Webflow',
        details: testResult.error 
      });
    }
    
    // Save credentials to database
    const credentials = await CMSCredentials.findOneAndUpdate(
      { userId, platform: 'webflow' },
      { 
        authDetails: {
          accessToken: accessToken,
          webflowUserId: webflowUserId || 'unknown',
          userEmail: userEmail || 'unknown',
          apiVersion: '2.0.0'
        },
        isActive: true 
      },
      { upsert: true, new: true, runValidators: true }
    );
    
    console.log(`✅ Webflow credentials saved for user ${userId}`);
    
    res.json({
      success: true,
      message: `Successfully connected to Webflow account: ${userEmail || 'Unknown'}`,
      data: {
        userEmail: userEmail || 'Unknown',
        platform: 'webflow',
        isActive: true,
        connectedAt: credentials.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error saving Webflow credentials:', error);
    res.status(500).json({
      error: 'Failed to save Webflow credentials',
      details: error.message
    });
  }
});

// Step 3: Publish content to Webflow
router.post('/publish', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, keywords, targetAudience, siteId } = req.body;
    
    // Get user's Webflow credentials
    const credentials = await CMSCredentials.findOne({ 
      userId, 
      platform: 'webflow', 
      isActive: true 
    });
    
    if (!credentials) {
      return res.status(401).json({ 
        error: 'Not connected to Webflow. Please connect your account first.' 
      });
    }

    console.log(`📝 Publishing article to Webflow`);
    console.log('📄 Content being published:', {
      title: title,
      contentLength: content ? content.length : 0,
      contentPreview: content ? content.substring(0, 200) + '...' : 'NO CONTENT',
      keywords: keywords,
      targetAudience: targetAudience,
      siteId: siteId
    });
    
    // Validate required content
    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required'
      });
    }
    
    // Use existing CMS integration service
    const publishResult = await cmsIntegration.publishContent('webflow', credentials, {
      title,
      description: content,
      keywords: keywords || [],
      targetAudience: targetAudience || 'General Audience',
      siteId: siteId
    });
    
    if (!publishResult.success) {
      return res.status(500).json({
        error: 'Failed to publish to Webflow',
        details: publishResult.error
      });
    }

    res.json({
      success: true,
      message: publishResult.message,
      data: {
        postId: publishResult.postId,
        url: publishResult.url,
        platform: 'webflow',
        userEmail: credentials.authDetails.userEmail
      }
    });

  } catch (error) {
    console.error('❌ Error publishing to Webflow:', error);
    
    res.status(500).json({
      error: 'Failed to publish to Webflow',
      details: error.message
    });
  }
});

// Get connection status
router.get('/status', auth, async (req, res) => {
  try {
    console.log('🔍 Webflow status check for user:', req.user.id);
    const userId = req.user.id;
    
    const credentials = await CMSCredentials.findOne({ 
      userId, 
      platform: 'webflow', 
      isActive: true 
    });
    
    if (credentials) {
      res.json({
        status: 'connected',
        userEmail: credentials.authDetails.userEmail,
        webflowUserId: credentials.authDetails.webflowUserId,
        platform: 'webflow',
        connectedAt: credentials.createdAt,
        scopes: 'sites:read,sites:write,cms:read,cms:write'
      });
    } else {
      res.json({
        status: 'disconnected',
        message: 'Not connected to Webflow. Complete OAuth flow to connect.'
      });
    }
  } catch (error) {
    console.error('❌ Error checking Webflow status:', error);
    res.status(500).json({
      error: 'Failed to check connection status',
      details: error.message
    });
  }
});

// Disconnect Webflow account
router.delete('/disconnect', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await CMSCredentials.findOneAndDelete({ 
      userId, 
      platform: 'webflow' 
    });
    
    if (result) {
      console.log(`✅ Webflow disconnected for user ${userId}`);
      res.json({
        success: true,
        message: 'Successfully disconnected from Webflow account'
      });
    } else {
      res.json({
        success: false,
        message: 'No Webflow connection found to disconnect'
      });
    }
  } catch (error) {
    console.error('❌ Error disconnecting Webflow:', error);
    res.status(500).json({
      error: 'Failed to disconnect Webflow account',
      details: error.message
    });
  }
});

// Get user's Webflow sites
router.get('/sites', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's Webflow credentials
    const credentials = await CMSCredentials.findOne({ 
      userId, 
      platform: 'webflow', 
      isActive: true 
    });
    
    if (!credentials) {
      return res.status(401).json({ 
        error: 'Not connected to Webflow. Please connect your account first.' 
      });
    }

    // Fetch sites from Webflow API
    const sitesResponse = await axios.get('https://api.webflow.com/v2/sites', {
      headers: {
        'Authorization': `Bearer ${credentials.authDetails.accessToken}`,
        'Accept': 'application/json'
      }
    });

    res.json({
      success: true,
      sites: sitesResponse.data.sites || []
    });

  } catch (error) {
    console.error('❌ Error fetching Webflow sites:', error);
    res.status(500).json({
      error: 'Failed to fetch Webflow sites',
      details: error.message
    });
  }
});

// Debug endpoint to check environment variables
router.get('/debug-env', (req, res) => {
  res.json({
    WEBFLOW_CLIENT_ID: process.env.WEBFLOW_CLIENT_ID ? `${process.env.WEBFLOW_CLIENT_ID.substring(0, 8)}...` : 'NOT SET',
    WEBFLOW_CLIENT_SECRET: process.env.WEBFLOW_CLIENT_SECRET ? 'Set (hidden for security)' : 'NOT SET',
    APP_URL: process.env.APP_URL || 'Using default: http://localhost:5000',
    NODE_ENV: process.env.NODE_ENV || 'Not set'
  });
});

module.exports = router;