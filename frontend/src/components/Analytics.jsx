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
  const [topPages, setTopPages] = useState([]);
  const [topQueries, setTopQueries] = useState([]);
  const [trafficByCountry, setTrafficByCountry] = useState([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authUrl, setAuthUrl] = useState(null);
  
  // Advanced Analytics State
  const [activeTab, setActiveTab] = useState('overview');
  const [queryPageMatrix, setQueryPageMatrix] = useState([]);
  const [keywordTrends, setKeywordTrends] = useState([]);
  const [searchAppearance, setSearchAppearance] = useState([]);
  const [performanceComparison, setPerformanceComparison] = useState(null);
  const [lowHangingFruit, setLowHangingFruit] = useState([]);
  const [advancedLoading, setAdvancedLoading] = useState(false);

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
      fetchExtendedAnalyticsData();
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
      const processedOverviewData = overviewResponse.data.data || overviewResponse.data;
      console.log('Processed overview data:', processedOverviewData);
      console.log('Search Console data in processed:', processedOverviewData.searchConsole);
      setOverviewData(processedOverviewData);
      setBlogPerformance(blogResponse.data.data || blogResponse.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setError('Failed to fetch analytics data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExtendedAnalyticsData = async () => {
    try {
      setDetailsLoading(true);
      const [pagesResponse, queriesResponse, countryResponse, deviceResponse] = await Promise.all([
        apiService.getTopPages(),
        apiService.getTopQueries(),
        apiService.getTrafficByCountry(),
        apiService.getDeviceBreakdown()
      ]);
      
      setTopPages(pagesResponse.data?.data || pagesResponse.data || []);
      setTopQueries(queriesResponse.data?.data || queriesResponse.data || []);
      setTrafficByCountry(countryResponse.data?.data || countryResponse.data || []);
      setDeviceBreakdown(deviceResponse.data?.data || deviceResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch extended analytics data:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchAdvancedAnalyticsData = async () => {
    try {
      setAdvancedLoading(true);
      const [matrixResponse, trendsResponse, appearanceResponse, comparisonResponse, opportunitiesResponse] = await Promise.all([
        apiService.getQueryPageMatrix(),
        apiService.getKeywordTrends(),
        apiService.getSearchAppearance(),
        apiService.getPerformanceComparison(),
        apiService.getLowHangingFruit()
      ]);
      
      setQueryPageMatrix(matrixResponse.data?.data || matrixResponse.data || []);
      setKeywordTrends(trendsResponse.data?.data || trendsResponse.data || []);
      setSearchAppearance(appearanceResponse.data?.data || appearanceResponse.data || []);
      setPerformanceComparison(comparisonResponse.data?.data || comparisonResponse.data || null);
      setLowHangingFruit(opportunitiesResponse.data?.data || opportunitiesResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch advanced analytics data:', error);
    } finally {
      setAdvancedLoading(false);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

            <Card className="border-[#b0b0d8]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#4a4a6a] font-medium">Average CTR</p>
                    <p className="text-2xl font-bold text-[#4a4a6a]">
                      {overviewData.searchConsole?.avgCTR ? (overviewData.searchConsole.avgCTR * 100).toFixed(2) + '%' : '0%'}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#b0b0d8]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#4a4a6a] font-medium">Avg Position</p>
                    <p className="text-2xl font-bold text-[#4a4a6a]">
                      {overviewData.searchConsole?.avgPosition ? overviewData.searchConsole.avgPosition.toFixed(1) : '0'}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Performance Chart */}
          {overviewData.searchConsole?.dailyData?.length > 0 && (
            <Card className="border-[#b0b0d8]">
              <CardHeader>
                <CardTitle>Search Performance Trends</CardTitle>
                <CardDescription>
                  Daily clicks and impressions over the last 28 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-x-auto">
                  <div className="flex items-end justify-between h-48 min-w-max space-x-1 px-2">
                    {overviewData.searchConsole.dailyData.slice(-14).map((day, index) => {
                      const maxClicks = Math.max(...overviewData.searchConsole.dailyData.map(d => d.clicks));
                      const maxImpressions = Math.max(...overviewData.searchConsole.dailyData.map(d => d.impressions));
                      const clickHeight = maxClicks > 0 ? (day.clicks / maxClicks) * 120 : 0;
                      const impressionHeight = maxImpressions > 0 ? (day.impressions / maxImpressions) * 120 : 0;
                      
                      return (
                        <div key={index} className="flex flex-col items-center space-y-2 min-w-[40px]">
                          <div className="flex items-end space-x-1 h-32">
                            <div 
                              className="w-4 bg-purple-500 rounded-t" 
                              style={{ height: `${clickHeight}px` }}
                              title={`Clicks: ${day.clicks}`}
                            ></div>
                            <div 
                              className="w-4 bg-orange-400 rounded-t" 
                              style={{ height: `${impressionHeight}px` }}
                              title={`Impressions: ${day.impressions}`}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-600 transform rotate-45 whitespace-nowrap">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-purple-500 rounded"></div>
                      <span className="text-sm text-gray-600">Clicks</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-orange-400 rounded"></div>
                      <span className="text-sm text-gray-600">Impressions</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extended Analytics Sections */}
          {detailsLoading && (
            <Card className="border-[#b0b0d8]">
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6658f4]"></div>
                  <span className="ml-2 text-[#4a4a6a]">Loading detailed analytics...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Performing Pages */}
          {!detailsLoading && topPages.length > 0 && (
            <Card className="border-[#b0b0d8]">
              <CardHeader>
                <CardTitle>Top Performing Pages</CardTitle>
                <CardDescription>
                  Pages driving the most traffic from search
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-[#4a4a6a]">Page</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Clicks</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Impressions</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">CTR</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPages.map((page, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-2">
                            <div className="font-medium text-[#4a4a6a] truncate max-w-xs">
                              {page.page}
                            </div>
                          </td>
                          <td className="text-center py-3 px-2">{page.clicks}</td>
                          <td className="text-center py-3 px-2">{page.impressions}</td>
                          <td className="text-center py-3 px-2">{(page.ctr * 100).toFixed(1)}%</td>
                          <td className="text-center py-3 px-2">{page.avgPosition.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Search Queries */}
          {!detailsLoading && topQueries.length > 0 && (
            <Card className="border-[#b0b0d8]">
              <CardHeader>
                <CardTitle>Top Search Queries</CardTitle>
                <CardDescription>
                  Keywords people use to find your website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-[#4a4a6a]">Search Query</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Clicks</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Impressions</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">CTR</th>
                        <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topQueries.map((query, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-2">
                            <div className="font-medium text-[#4a4a6a]">
                              "{query.query}"
                            </div>
                          </td>
                          <td className="text-center py-3 px-2">{query.clicks}</td>
                          <td className="text-center py-3 px-2">{query.impressions}</td>
                          <td className="text-center py-3 px-2">{(query.ctr * 100).toFixed(1)}%</td>
                          <td className="text-center py-3 px-2">{query.avgPosition.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Traffic by Country and Device */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic by Country */}
            {!detailsLoading && trafficByCountry.length > 0 && (
              <Card className="border-[#b0b0d8]">
                <CardHeader>
                  <CardTitle>Traffic by Country</CardTitle>
                  <CardDescription>
                    Geographic distribution of search traffic
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trafficByCountry.map((country, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-4 bg-gray-200 rounded text-xs flex items-center justify-center">
                            {country.countryCode?.toUpperCase()}
                          </div>
                          <span className="font-medium text-[#4a4a6a]">{country.country}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-purple-600">{country.clicks} clicks</span>
                          <span className="text-orange-600">{country.impressions} views</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Device Performance */}
            {!detailsLoading && deviceBreakdown.length > 0 && (
              <Card className="border-[#b0b0d8]">
                <CardHeader>
                  <CardTitle>Device Performance</CardTitle>
                  <CardDescription>
                    Search traffic by device type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {deviceBreakdown.map((device, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            {device.device === 'DESKTOP' && '💻'}
                            {device.device === 'MOBILE' && '📱'}
                            {device.device === 'TABLET' && '📱'}
                          </div>
                          <span className="font-medium text-[#4a4a6a] capitalize">
                            {device.device.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-purple-600">{device.clicks} clicks</span>
                          <span className="text-orange-600">{device.impressions} views</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-[#6658f4] text-[#6658f4]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => {
                  setActiveTab('advanced');
                  if (queryPageMatrix.length === 0 && !advancedLoading) {
                    fetchAdvancedAnalyticsData();
                  }
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'advanced'
                    ? 'border-[#6658f4] text-[#6658f4]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Advanced Analytics
              </button>
            </nav>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <>
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

          {/* Advanced Analytics Tab Content */}
          {activeTab === 'advanced' && (
            <>
              {advancedLoading && (
                <Card className="border-[#b0b0d8]">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6658f4]"></div>
                      <span className="ml-2 text-[#4a4a6a]">Loading advanced analytics...</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Query-Page Performance Matrix */}
              {!advancedLoading && queryPageMatrix.length > 0 && (
                <Card className="border-[#b0b0d8]">
                  <CardHeader>
                    <CardTitle>Query-Page Performance Matrix</CardTitle>
                    <CardDescription>
                      How specific search queries perform on different pages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 font-medium text-[#4a4a6a]">Query</th>
                            <th className="text-left py-3 px-2 font-medium text-[#4a4a6a]">Page</th>
                            <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Clicks</th>
                            <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Impressions</th>
                            <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">CTR</th>
                            <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Position</th>
                          </tr>
                        </thead>
                        <tbody>
                          {queryPageMatrix.slice(0, 20).map((item, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-3 px-2">
                                <div className="font-medium text-[#4a4a6a] max-w-xs truncate">
                                  "{item.query}"
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="text-[#4a4a6a] max-w-xs truncate">
                                  {item.page}
                                </div>
                              </td>
                              <td className="text-center py-3 px-2">{item.clicks}</td>
                              <td className="text-center py-3 px-2">{item.impressions}</td>
                              <td className="text-center py-3 px-2">{((item.ctr || 0) * 100).toFixed(1)}%</td>
                              <td className="text-center py-3 px-2">{(item.avgPosition || 0).toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Keyword Trends */}
              {!advancedLoading && keywordTrends.length > 0 && (
                <Card className="border-[#b0b0d8]">
                  <CardHeader>
                    <CardTitle>Keyword Performance Trends</CardTitle>
                    <CardDescription>
                      Daily performance trends for your top keywords
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {keywordTrends.slice(0, 5).map((keyword, keywordIndex) => (
                        <div key={keywordIndex} className="border-b border-gray-100 pb-4 last:border-b-0">
                          <h4 className="font-medium text-[#4a4a6a] mb-3">"{keyword.query}"</h4>
                          <div className="h-32 overflow-x-auto">
                            <div className="flex items-end justify-between h-24 min-w-max space-x-1 px-2">
                              {keyword.dailyData?.slice(-14).map((day, dayIndex) => {
                                const maxClicks = Math.max(...keyword.dailyData.map(d => d.clicks));
                                const maxImpressions = Math.max(...keyword.dailyData.map(d => d.impressions));
                                const clickHeight = maxClicks > 0 ? (day.clicks / maxClicks) * 60 : 0;
                                const impressionHeight = maxImpressions > 0 ? (day.impressions / maxImpressions) * 60 : 0;
                                
                                return (
                                  <div key={dayIndex} className="flex flex-col items-center space-y-2 min-w-[30px]">
                                    <div className="flex items-end space-x-1 h-16">
                                      <div 
                                        className="w-3 bg-purple-500 rounded-t" 
                                        style={{ height: `${clickHeight}px` }}
                                        title={`${day.date}: ${day.clicks} clicks`}
                                      ></div>
                                      <div 
                                        className="w-3 bg-orange-400 rounded-t" 
                                        style={{ height: `${impressionHeight}px` }}
                                        title={`${day.date}: ${day.impressions} impressions`}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-gray-600 transform rotate-45 whitespace-nowrap">
                                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Search Appearance Breakdown */}
              {!advancedLoading && searchAppearance.length > 0 && (
                <Card className="border-[#b0b0d8]">
                  <CardHeader>
                    <CardTitle>Search Appearance Types</CardTitle>
                    <CardDescription>
                      How your content appears in search results
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchAppearance.map((appearance, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-[#4a4a6a] capitalize">
                              {appearance.searchAppearance.replace('_', ' ').toLowerCase()}
                            </h4>
                            <div className="text-xs text-gray-500">
                              {((appearance.clicks / searchAppearance.reduce((sum, item) => sum + item.clicks, 0)) * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Clicks:</span>
                              <span className="font-medium">{appearance.clicks}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Impressions:</span>
                              <span className="font-medium">{appearance.impressions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">CTR:</span>
                              <span className="font-medium">{((appearance.ctr || 0) * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Performance Comparison */}
              {!advancedLoading && performanceComparison && (
                <Card className="border-[#b0b0d8]">
                  <CardHeader>
                    <CardTitle>Performance Comparison</CardTitle>
                    <CardDescription>
                      Current vs previous period performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#4a4a6a] mb-1">
                          {formatNumber(performanceComparison.current?.totalClicks || 0)}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">Current Clicks</div>
                        <div className={`text-xs flex items-center justify-center ${
                          (performanceComparison.clicksChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className={`w-3 h-3 mr-1 ${
                            (performanceComparison.clicksChange || 0) < 0 ? 'transform rotate-180' : ''
                          }`} />
                          {(performanceComparison.clicksChange || 0) >= 0 ? '+' : ''}{(performanceComparison.clicksChange || 0).toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#4a4a6a] mb-1">
                          {formatNumber(performanceComparison.current?.totalImpressions || 0)}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">Current Impressions</div>
                        <div className={`text-xs flex items-center justify-center ${
                          (performanceComparison.impressionsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className={`w-3 h-3 mr-1 ${
                            (performanceComparison.impressionsChange || 0) < 0 ? 'transform rotate-180' : ''
                          }`} />
                          {(performanceComparison.impressionsChange || 0) >= 0 ? '+' : ''}{(performanceComparison.impressionsChange || 0).toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#4a4a6a] mb-1">
                          {((performanceComparison.current?.avgCTR || 0) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 mb-1">Current CTR</div>
                        <div className={`text-xs flex items-center justify-center ${
                          (performanceComparison.ctrChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className={`w-3 h-3 mr-1 ${
                            (performanceComparison.ctrChange || 0) < 0 ? 'transform rotate-180' : ''
                          }`} />
                          {(performanceComparison.ctrChange || 0) >= 0 ? '+' : ''}{(performanceComparison.ctrChange || 0).toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#4a4a6a] mb-1">
                          {(performanceComparison.current?.avgPosition || 0).toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">Avg Position</div>
                        <div className={`text-xs flex items-center justify-center ${
                          (performanceComparison.positionChange || 0) <= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className={`w-3 h-3 mr-1 ${
                            (performanceComparison.positionChange || 0) > 0 ? 'transform rotate-180' : ''
                          }`} />
                          {(performanceComparison.positionChange || 0) <= 0 ? '' : '+'}{(performanceComparison.positionChange || 0).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Low-Hanging Fruit Opportunities */}
              {!advancedLoading && lowHangingFruit.length > 0 && (
                <Card className="border-[#b0b0d8]">
                  <CardHeader>
                    <CardTitle>Low-Hanging Fruit Opportunities</CardTitle>
                    <CardDescription>
                      Keywords ranking 4-20 with potential for quick wins
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 font-medium text-[#4a4a6a]">Search Query</th>
                            <th className="text-left py-3 px-2 font-medium text-[#4a4a6a]">Page</th>
                            <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Current Position</th>
                            <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Clicks</th>
                            <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Impressions</th>
                            <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">CTR</th>
                            <th className="text-center py-3 px-2 font-medium text-[#4a4a6a]">Potential</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lowHangingFruit.slice(0, 15).map((opportunity, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-3 px-2">
                                <div className="font-medium text-[#4a4a6a] max-w-xs truncate">
                                  "{opportunity.query}"
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="text-[#4a4a6a] max-w-xs truncate">
                                  {opportunity.page}
                                </div>
                              </td>
                              <td className="text-center py-3 px-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  (opportunity.avgPosition || 0) <= 10 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {(opportunity.avgPosition || 0).toFixed(1)}
                                </span>
                              </td>
                              <td className="text-center py-3 px-2">{opportunity.clicks}</td>
                              <td className="text-center py-3 px-2">{opportunity.impressions}</td>
                              <td className="text-center py-3 px-2">{((opportunity.ctr || 0) * 100).toFixed(1)}%</td>
                              <td className="text-center py-3 px-2">
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  High
                                </span>
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