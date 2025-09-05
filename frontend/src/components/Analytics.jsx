import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, TrendingUp, Users, MousePointer, Eye, ExternalLink, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { apiService } from '../utils/api';

const Analytics = ({ onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [analyticsProperties, setAnalyticsProperties] = useState([]);
  const [searchConsoleSites, setSearchConsoleSites] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [overviewData, setOverviewData] = useState(null);
  const [blogPerformance, setBlogPerformance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authUrl, setAuthUrl] = useState(null);

  useEffect(() => {
    checkConnectionStatus();
    
    // Listen for OAuth success message from popup
    const handleMessage = (event) => {
      if (event.data.type === 'GOOGLE_ANALYTICS_AUTH_SUCCESS') {
        console.log('OAuth success message received');
        setIsConnecting(false);
        setTimeout(async () => {
          await checkConnectionStatus();
          if (!isConnected) {
            await fetchPropertiesAndSites();
            setShowSetup(true);
          }
        }, 500);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchAnalyticsData();
    }
  }, [isConnected]);

  const checkConnectionStatus = async () => {
    try {
      const response = await apiService.getAnalyticsStatus();
      console.log('Status check response:', response.data);
      const statusData = response.data.data || response.data;
      setConnectionStatus(statusData);
      setIsConnected(statusData.isConnected);
      console.log('Setting isConnected to:', statusData.isConnected);
    } catch (error) {
      console.error('Failed to check connection status:', error);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      console.log('Fetching auth URL...');
      const response = await apiService.getAnalyticsAuthUrl();
      console.log('Auth response:', response);
      console.log('Response data:', response.data);
      console.log('Auth URL:', response.data.authUrl);
      
      if (response.data.authUrl) {
        setAuthUrl(response.data.authUrl); // Store for manual fallback
        
        // Try to open popup
        const popup = window.open(response.data.authUrl, 'google-auth', 'width=600,height=700,scrollbars=yes,resizable=yes');
        
        if (!popup || popup.closed) {
          // Popup was blocked - fallback to manual link
          setError('Popup blocked. Please allow popups or click the manual authentication link below.');
          setIsConnecting(false);
          return;
        }
        
        // Listen for popup to close
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            // Check if authentication was successful
            setTimeout(async () => {
              await checkConnectionStatus();
              if (!isConnected) {
                await fetchPropertiesAndSites();
                setShowSetup(true);
              }
              setIsConnecting(false);
            }, 1000);
          }
        }, 1000);
        
        // Safety timeout
        setTimeout(() => {
          if (!popup.closed) {
            clearInterval(checkClosed);
            setError('Authentication timeout. Please try again.');
            setIsConnecting(false);
          }
        }, 60000); // 1 minute timeout
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setError('Failed to connect to Google Analytics: ' + (error.message || 'Unknown error'));
      setIsConnecting(false);
    }
  };

  const fetchPropertiesAndSites = async () => {
    try {
      const [propertiesResponse, sitesResponse] = await Promise.all([
        apiService.getAnalyticsProperties(),
        apiService.getSearchConsoleSites()
      ]);
      
      setAnalyticsProperties(propertiesResponse.data?.data || propertiesResponse.data || []);
      setSearchConsoleSites(sitesResponse.data?.data || sitesResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch properties and sites:', error);
      setError('Failed to fetch Analytics properties and Search Console sites');
    }
  };

  const handleSaveConfiguration = async () => {
    if (!selectedProperty || !selectedSite) {
      setError('Please select both Analytics property and Search Console site');
      return;
    }

    try {
      setLoading(true);
      console.log('Saving configuration:', { propertyId: selectedProperty, searchConsoleUrl: selectedSite });
      const saveResponse = await apiService.saveAnalyticsConfiguration({
        propertyId: selectedProperty,
        searchConsoleUrl: selectedSite
      });
      console.log('Save response:', saveResponse.data);

      setShowSetup(false);
      console.log('Checking connection status after save...');
      await checkConnectionStatus();
      setError(null);
    } catch (error) {
      console.error('Configuration failed:', error);
      setError('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [overviewResponse, blogResponse] = await Promise.all([
        apiService.getAnalyticsOverview(),
        apiService.getBlogPerformance()
      ]);
      
      console.log('Overview response:', overviewResponse.data);
      console.log('Blog response:', blogResponse.data);
      setOverviewData(overviewResponse.data.data || overviewResponse.data);
      setBlogPerformance(blogResponse.data.data || blogResponse.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setError('Failed to fetch analytics data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await apiService.disconnectAnalytics();
      setIsConnected(false);
      setConnectionStatus(null);
      setOverviewData(null);
      setBlogPerformance([]);
      setShowSetup(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
      setError('Failed to disconnect Analytics');
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  // Connection Setup Screen
  if (!isConnected && !showSetup) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#4a4a6a]">Analytics</h2>
            <p className="text-[#4a4a6a]">Connect Google Analytics & Search Console</p>
          </div>
          <Button variant="outline" onClick={onClose} className="inline-flex items-center border-[#b0b0d8] text-[#4a4a6a] hover:bg-white hover:border-[#6658f4]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        <Card className="border-[#b0b0d8]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-[#6658f4]" />
              <span>Connect Your Analytics</span>
            </CardTitle>
            <CardDescription>
              Track your website performance and published blog analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Website overview (users, sessions, page views)</li>
                <li>• Search Console data (clicks, impressions, CTR)</li>
                <li>• Published blog performance tracking</li>
                <li>• 28-day analytics dashboard</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-[#4a4a6a]">Required Access:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Google Analytics</p>
                    <p className="text-xs text-gray-600">Read-only access to GA4 data</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Search Console</p>
                    <p className="text-xs text-gray-600">Read-only access to GSC data</p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
                {authUrl && (
                  <div className="mt-2">
                    <a 
                      href={authUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Click here to authenticate manually →
                    </a>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full bg-[#6658f4] hover:bg-[#5a47e8] text-white"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Connect Google Analytics
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Property Selection Screen
  if (showSetup) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#4a4a6a]">Analytics Setup</h2>
            <p className="text-[#4a4a6a]">Select your Analytics property and Search Console site</p>
          </div>
          <Button variant="outline" onClick={() => setShowSetup(false)} className="inline-flex items-center border-[#b0b0d8] text-[#4a4a6a] hover:bg-white hover:border-[#6658f4]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        <Card className="border-[#b0b0d8]">
          <CardHeader>
            <CardTitle>Configure Analytics</CardTitle>
            <CardDescription>
              Choose which Analytics property and Search Console site to track
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                Google Analytics Property
              </label>
              <select 
                value={selectedProperty} 
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full px-3 py-2 border border-[#b0b0d8] rounded-md focus:border-[#6658f4] focus:outline-none"
              >
                <option value="">Select Analytics Property</option>
                {Array.isArray(analyticsProperties) && analyticsProperties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.displayName} ({property.websiteUrl || property.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                Search Console Site
              </label>
              <select 
                value={selectedSite} 
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full px-3 py-2 border border-[#b0b0d8] rounded-md focus:border-[#6658f4] focus:outline-none"
              >
                <option value="">Select Search Console Site</option>
                {Array.isArray(searchConsoleSites) && searchConsoleSites.map(site => (
                  <option key={site.siteUrl} value={site.siteUrl}>
                    {site.siteUrl}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            <Button 
              onClick={handleSaveConfiguration} 
              disabled={loading || !selectedProperty || !selectedSite}
              className="w-full bg-[#6658f4] hover:bg-[#5a47e8] text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Analytics Dashboard
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#4a4a6a]">Analytics Dashboard</h2>
          <p className="text-[#4a4a6a]">Last 28 days performance overview</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowSetup(true)} className="border-[#b0b0d8] text-[#4a4a6a] hover:bg-white hover:border-[#6658f4]">
            <Settings className="w-4 h-4 mr-1" /> Settings
          </Button>
          <Button variant="outline" onClick={onClose} className="inline-flex items-center border-[#b0b0d8] text-[#4a4a6a] hover:bg-white hover:border-[#6658f4]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6658f4]"></div>
          <span className="ml-2 text-[#4a4a6a]">Loading analytics data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {overviewData && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-[#b0b0d8]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#4a4a6a] font-medium">Total Users</p>
                    <p className="text-2xl font-bold text-[#4a4a6a]">
                      {formatNumber(overviewData.analytics?.totalUsers)}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#b0b0d8]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#4a4a6a] font-medium">Total Sessions</p>
                    <p className="text-2xl font-bold text-[#4a4a6a]">
                      {formatNumber(overviewData.analytics?.totalSessions)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#b0b0d8]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#4a4a6a] font-medium">Total Clicks</p>
                    <p className="text-2xl font-bold text-[#4a4a6a]">
                      {formatNumber(overviewData.searchConsole?.totalClicks)}
                    </p>
                  </div>
                  <MousePointer className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#b0b0d8]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#4a4a6a] font-medium">Impressions</p>
                    <p className="text-2xl font-bold text-[#4a4a6a]">
                      {formatNumber(overviewData.searchConsole?.totalImpressions)}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Blog Performance */}
          {blogPerformance.length > 0 && (
            <Card className="border-[#b0b0d8]">
              <CardHeader>
                <CardTitle>Published Blog Performance</CardTitle>
                <CardDescription>
                  Analytics for blogs published from your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-[#4a4a6a]">Blog Title</th>
                        <th className="text-left py-3 px-2 font-medium text-[#4a4a6a]">Platform</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Users</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Page Views</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Clicks</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Impressions</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">CTR</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogPerformance.map((blog, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-2">
                            <div className="font-medium text-[#4a4a6a]">{blog.title}</div>
                            <div className="text-xs text-gray-500">
                              Published: {new Date(blog.publishedAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {blog.platform}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            {blog.analytics ? formatNumber(blog.analytics.totalUsers) : '-'}
                          </td>
                          <td className="text-center py-3 px-2">
                            {blog.analytics ? formatNumber(blog.analytics.totalPageViews) : '-'}
                          </td>
                          <td className="text-center py-3 px-2">
                            {blog.searchConsole ? formatNumber(blog.searchConsole.totalClicks) : '-'}
                          </td>
                          <td className="text-center py-3 px-2">
                            {blog.searchConsole ? formatNumber(blog.searchConsole.totalImpressions) : '-'}
                          </td>
                          <td className="text-center py-3 px-2">
                            {blog.searchConsole ? (blog.searchConsole.avgCTR * 100).toFixed(1) + '%' : '-'}
                          </td>
                          <td className="text-center py-3 px-2">
                            <a 
                              href={blog.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#6658f4] hover:text-[#5a47e8]"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Connection Status Footer */}
      <Card className="border-[#b0b0d8] bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700 font-medium">Connected to Google Analytics</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisconnect}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;