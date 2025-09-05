const { google } = require('googleapis');
const User = require('../models/User');

class GoogleAnalyticsService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ANALYTICS_CLIENT_ID,
      process.env.GOOGLE_ANALYTICS_CLIENT_SECRET,
      process.env.GOOGLE_ANALYTICS_REDIRECT_URI
    );
  }

  // Setup OAuth client with user tokens
  async setupAuthClient(userId) {
    const user = await User.findById(userId);
    
    if (!user?.googleAnalytics?.accessToken) {
      throw new Error('Google Analytics not connected');
    }

    // Check if token is expired and refresh if needed
    const now = new Date();
    const tokenExpiry = new Date(user.googleAnalytics.tokenExpiresAt);
    
    if (now >= tokenExpiry && user.googleAnalytics.refreshToken) {
      await this.refreshToken(userId);
      // Fetch updated user data
      const updatedUser = await User.findById(userId);
      this.oauth2Client.setCredentials({
        access_token: updatedUser.googleAnalytics.accessToken,
        refresh_token: updatedUser.googleAnalytics.refreshToken
      });
    } else {
      this.oauth2Client.setCredentials({
        access_token: user.googleAnalytics.accessToken,
        refresh_token: user.googleAnalytics.refreshToken
      });
    }

    return {
      propertyId: user.googleAnalytics.propertyId,
      searchConsoleUrl: user.googleAnalytics.searchConsoleUrl
    };
  }

  // Refresh expired token
  async refreshToken(userId) {
    try {
      const user = await User.findById(userId);
      
      this.oauth2Client.setCredentials({
        refresh_token: user.googleAnalytics.refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update user with new tokens
      user.googleAnalytics.accessToken = credentials.access_token;
      if (credentials.refresh_token) {
        user.googleAnalytics.refreshToken = credentials.refresh_token;
      }
      user.googleAnalytics.tokenExpiresAt = new Date(credentials.expiry_date);
      
      await user.save();
      
      console.log('Token refreshed successfully for user:', userId);
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh Google Analytics token');
    }
  }

  // Get GA4 Analytics data for last 28 days
  async getAnalyticsData(userId) {
    try {
      const { propertyId } = await this.setupAuthClient(userId);
      
      if (!propertyId) {
        throw new Error('Analytics property not configured');
      }

      const analyticsData = google.analyticsdata({ version: 'v1beta', auth: this.oauth2Client });

      // Get overview metrics
      const response = await analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [
            {
              startDate: '28daysAgo',
              endDate: 'today'
            }
          ],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' }
          ],
          dimensions: [
            { name: 'date' }
          ]
        }
      });

      return this.formatAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }

  // Get Search Console data for last 28 days
  async getSearchConsoleData(userId) {
    try {
      const { searchConsoleUrl } = await this.setupAuthClient(userId);
      
      if (!searchConsoleUrl) {
        throw new Error('Search Console URL not configured');
      }

      const searchConsole = google.searchconsole({ version: 'v1', auth: this.oauth2Client });

      const response = await searchConsole.searchanalytics.query({
        siteUrl: searchConsoleUrl,
        requestBody: {
          startDate: this.formatDate(new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)),
          endDate: this.formatDate(new Date()),
          dimensions: ['date'],
          aggregationType: 'byProperty'
        }
      });

      return this.formatSearchConsoleData(response.data);
    } catch (error) {
      console.error('Error fetching Search Console data:', error);
      throw error;
    }
  }

  // Get blog-specific performance data
  async getBlogPerformance(userId, blogUrls = []) {
    try {
      if (!blogUrls.length) {
        return [];
      }

      const { propertyId, searchConsoleUrl } = await this.setupAuthClient(userId);
      
      if (!propertyId || !searchConsoleUrl) {
        throw new Error('Analytics not fully configured');
      }

      const results = [];

      // Get GA4 data for each blog URL
      for (const blogUrl of blogUrls) {
        try {
          const analyticsData = google.analyticsdata({ version: 'v1beta', auth: this.oauth2Client });
          const searchConsole = google.searchconsole({ version: 'v1', auth: this.oauth2Client });

          // GA4 data for specific page
          const gaResponse = await analyticsData.properties.runReport({
            property: `properties/${propertyId}`,
            requestBody: {
              dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
              metrics: [
                { name: 'screenPageViews' },
                { name: 'activeUsers' },
                { name: 'averageSessionDuration' }
              ],
              dimensionFilter: {
                filter: {
                  fieldName: 'pagePath',
                  stringFilter: { 
                    value: new URL(blogUrl).pathname,
                    matchType: 'CONTAINS'
                  }
                }
              }
            }
          });

          // Search Console data for specific page
          const gscResponse = await searchConsole.searchanalytics.query({
            siteUrl: searchConsoleUrl,
            requestBody: {
              startDate: this.formatDate(new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)),
              endDate: this.formatDate(new Date()),
              dimensions: ['page'],
              dimensionFilterGroups: [{
                filters: [{
                  dimension: 'page',
                  operator: 'contains',
                  expression: new URL(blogUrl).pathname
                }]
              }]
            }
          });

          results.push({
            url: blogUrl,
            analytics: this.formatAnalyticsData(gaResponse.data),
            searchConsole: this.formatSearchConsoleData(gscResponse.data)
          });
        } catch (error) {
          console.warn(`Error fetching data for blog ${blogUrl}:`, error.message);
          results.push({
            url: blogUrl,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error fetching blog performance:', error);
      throw error;
    }
  }

  // Format GA4 data
  formatAnalyticsData(data) {
    if (!data.rows || !data.rows.length) {
      return {
        totalUsers: 0,
        totalSessions: 0,
        totalPageViews: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        dailyData: []
      };
    }

    const totals = data.rows.reduce((acc, row) => {
      const metrics = row.metricValues;
      return {
        totalUsers: acc.totalUsers + parseInt(metrics[0]?.value || 0),
        totalSessions: acc.totalSessions + parseInt(metrics[1]?.value || 0),
        totalPageViews: acc.totalPageViews + parseInt(metrics[2]?.value || 0),
        bounceRate: acc.bounceRate + parseFloat(metrics[3]?.value || 0),
        avgSessionDuration: acc.avgSessionDuration + parseFloat(metrics[4]?.value || 0)
      };
    }, { totalUsers: 0, totalSessions: 0, totalPageViews: 0, bounceRate: 0, avgSessionDuration: 0 });

    const dailyData = data.rows.map(row => ({
      date: row.dimensionValues[0]?.value,
      users: parseInt(row.metricValues[0]?.value || 0),
      sessions: parseInt(row.metricValues[1]?.value || 0),
      pageViews: parseInt(row.metricValues[2]?.value || 0)
    }));

    return {
      ...totals,
      bounceRate: totals.bounceRate / data.rows.length,
      avgSessionDuration: totals.avgSessionDuration / data.rows.length,
      dailyData
    };
  }

  // Format Search Console data
  formatSearchConsoleData(data) {
    if (!data.rows || !data.rows.length) {
      return {
        totalClicks: 0,
        totalImpressions: 0,
        avgCTR: 0,
        avgPosition: 0,
        dailyData: []
      };
    }

    const totals = data.rows.reduce((acc, row) => ({
      totalClicks: acc.totalClicks + (row.clicks || 0),
      totalImpressions: acc.totalImpressions + (row.impressions || 0),
      avgCTR: acc.avgCTR + (row.ctr || 0),
      avgPosition: acc.avgPosition + (row.position || 0)
    }), { totalClicks: 0, totalImpressions: 0, avgCTR: 0, avgPosition: 0 });

    return {
      ...totals,
      avgCTR: totals.avgCTR / data.rows.length,
      avgPosition: totals.avgPosition / data.rows.length,
      dailyData: data.rows.map(row => ({
        date: row.keys?.[0],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0
      }))
    };
  }

  // Helper function to format date for Search Console API
  formatDate(date) {
    return date.toISOString().split('T')[0];
  }
}

module.exports = new GoogleAnalyticsService();