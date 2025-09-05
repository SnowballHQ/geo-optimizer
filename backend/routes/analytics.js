const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const User = require('../models/User');
const { authenticationMiddleware: auth } = require('../middleware/auth');
const googleAnalyticsService = require('../utils/googleAnalytics');
const ContentCalendar = require('../models/ContentCalendar');

// Google OAuth client setup
const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_ANALYTICS_CLIENT_ID,
    process.env.GOOGLE_ANALYTICS_CLIENT_SECRET,
    process.env.GOOGLE_ANALYTICS_REDIRECT_URI
  );
};

// GET /api/v1/analytics/auth/google - Initiate Google OAuth
router.get('/auth/google', auth, async (req, res) => {
  try {
    console.log('Google Analytics credentials check:');
    console.log('CLIENT_ID:', process.env.GOOGLE_ANALYTICS_CLIENT_ID ? 'Set' : 'Missing');
    console.log('CLIENT_SECRET:', process.env.GOOGLE_ANALYTICS_CLIENT_SECRET ? 'Set' : 'Missing');
    console.log('REDIRECT_URI:', process.env.GOOGLE_ANALYTICS_REDIRECT_URI);
    console.log('Authenticated user:', req.user);
    
    const oauth2Client = getOAuthClient();
    
    // Set state parameter to identify the user after callback
    const userId = req.user.id || req.user._id;
    const state = userId.toString(); // Convert ObjectId to string
    console.log('User ID for state parameter:', userId);
    console.log('State parameter (string):', state);
    console.log('Available user properties:', Object.keys(req.user));
    
    if (!state) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID not found in authentication context' 
      });
    }
    
    const scopes = [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters.readonly'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent' // Force consent to get refresh token
    });

    console.log('Generated OAuth URL:', url);
    console.log('Redirect URI being used:', process.env.GOOGLE_ANALYTICS_REDIRECT_URI);

    res.json({ 
      success: true, 
      authUrl: url 
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate authentication URL' 
    });
  }
});

// GET /api/v1/analytics/auth/google/callback - Handle OAuth callback
router.get('/auth/google/callback', async (req, res) => {
  try {
    console.log('OAuth callback received with query params:', req.query);
    console.log('Full request URL:', req.url);
    console.log('Request headers:', req.headers);
    
    const { code, state: userId } = req.query;
    
    console.log('Extracted params - code:', code ? 'Present' : 'Missing', 'userId:', userId);
    
    if (!code) {
      console.error('Missing authorization code');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing authorization code from Google OAuth',
        debug: { receivedParams: req.query }
      });
    }
    
    if (!userId) {
      console.error('Missing user ID from state parameter');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing user ID - state parameter not received',
        debug: { receivedParams: req.query }
      });
    }

    const oauth2Client = getOAuthClient();
    
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Update user with tokens
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    user.googleAnalytics = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: new Date(tokens.expiry_date),
      connectedAt: new Date()
    };

    await user.save();

    // Close popup window and notify parent window of success
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              // Notify parent window of successful authentication
              window.opener.postMessage({ type: 'GOOGLE_ANALYTICS_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              // Fallback: redirect if not in popup
              window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:5173'}?analytics=connected';
            }
          </script>
          <p>Authentication successful! This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?analytics=error`);
  }
});

// GET /api/v1/analytics/properties - Get user's GA4 properties
router.get('/properties', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.googleAnalytics?.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Google Analytics not connected' 
      });
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
      access_token: user.googleAnalytics.accessToken,
      refresh_token: user.googleAnalytics.refreshToken
    });

    // Get GA4 properties
    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client });
    
    // First, get all accounts the user has access to
    const accountsResponse = await analyticsAdmin.accounts.list();
    const accounts = accountsResponse.data.accounts || [];
    
    if (accounts.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        message: 'No Google Analytics accounts found for this user' 
      });
    }
    
    // Get properties from all accounts (or just the first one for now)
    const allProperties = [];
    for (const account of accounts) {
      // Extract account ID from "accounts/123456789" format
      const accountId = account.name.split('/')[1];
      
      try {
        const propertiesResponse = await analyticsAdmin.properties.list({
          filter: `parent:accounts/${accountId}`
        });
        
        const accountProperties = propertiesResponse.data.properties?.map(property => ({
          id: property.name.split('/')[1], // Extract property ID from name
          displayName: property.displayName,
          websiteUrl: property.websiteUrl,
          accountName: account.displayName,
          accountId: accountId
        })) || [];
        
        allProperties.push(...accountProperties);
      } catch (propertyError) {
        console.warn(`Failed to fetch properties for account ${accountId}:`, propertyError.message);
        // Continue with other accounts instead of failing completely
      }
    }

    const properties = allProperties;

    res.json({ 
      success: true, 
      data: properties 
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Analytics properties' 
    });
  }
});

// GET /api/v1/analytics/search-console-sites - Get user's Search Console sites
router.get('/search-console-sites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.googleAnalytics?.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Google Analytics not connected' 
      });
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
      access_token: user.googleAnalytics.accessToken,
      refresh_token: user.googleAnalytics.refreshToken
    });

    // Get Search Console sites
    const searchConsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
    const sitesResponse = await searchConsole.sites.list();

    const sites = sitesResponse.data.siteEntry?.map(site => ({
      siteUrl: site.siteUrl,
      permissionLevel: site.permissionLevel
    })) || [];

    res.json({ 
      success: true, 
      data: sites 
    });
  } catch (error) {
    console.error('Error fetching Search Console sites:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Search Console sites' 
    });
  }
});

// POST /api/v1/analytics/configure - Save user's selected property and site
router.post('/configure', auth, async (req, res) => {
  try {
    const { propertyId, searchConsoleUrl } = req.body;
    
    if (!propertyId || !searchConsoleUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Property ID and Search Console URL are required' 
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user.googleAnalytics?.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Google Analytics not connected' 
      });
    }

    user.googleAnalytics.propertyId = propertyId;
    user.googleAnalytics.searchConsoleUrl = searchConsoleUrl;
    
    await user.save();

    res.json({ 
      success: true, 
      message: 'Analytics configuration saved successfully' 
    });
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save configuration' 
    });
  }
});

// GET /api/v1/analytics/status - Check connection status
router.get('/status', auth, async (req, res) => {
  try {
    console.log('Status check - User ID:', req.user.id);
    const user = await User.findById(req.user.id);
    console.log('Status check - User found:', !!user);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const isConnected = !!(user.googleAnalytics?.accessToken && 
                           user.googleAnalytics?.propertyId && 
                           user.googleAnalytics?.searchConsoleUrl);
    
    res.json({ 
      success: true, 
      data: {
        isConnected,
        connectedAt: user.googleAnalytics?.connectedAt,
        propertyId: user.googleAnalytics?.propertyId,
        searchConsoleUrl: user.googleAnalytics?.searchConsoleUrl
      }
    });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check status' 
    });
  }
});

// GET /api/v1/analytics/overview - Get website overview analytics
router.get('/overview', auth, async (req, res) => {
  try {
    console.log('Fetching analytics overview for user:', req.user.id);
    
    const [analyticsData, searchConsoleData] = await Promise.all([
      googleAnalyticsService.getAnalyticsData(req.user.id),
      googleAnalyticsService.getSearchConsoleData(req.user.id)
    ]);

    console.log('Analytics data received:', JSON.stringify(analyticsData, null, 2));
    console.log('Search Console data received:', JSON.stringify(searchConsoleData, null, 2));

    res.json({ 
      success: true, 
      data: {
        analytics: analyticsData,
        searchConsole: searchConsoleData
      }
    });
  } catch (error) {
    console.error('Error fetching overview data:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch analytics overview' 
    });
  }
});

// GET /api/v1/analytics/blog-performance - Get published blog performance
router.get('/blog-performance', auth, async (req, res) => {
  try {
    // For now, return empty data since we need to implement URL tracking
    // TODO: Update ContentCalendar model to store published URLs after CMS publishing
    res.json({ 
      success: true, 
      data: [],
      message: 'Blog performance tracking will be available once published content URLs are stored'
    });
  } catch (error) {
    console.error('Error fetching blog performance:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch blog performance data' 
    });
  }
});

// GET /api/v1/analytics/top-pages - Get top performing pages
router.get('/top-pages', auth, async (req, res) => {
  try {
    const topPages = await googleAnalyticsService.getTopPages(req.user.id);
    
    res.json({ 
      success: true, 
      data: topPages 
    });
  } catch (error) {
    console.error('Error fetching top pages:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch top pages' 
    });
  }
});

// GET /api/v1/analytics/top-queries - Get top search queries
router.get('/top-queries', auth, async (req, res) => {
  try {
    const topQueries = await googleAnalyticsService.getTopQueries(req.user.id);
    
    res.json({ 
      success: true, 
      data: topQueries 
    });
  } catch (error) {
    console.error('Error fetching top queries:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch top queries' 
    });
  }
});

// GET /api/v1/analytics/traffic-by-country - Get traffic by country
router.get('/traffic-by-country', auth, async (req, res) => {
  try {
    const trafficByCountry = await googleAnalyticsService.getTrafficByCountry(req.user.id);
    
    res.json({ 
      success: true, 
      data: trafficByCountry 
    });
  } catch (error) {
    console.error('Error fetching traffic by country:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch traffic by country' 
    });
  }
});

// GET /api/v1/analytics/device-breakdown - Get device performance
router.get('/device-breakdown', auth, async (req, res) => {
  try {
    const deviceBreakdown = await googleAnalyticsService.getDeviceBreakdown(req.user.id);
    
    res.json({ 
      success: true, 
      data: deviceBreakdown 
    });
  } catch (error) {
    console.error('Error fetching device breakdown:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch device breakdown' 
    });
  }
});

// GET /api/v1/analytics/query-page-matrix - Get query-page performance matrix
router.get('/query-page-matrix', auth, async (req, res) => {
  try {
    const queryPageMatrix = await googleAnalyticsService.getQueryPageMatrix(req.user.id);
    
    res.json({ 
      success: true, 
      data: queryPageMatrix 
    });
  } catch (error) {
    console.error('Error fetching query-page matrix:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch query-page matrix' 
    });
  }
});

// GET /api/v1/analytics/keyword-trends - Get keyword trends over time
router.get('/keyword-trends', auth, async (req, res) => {
  try {
    const keywordTrends = await googleAnalyticsService.getKeywordTrends(req.user.id);
    
    res.json({ 
      success: true, 
      data: keywordTrends 
    });
  } catch (error) {
    console.error('Error fetching keyword trends:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch keyword trends' 
    });
  }
});

// GET /api/v1/analytics/search-appearance - Get search appearance types
router.get('/search-appearance', auth, async (req, res) => {
  try {
    const searchAppearance = await googleAnalyticsService.getSearchAppearanceTypes(req.user.id);
    
    res.json({ 
      success: true, 
      data: searchAppearance 
    });
  } catch (error) {
    console.error('Error fetching search appearance types:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch search appearance types' 
    });
  }
});

// GET /api/v1/analytics/performance-comparison - Get performance comparison
router.get('/performance-comparison', auth, async (req, res) => {
  try {
    const performanceComparison = await googleAnalyticsService.getPerformanceComparison(req.user.id);
    
    res.json({ 
      success: true, 
      data: performanceComparison 
    });
  } catch (error) {
    console.error('Error fetching performance comparison:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch performance comparison' 
    });
  }
});

// GET /api/v1/analytics/low-hanging-fruit - Get optimization opportunities
router.get('/low-hanging-fruit', auth, async (req, res) => {
  try {
    const opportunities = await googleAnalyticsService.getLowHangingFruit(req.user.id);
    
    res.json({ 
      success: true, 
      data: opportunities 
    });
  } catch (error) {
    console.error('Error fetching optimization opportunities:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch optimization opportunities' 
    });
  }
});

// DELETE /api/v1/analytics/disconnect - Disconnect Google Analytics
router.delete('/disconnect', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.googleAnalytics = {
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      propertyId: null,
      searchConsoleUrl: null,
      connectedAt: null
    };
    
    await user.save();

    res.json({ 
      success: true, 
      message: 'Google Analytics disconnected successfully' 
    });
  } catch (error) {
    console.error('Error disconnecting analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to disconnect Google Analytics' 
    });
  }
});

module.exports = router;