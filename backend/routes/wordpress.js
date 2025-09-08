const express = require('express');
const axios = require('axios');
const router = express.Router();
const { authenticationMiddleware: auth } = require('../middleware/auth');
const CMSCredentials = require('../models/CMSCredentials');
const cmsIntegration = require('../utils/cmsIntegration');

// Step 1: Save WordPress credentials (no OAuth needed - direct credential storage)
router.post('/connect', auth, async (req, res) => {
  try {
    const { siteUrl, username, applicationPassword } = req.body;
    const userId = req.user.id;
    
    if (!siteUrl || !username || !applicationPassword) {
      return res.status(400).json({ 
        error: 'Site URL, username, and application password are required' 
      });
    }
    
    // Clean and validate site URL
    let cleanSiteUrl = siteUrl.trim();
    if (!cleanSiteUrl.startsWith('http://') && !cleanSiteUrl.startsWith('https://')) {
      cleanSiteUrl = 'https://' + cleanSiteUrl;
    }
    
    // Remove trailing slash
    cleanSiteUrl = cleanSiteUrl.replace(/\/$/, '');
    
    console.log(`🔑 WordPress connection initiated for user: ${userId}`);
    console.log(`🌐 Site URL: ${cleanSiteUrl}`);
    console.log(`👤 Username: ${username}`);
    
    // Test the connection before saving
    const testResult = await cmsIntegration.testWordPressConnection({
      authDetails: {
        siteUrl: cleanSiteUrl,
        username: username,
        applicationPassword: applicationPassword
      }
    });
    
    if (!testResult.success) {
      return res.status(400).json({ 
        error: 'Failed to connect to WordPress site',
        details: testResult.error 
      });
    }
    
    // Save credentials to database
    const credentials = await CMSCredentials.findOneAndUpdate(
      { userId, platform: 'wordpress' },
      { 
        authDetails: {
          siteUrl: cleanSiteUrl,
          username: username,
          applicationPassword: applicationPassword
        },
        isActive: true 
      },
      { upsert: true, new: true, runValidators: true }
    );
    
    console.log(`✅ WordPress credentials saved for user ${userId} and site ${cleanSiteUrl}`);
    
    res.json({
      success: true,
      message: `Successfully connected to WordPress site: ${testResult.data?.siteName || cleanSiteUrl}`,
      data: {
        siteUrl: cleanSiteUrl,
        siteName: testResult.data?.siteName || 'WordPress Site',
        username: username,
        userEmail: testResult.data?.user?.email || null,
        userRoles: testResult.data?.user?.roles || [],
        platform: 'wordpress',
        isActive: true,
        connectedAt: credentials.createdAt,
        capabilities: testResult.data?.capabilities || {}
      }
    });
    
  } catch (error) {
    console.error('❌ Error saving WordPress credentials:', error);
    res.status(500).json({
      error: 'Failed to save WordPress credentials',
      details: error.message
    });
  }
});

// Step 2: Test WordPress connection
router.post('/test-connection', auth, async (req, res) => {
  try {
    const { siteUrl, username, applicationPassword } = req.body;
    
    if (!siteUrl || !username || !applicationPassword) {
      return res.status(400).json({ 
        error: 'Site URL, username, and application password are required' 
      });
    }
    
    console.log(`🔍 Testing WordPress connection for site: ${siteUrl}`);
    
    const testResult = await cmsIntegration.testWordPressConnection({
      authDetails: {
        siteUrl: siteUrl.replace(/\/$/, ''),
        username: username,
        applicationPassword: applicationPassword
      }
    });
    
    res.json({
      success: testResult.success,
      message: testResult.message,
      data: testResult.data || {},
      error: testResult.error
    });
    
  } catch (error) {
    console.error('❌ Error testing WordPress connection:', error);
    res.status(500).json({
      error: 'Failed to test WordPress connection',
      details: error.message
    });
  }
});

// Step 3: Publish content to WordPress
router.post('/publish', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, keywords, targetAudience, status = 'publish', categories = [], tags = [] } = req.body;
    
    // Get user's WordPress credentials
    const credentials = await CMSCredentials.findOne({ 
      userId, 
      platform: 'wordpress', 
      isActive: true 
    });
    
    if (!credentials) {
      return res.status(401).json({ 
        error: 'Not connected to WordPress. Please connect your site first.' 
      });
    }

    console.log(`📝 Publishing article to WordPress site: ${credentials.authDetails.siteUrl}`);
    console.log('📄 Content being published:', {
      title: title,
      contentLength: content ? content.length : 0,
      contentPreview: content ? content.substring(0, 200) + '...' : 'NO CONTENT',
      keywords: keywords,
      targetAudience: targetAudience,
      status: status,
      categories: categories,
      tags: tags
    });
    
    // Validate required content
    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required'
      });
    }
    
    // Use existing CMS integration service
    const publishResult = await cmsIntegration.publishContent('wordpress', credentials, {
      title,
      description: content,
      keywords: keywords || [],
      targetAudience: targetAudience || 'General Audience',
      status: status,
      categories: categories,
      tags: tags
    });
    
    if (!publishResult.success) {
      return res.status(500).json({
        error: 'Failed to publish to WordPress',
        details: publishResult.error
      });
    }

    res.json({
      success: true,
      message: publishResult.message,
      data: {
        postId: publishResult.postId,
        url: publishResult.url,
        platform: 'wordpress',
        siteUrl: credentials.authDetails.siteUrl,
        status: status
      }
    });

  } catch (error) {
    console.error('❌ Error publishing to WordPress:', error);
    
    res.status(500).json({
      error: 'Failed to publish to WordPress',
      details: error.message
    });
  }
});

// Get connection status
router.get('/status', auth, async (req, res) => {
  try {
    console.log('🔍 WordPress status check for user:', req.user.id);
    const userId = req.user.id;
    
    const credentials = await CMSCredentials.findOne({ 
      userId, 
      platform: 'wordpress', 
      isActive: true 
    });
    
    if (credentials) {
      res.json({
        status: 'connected',
        siteUrl: credentials.authDetails.siteUrl,
        username: credentials.authDetails.username,
        platform: 'wordpress',
        connectedAt: credentials.createdAt,
        features: ['posts', 'pages', 'categories', 'tags', 'media']
      });
    } else {
      res.json({
        status: 'disconnected',
        message: 'Not connected to WordPress. Add your site credentials to connect.'
      });
    }
  } catch (error) {
    console.error('❌ Error checking WordPress status:', error);
    res.status(500).json({
      error: 'Failed to check connection status',
      details: error.message
    });
  }
});

// Get WordPress site information (categories, tags, etc.)
router.get('/site-info', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's WordPress credentials
    const credentials = await CMSCredentials.findOne({ 
      userId, 
      platform: 'wordpress', 
      isActive: true 
    });
    
    if (!credentials) {
      return res.status(401).json({ 
        error: 'Not connected to WordPress. Please connect your site first.' 
      });
    }

    const { siteUrl, username, applicationPassword } = credentials.authDetails;
    const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
    
    try {
      // Fetch categories and tags in parallel
      const [categoriesResponse, tagsResponse, userResponse] = await Promise.all([
        axios.get(`${siteUrl}/wp-json/wp/v2/categories?per_page=100`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }),
        axios.get(`${siteUrl}/wp-json/wp/v2/tags?per_page=100`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }),
        axios.get(`${siteUrl}/wp-json/wp/v2/users/me`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          site: {
            url: siteUrl,
            user: userResponse.data
          },
          categories: categoriesResponse.data.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            count: cat.count
          })),
          tags: tagsResponse.data.map(tag => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            count: tag.count
          }))
        }
      });

    } catch (apiError) {
      console.error('❌ WordPress API error:', apiError.response?.data || apiError.message);
      res.status(400).json({
        error: 'Failed to fetch WordPress site information',
        details: apiError.response?.data?.message || apiError.message
      });
    }

  } catch (error) {
    console.error('❌ Error fetching WordPress site info:', error);
    res.status(500).json({
      error: 'Failed to fetch WordPress site information',
      details: error.message
    });
  }
});

// Disconnect WordPress site
router.delete('/disconnect', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await CMSCredentials.findOneAndDelete({ 
      userId, 
      platform: 'wordpress' 
    });
    
    if (result) {
      console.log(`✅ WordPress disconnected for user ${userId}`);
      res.json({
        success: true,
        message: 'Successfully disconnected from WordPress site'
      });
    } else {
      res.json({
        success: false,
        message: 'No WordPress connection found to disconnect'
      });
    }
  } catch (error) {
    console.error('❌ Error disconnecting WordPress:', error);
    res.status(500).json({
      error: 'Failed to disconnect WordPress site',
      details: error.message
    });
  }
});

// Debug endpoint to test WordPress REST API
router.get('/debug-api', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const credentials = await CMSCredentials.findOne({ userId, platform: 'wordpress', isActive: true });
    
    if (!credentials) {
      return res.status(401).json({ error: 'No WordPress connection found' });
    }

    const { siteUrl, username, applicationPassword } = credentials.authDetails;
    const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
    
    // Test basic API access
    const response = await axios.get(`${siteUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      message: 'WordPress API connection successful',
      data: {
        siteUrl: siteUrl,
        username: username,
        userInfo: response.data,
        apiEndpoints: [
          `${siteUrl}/wp-json/wp/v2/posts`,
          `${siteUrl}/wp-json/wp/v2/categories`,
          `${siteUrl}/wp-json/wp/v2/tags`
        ]
      }
    });

  } catch (error) {
    console.error('❌ WordPress API debug error:', error);
    res.status(500).json({
      error: 'WordPress API connection failed',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;