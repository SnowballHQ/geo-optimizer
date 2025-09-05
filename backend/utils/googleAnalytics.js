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

  // Get top performing pages
  async getTopPages(userId) {
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
          dimensions: ['page'],
          rowLimit: 10
        }
      });

      return this.formatPagesData(response.data);
    } catch (error) {
      console.error('Error fetching top pages:', error);
      throw error;
    }
  }

  // Get top search queries
  async getTopQueries(userId) {
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
          dimensions: ['query'],
          rowLimit: 10
        }
      });

      return this.formatQueriesData(response.data);
    } catch (error) {
      console.error('Error fetching top queries:', error);
      throw error;
    }
  }

  // Get traffic by country
  async getTrafficByCountry(userId) {
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
          dimensions: ['country'],
          rowLimit: 10
        }
      });

      return this.formatCountryData(response.data);
    } catch (error) {
      console.error('Error fetching traffic by country:', error);
      throw error;
    }
  }

  // Get device performance
  async getDeviceBreakdown(userId) {
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
          dimensions: ['device'],
          rowLimit: 10
        }
      });

      return this.formatDeviceData(response.data);
    } catch (error) {
      console.error('Error fetching device breakdown:', error);
      throw error;
    }
  }

  // Format top pages data
  formatPagesData(data) {
    if (!data.rows || !data.rows.length) {
      return [];
    }

    return data.rows.map(row => ({
      page: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      avgPosition: row.position || 0
    }));
  }

  // Format top queries data
  formatQueriesData(data) {
    if (!data.rows || !data.rows.length) {
      return [];
    }

    return data.rows.map(row => ({
      query: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      avgPosition: row.position || 0
    }));
  }

  // Format country data
  formatCountryData(data) {
    if (!data.rows || !data.rows.length) {
      return [];
    }

    const countryNames = {
      'usa': 'United States',
      'gbr': 'United Kingdom',
      'can': 'Canada',
      'aus': 'Australia',
      'deu': 'Germany',
      'fra': 'France',
      'ind': 'India',
      'chn': 'China',
      'jpn': 'Japan',
      'bra': 'Brazil'
    };

    return data.rows.map(row => ({
      country: countryNames[row.keys[0]] || row.keys[0].toUpperCase(),
      countryCode: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      avgPosition: row.position || 0
    }));
  }

  // Format device data
  formatDeviceData(data) {
    if (!data.rows || !data.rows.length) {
      return [];
    }

    return data.rows.map(row => ({
      device: row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      avgPosition: row.position || 0
    }));
  }

  // Get query-page performance matrix
  async getQueryPageMatrix(userId) {
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
          dimensions: ['query', 'page'],
          rowLimit: 50
        }
      });

      return this.formatQueryPageData(response.data);
    } catch (error) {
      console.error('Error fetching query-page matrix:', error);
      throw error;
    }
  }

  // Get keyword trends over time
  async getKeywordTrends(userId) {
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
          dimensions: ['date', 'query'],
          rowLimit: 100
        }
      });

      return this.formatKeywordTrendsData(response.data);
    } catch (error) {
      console.error('Error fetching keyword trends:', error);
      throw error;
    }
  }

  // Get search appearance types
  async getSearchAppearanceTypes(userId) {
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
          dimensions: ['searchAppearance'],
          rowLimit: 20
        }
      });

      return this.formatSearchAppearanceData(response.data);
    } catch (error) {
      console.error('Error fetching search appearance types:', error);
      throw error;
    }
  }

  // Get performance comparison (current vs previous period)
  async getPerformanceComparison(userId) {
    try {
      const { searchConsoleUrl } = await this.setupAuthClient(userId);
      
      if (!searchConsoleUrl) {
        throw new Error('Search Console URL not configured');
      }

      const searchConsole = google.searchconsole({ version: 'v1', auth: this.oauth2Client });

      // Current period (last 28 days)
      const currentResponse = await searchConsole.searchanalytics.query({
        siteUrl: searchConsoleUrl,
        requestBody: {
          startDate: this.formatDate(new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)),
          endDate: this.formatDate(new Date()),
          dimensions: ['date']
        }
      });

      // Previous period (28 days before that)
      const previousResponse = await searchConsole.searchanalytics.query({
        siteUrl: searchConsoleUrl,
        requestBody: {
          startDate: this.formatDate(new Date(Date.now() - 56 * 24 * 60 * 60 * 1000)),
          endDate: this.formatDate(new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)),
          dimensions: ['date']
        }
      });

      return this.formatComparisonData(currentResponse.data, previousResponse.data);
    } catch (error) {
      console.error('Error fetching performance comparison:', error);
      throw error;
    }
  }

  // Get high-opportunity keywords (position 4-10)
  async getLowHangingFruit(userId) {
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
          dimensions: ['query'],
          dimensionFilterGroups: [{
            filters: [{
              dimension: 'query',
              operator: 'notContains',
              expression: '(not set)'
            }]
          }],
          rowLimit: 50
        }
      });

      // Filter for positions 4-10 (low-hanging fruit)
      const opportunities = response.data.rows?.filter(row => 
        row.position >= 4 && row.position <= 10 && row.impressions >= 10
      ) || [];

      return opportunities.map(row => ({
        query: row.keys[0],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        avgPosition: row.position || 0,
        opportunity: 'Position 4-10 with good impressions'
      }));
    } catch (error) {
      console.error('Error fetching low-hanging fruit:', error);
      throw error;
    }
  }

  // Format query-page matrix data
  formatQueryPageData(data) {
    if (!data.rows || !data.rows.length) {
      return [];
    }

    return data.rows.map(row => ({
      query: row.keys[0],
      page: row.keys[1],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      avgPosition: row.position || 0
    }));
  }

  // Format keyword trends data  
  formatKeywordTrendsData(data) {
    if (!data.rows || !data.rows.length) {
      return [];
    }

    const trendsMap = {};
    
    data.rows.forEach(row => {
      const date = row.keys[0];
      const query = row.keys[1];
      
      if (!trendsMap[query]) {
        trendsMap[query] = {
          query,
          totalClicks: 0,
          totalImpressions: 0,
          dailyData: []
        };
      }
      
      trendsMap[query].totalClicks += row.clicks || 0;
      trendsMap[query].totalImpressions += row.impressions || 0;
      trendsMap[query].dailyData.push({
        date,
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0
      });
    });

    return Object.values(trendsMap)
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, 10);
  }

  // Format search appearance data
  formatSearchAppearanceData(data) {
    if (!data.rows || !data.rows.length) {
      return [];
    }

    const appearanceNames = {
      'AMP_BLUE_LINK': 'AMP Results',
      'AMP_TOP_STORIES': 'AMP Top Stories', 
      'JOBS_DETAILS': 'Job Listings',
      'JOBS_LISTING': 'Job Search',
      'MERCHANT_LISTINGS': 'Shopping Results',
      'ORGANIC': 'Regular Results',
      'RICH_SNIPPET': 'Rich Snippets',
      'TOP_STORIES': 'Top Stories'
    };

    return data.rows.map(row => ({
      appearanceType: appearanceNames[row.keys[0]] || row.keys[0],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      avgPosition: row.position || 0
    }));
  }

  // Format comparison data
  formatComparisonData(currentData, previousData) {
    const current = this.formatSearchConsoleData(currentData);
    const previous = this.formatSearchConsoleData(previousData);
    
    return {
      current,
      previous,
      growth: {
        clicks: current.totalClicks > 0 ? ((current.totalClicks - previous.totalClicks) / previous.totalClicks * 100) : 0,
        impressions: current.totalImpressions > 0 ? ((current.totalImpressions - previous.totalImpressions) / previous.totalImpressions * 100) : 0,
        ctr: current.avgCTR > 0 ? ((current.avgCTR - previous.avgCTR) / previous.avgCTR * 100) : 0,
        position: previous.avgPosition > 0 ? ((previous.avgPosition - current.avgPosition) / previous.avgPosition * 100) : 0
      }
    };
  }

  // Helper function to format date for Search Console API
  formatDate(date) {
    return date.toISOString().split('T')[0];
  }
}

module.exports = new GoogleAnalyticsService();