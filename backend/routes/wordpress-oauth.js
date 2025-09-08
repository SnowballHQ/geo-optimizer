const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const { authenticationMiddleware: auth } = require('../middleware/auth');
const CMSCredentials = require('../models/CMSCredentials');
const cmsIntegration = require('../utils/cmsIntegration');

// WordPress.com OAuth Configuration
const WORDPRESS_CLIENT_ID = process.env.WORDPRESS_CLIENT_ID;
const WORDPRESS_CLIENT_SECRET = process.env.WORDPRESS_CLIENT_SECRET;
const WORDPRESS_REDIRECT_URI = process.env.WORDPRESS_REDIRECT_URI;
const WORDPRESS_AUTH_URL = 'https://public-api.wordpress.com/oauth2/authorize';
const WORDPRESS_TOKEN_URL = 'https://public-api.wordpress.com/oauth2/token';
const WORDPRESS_API_BASE = 'https://public-api.wordpress.com/rest/v1.1';

// Store for OAuth state validation (in production, use Redis or database)
const oauthStates = new Map();

// Step 1: Initiate WordPress.com OAuth flow
router.get('/connect', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!WORDPRESS_CLIENT_ID || !WORDPRESS_CLIENT_SECRET || !WORDPRESS_REDIRECT_URI) {
      return res.status(500).json({ 
        error: 'WordPress.com OAuth is not configured. Please set WORDPRESS_CLIENT_ID, WORDPRESS_CLIENT_SECRET, and WORDPRESS_REDIRECT_URI environment variables.' 
      });
    }
    
    // Generate secure state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    
    // Store state with user ID and timestamp (expires in 10 minutes)
    oauthStates.set(state, { userId, timestamp });
    
    // Clean up expired states (older than 10 minutes)
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    for (const [key, value] of oauthStates.entries()) {
      if (value.timestamp < tenMinutesAgo) {
        oauthStates.delete(key);
      }
    }
    
    // Build WordPress.com OAuth authorization URL
    const authUrl = new URL(WORDPRESS_AUTH_URL);
    authUrl.searchParams.append('client_id', WORDPRESS_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', WORDPRESS_REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'posts media sites users');
    authUrl.searchParams.append('state', state);
    
    console.log(`🔗 WordPress OAuth: Initiating OAuth flow for user ${userId}`);
    console.log(`🔗 Auth URL: ${authUrl.toString()}`);
    
    // Return OAuth URL as JSON (frontend will handle the redirect)
    res.json({ authUrl: authUrl.toString() });
    
  } catch (error) {
    console.error('❌ Error initiating WordPress OAuth:', error);
    res.status(500).json({
      error: 'Failed to initiate WordPress.com OAuth',
      details: error.message
    });
  }
});

// Step 2: Handle WordPress.com OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    // Handle OAuth errors
    if (error) {
      console.error('❌ WordPress OAuth error:', error);
      return res.redirect(`${process.env.APP_URL.replace(':5000', ':5174')}/?wordpress_error=1&error=${encodeURIComponent(error)}`);
    }
    
    // Validate required parameters
    if (!code || !state) {
      console.error('❌ WordPress OAuth: Missing code or state parameter');
      return res.redirect(`${process.env.APP_URL.replace(':5000', ':5174')}/?wordpress_error=1&error=missing_parameters`);
    }
    
    // Validate state parameter
    const stateData = oauthStates.get(state);
    if (!stateData) {
      console.error('❌ WordPress OAuth: Invalid or expired state parameter');
      return res.redirect(`${process.env.APP_URL.replace(':5000', ':5174')}/?wordpress_error=1&error=invalid_state`);
    }
    
    // Remove used state
    oauthStates.delete(state);
    
    const { userId } = stateData;
    console.log(`🔗 WordPress OAuth: Processing callback for user ${userId}`);
    
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(WORDPRESS_TOKEN_URL, {
      client_id: WORDPRESS_CLIENT_ID,
      client_secret: WORDPRESS_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: WORDPRESS_REDIRECT_URI
    });
    
    const { access_token, token_type, scope } = tokenResponse.data;
    
    if (!access_token) {
      throw new Error('No access token received from WordPress.com');
    }
    
    // Get user information from WordPress.com
    const userResponse = await axios.get(`${WORDPRESS_API_BASE}/me`, {
      headers: {
        'Authorization': `${token_type} ${access_token}`
      }
    });
    
    const userData = userResponse.data;
    
    // Get user's sites
    const sitesResponse = await axios.get(`${WORDPRESS_API_BASE}/me/sites`, {
      headers: {
        'Authorization': `${token_type} ${access_token}`
      }
    });
    
    const sitesData = sitesResponse.data;
    
    // Save WordPress OAuth credentials to database
    const credentials = await CMSCredentials.findOneAndUpdate(
      { userId, platform: 'wordpress' },
      { 
        authDetails: {
          accessToken: access_token,
          tokenType: token_type,
          scope: scope,
          userId: userData.ID,
          userLogin: userData.username,
          userEmail: userData.email,
          userDisplayName: userData.display_name,
          sites: sitesData.sites || []
        },
        isActive: true 
      },
      { upsert: true, new: true, runValidators: true }
    );
    
    console.log(`✅ WordPress OAuth: Successfully connected user ${userId} to WordPress.com account ${userData.username}`);
    
    // Redirect back to frontend with success
    res.redirect(`${process.env.APP_URL.replace(':5000', ':5174')}/?wordpress_success=1&user=${encodeURIComponent(userData.display_name)}`);
    
  } catch (error) {
    console.error('❌ WordPress OAuth callback error:', error);
    const errorMessage = error.response?.data?.error_description || error.message || 'OAuth callback failed';
    res.redirect(`${process.env.APP_URL.replace(':5000', ':5174')}/?wordpress_error=1&error=${encodeURIComponent(errorMessage)}`);
  }
});

// Step 3: Get connection status
router.get('/status', auth, async (req, res) => {
  try {
    console.log('🔍 WordPress OAuth status check for user:', req.user.id);
    const userId = req.user.id;
    
    const credentials = await CMSCredentials.findOne({ 
      userId, 
      platform: 'wordpress', 
      isActive: true 
    });
    
    if (credentials && credentials.authDetails.accessToken) {
      // Verify token is still valid by making a test API call
      try {
        const testResponse = await axios.get(`${WORDPRESS_API_BASE}/me`, {
          headers: {
            'Authorization': `${credentials.authDetails.tokenType} ${credentials.authDetails.accessToken}`
          }
        });
        
        res.json({
          status: 'connected',
          userLogin: credentials.authDetails.userLogin,
          userEmail: credentials.authDetails.userEmail,
          userDisplayName: credentials.authDetails.userDisplayName,
          sitesCount: credentials.authDetails.sites?.length || 0,
          sites: credentials.authDetails.sites || [],
          platform: 'wordpress',
          connectedAt: credentials.createdAt,
          scope: credentials.authDetails.scope
        });
      } catch (apiError) {
        // Token might be expired or invalid
        console.error('❌ WordPress OAuth token validation failed:', apiError.response?.status);
        res.json({
          status: 'token_expired',
          message: 'WordPress.com token has expired. Please reconnect.'
        });
      }
    } else {
      res.json({
        status: 'disconnected',
        message: 'Not connected to WordPress.com. Click Connect to authorize.'
      });
    }
  } catch (error) {
    console.error('❌ Error checking WordPress OAuth status:', error);
    res.status(500).json({
      error: 'Failed to check connection status',
      details: error.message
    });
  }
});

// Step 4: Publish content to WordPress.com
router.post('/publish', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, keywords, targetAudience, status = 'publish', siteId, categories = [], tags = [] } = req.body;
    
    // Get user's WordPress OAuth credentials
    const credentials = await CMSCredentials.findOne({ 
      userId, 
      platform: 'wordpress', 
      isActive: true 
    });
    
    if (!credentials || !credentials.authDetails.accessToken) {
      return res.status(401).json({ 
        error: 'Not connected to WordPress.com. Please connect your account first.' 
      });
    }

    console.log(`📝 Publishing article to WordPress.com for user: ${credentials.authDetails.userLogin}`);
    
    // Validate required content
    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required'
      });
    }
    
    // Use the first site if no specific site selected
    const targetSite = siteId || credentials.authDetails.sites[0]?.ID;
    if (!targetSite) {
      return res.status(400).json({
        error: 'No WordPress.com site available for publishing'
      });
    }
    
    // Prepare post data for WordPress.com API
    const postData = {
      title: title,
      content: content,
      status: status, // 'publish' or 'draft'
      format: 'standard',
      tags: [...(keywords || []), ...(tags || [])].join(','),
      categories: categories.join(',')
    };
    
    console.log('📄 WordPress.com post data:', {
      title: postData.title,
      contentLength: postData.content.length,
      status: postData.status,
      siteId: targetSite
    });
    
    // Publish to WordPress.com using their REST API
    const publishResponse = await axios.post(
      `${WORDPRESS_API_BASE}/sites/${targetSite}/posts/new`,
      postData,
      {
        headers: {
          'Authorization': `${credentials.authDetails.tokenType} ${credentials.authDetails.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const publishedPost = publishResponse.data;
    
    console.log(`✅ Successfully published to WordPress.com:`, publishedPost.ID);
    
    res.json({
      success: true,
      message: `Successfully published "${title}" to WordPress.com`,
      data: {
        postId: publishedPost.ID,
        url: publishedPost.URL,
        platform: 'wordpress',
        site: publishedPost.site_ID,
        status: publishedPost.status
      }
    });

  } catch (error) {
    console.error('❌ Error publishing to WordPress.com:', error);
    
    const errorMessage = error.response?.data?.message || error.message || 'Failed to publish to WordPress.com';
    res.status(500).json({
      error: 'Failed to publish to WordPress.com',
      details: errorMessage
    });
  }
});

// Step 5: Disconnect WordPress.com account
router.delete('/disconnect', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await CMSCredentials.findOneAndDelete({ 
      userId, 
      platform: 'wordpress' 
    });
    
    if (result) {
      console.log(`🔌 WordPress.com disconnected for user: ${userId}`);
      res.json({
        success: true,
        message: 'WordPress.com account disconnected successfully'
      });
    } else {
      res.json({
        success: true,
        message: 'No WordPress.com connection found to disconnect'
      });
    }
  } catch (error) {
    console.error('❌ Error disconnecting WordPress.com:', error);
    res.status(500).json({
      error: 'Failed to disconnect WordPress.com account',
      details: error.message
    });
  }
});

// Step 6: Get WordPress.com sites for user
router.get('/sites', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const credentials = await CMSCredentials.findOne({ 
      userId, 
      platform: 'wordpress', 
      isActive: true 
    });
    
    if (!credentials || !credentials.authDetails.accessToken) {
      return res.status(401).json({ 
        error: 'Not connected to WordPress.com' 
      });
    }
    
    // Fetch fresh sites data from WordPress.com
    const sitesResponse = await axios.get(`${WORDPRESS_API_BASE}/me/sites`, {
      headers: {
        'Authorization': `${credentials.authDetails.tokenType} ${credentials.authDetails.accessToken}`
      }
    });
    
    const sitesData = sitesResponse.data;
    
    res.json({
      success: true,
      sites: sitesData.sites || []
    });
    
  } catch (error) {
    console.error('❌ Error fetching WordPress.com sites:', error);
    res.status(500).json({
      error: 'Failed to fetch WordPress.com sites',
      details: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;