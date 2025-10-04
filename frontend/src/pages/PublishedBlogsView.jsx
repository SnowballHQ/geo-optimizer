import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, ArrowRight, RefreshCw, CheckCircle, AlertCircle, Settings, BarChart3, ExternalLink, ShoppingBag, Globe, FileText, Sparkles, Calendar } from 'lucide-react';
import { apiService } from '../utils/api';

const PublishedBlogsView = ({ inline = false, onClose }) => {
  const navigate = useNavigate();
  const [publishedBlogs, setPublishedBlogs] = useState([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);
  const [cmsConnection, setCmsConnection] = useState({ status: 'checking', platform: null, details: null });
  const [analyticsConnection, setAnalyticsConnection] = useState({ status: 'checking', connected: false });
  const [isCheckingConnections, setIsCheckingConnections] = useState(true);

  useEffect(() => {
    checkAllConnections();
  }, []);

  // Check CMS and Analytics connections
  const checkAllConnections = async () => {
    setIsCheckingConnections(true);
    console.log('🔍 Starting connection checks...');
    
    try {
      // Check all CMS platforms
      const [shopifyStatus, webflowStatus, wordpressStatus, analyticsStatus] = await Promise.all([
        checkShopifyConnection(),
        checkWebflowConnection(), 
        checkWordPressConnection(),
        checkAnalyticsConnection()
      ]);

      console.log('📊 Connection Status Results:', {
        shopify: shopifyStatus.connected,
        webflow: webflowStatus.connected,
        wordpress: wordpressStatus.connected,
        analytics: analyticsStatus.connected
      });

      // Determine which CMS is connected (if any)
      if (shopifyStatus.connected) {
        setCmsConnection({ status: 'connected', platform: 'shopify', details: shopifyStatus });
      } else if (webflowStatus.connected) {
        setCmsConnection({ status: 'connected', platform: 'webflow', details: webflowStatus });
      } else if (wordpressStatus.connected) {
        setCmsConnection({ status: 'connected', platform: 'wordpress', details: wordpressStatus });
      } else {
        setCmsConnection({ status: 'disconnected', platform: null, details: null });
      }

      setAnalyticsConnection(analyticsStatus);
      console.log('📈 Analytics connection set to:', analyticsStatus);

      // If both connections exist, fetch published blogs
      const cmsConnected = shopifyStatus.connected || webflowStatus.connected || wordpressStatus.connected;
      console.log('✅ Both connected?', { cms: cmsConnected, analytics: analyticsStatus.connected });
      
      if (cmsConnected && analyticsStatus.connected) {
        fetchPublishedBlogs();
      }
    } catch (error) {
      console.error('Error checking connections:', error);
    } finally {
      setIsCheckingConnections(false);
    }
  };

  const checkShopifyConnection = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/shopify/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth')}` }
      });
      const data = await response.json();
      return { connected: response.ok && data.status === 'connected', ...data };
    } catch (error) {
      return { connected: false };
    }
  };

  const checkWebflowConnection = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/webflow/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth')}` }
      });
      const data = await response.json();
      return { connected: response.ok && data.status === 'connected', ...data };
    } catch (error) {
      return { connected: false };
    }
  };

  const checkWordPressConnection = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/wordpress/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth')}` }
      });
      const data = await response.json();
      return { connected: response.ok && data.status === 'connected', ...data };
    } catch (error) {
      return { connected: false };
    }
  };

  const checkAnalyticsConnection = async () => {
    try {
      const response = await apiService.get('/api/v1/analytics/status');
      console.log('Analytics status response in PublishedBlogsView:', response.data);
      
      // Use same data structure handling as Analytics.jsx
      const statusData = response.data.data || response.data;
      console.log('Analytics statusData:', statusData);
      
      return { 
        connected: statusData.isConnected,
        ...statusData 
      };
    } catch (error) {
      console.error('Error checking analytics connection:', error);
      return { connected: false };
    }
  };

  const fetchPublishedBlogs = async () => {
    try {
      setIsLoadingBlogs(true);
      const response = await apiService.getPublishedBlogs();
      console.log('Published blogs response:', response.data);
      setPublishedBlogs(response.data.data || []);
    } catch (error) {
      console.error('Error fetching published blogs:', error);
      setPublishedBlogs([]);
    } finally {
      setIsLoadingBlogs(false);
    }
  };

  const handleConnectCMS = () => {
    // Navigate to settings with CMS selection focus
    if (inline && onClose) {
      onClose();
      navigate('/dashboard?section=settings&focus=cms');
    } else {
      navigate('/dashboard?section=settings&focus=cms');
    }
  };

  const handleConnectAnalytics = () => {
    console.log('Navigating to analytics from Published Blogs');
    // Navigate to analytics section
    if (inline && onClose) {
      onClose();
      // Use setTimeout to ensure the onClose completes before navigation
      setTimeout(() => {
        navigate('/dashboard?section=analytics');
      }, 50);
    } else {
      navigate('/dashboard?section=analytics');
    }
  };

  const getCMSIcon = (platform) => {
    switch (platform) {
      case 'shopify': return <ShoppingBag className="w-5 h-5" />;
      case 'webflow': return <Globe className="w-5 h-5" />;
      case 'wordpress': return <FileText className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const getCMSName = (platform) => {
    switch (platform) {
      case 'shopify': return 'Shopify';
      case 'webflow': return 'Webflow';
      case 'wordpress': return 'WordPress';
      default: return 'CMS';
    }
  };

  // Loading state
  if (isCheckingConnections) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#4a4a6a]">Published Blogs</h2>
            <p className="text-[#4a4a6a]">Track your published content and analytics</p>
          </div>
          {inline && onClose && (
            <Button variant="outline" onClick={onClose} className="inline-flex items-center border-[#b0b0d8] text-[#4a4a6a] hover:bg-white hover:border-[#6658f4]">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          )}
        </div>

        {/* Loading State */}
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#7765e3] mx-auto mb-4"></div>
            <p className="text-lg font-medium text-[#4a4a6a]">Checking Connections...</p>
            <p className="text-sm text-[#6b7280] mt-2">Verifying CMS and Analytics setup</p>
          </div>
        </div>
      </div>
    );
  }

  // Connection status checks
  const cmsConnected = cmsConnection.status === 'connected';
  const analyticsConnected = analyticsConnection.connected;
  const bothConnected = cmsConnected && analyticsConnected;

  return (
    <div className="space-y-6">
      {/* Content Calendar CTA */}
      <Card className="border-0 bg-gradient-to-r from-[#6658f4] to-[#8b7ff5] text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center space-x-2">
                  <span>📝 Keep Your Content Fresh!</span>
                </h3>
                <p className="text-white/90 text-sm">
                  {publishedBlogs.length > 0
                    ? `You have ${publishedBlogs.length} published ${publishedBlogs.length === 1 ? 'blog' : 'blogs'}. Generate more AI-optimized content from your calendar!`
                    : 'Ready to publish more? Generate new AI-optimized blogs from your content calendar'
                  }
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                if (inline && onClose) {
                  onClose();
                }
                // Small delay to ensure proper navigation
                setTimeout(() => {
                  window.location.hash = '#content-calendar';
                }, 100);
              }}
              className="bg-white text-[#6658f4] hover:bg-white/90 font-semibold shadow-md transition-all hover:scale-105"
            >
              Create New Content
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status Bar */}
      <Card className="border-[#b0b0d8] bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#4a4a6a] mb-3">Connection Status</h3>
            
            <div className="flex items-center space-x-6">
              {/* CMS Status */}
              <div className="flex items-center space-x-2">
                {getCMSIcon(cmsConnection.platform)}
                <span className="font-medium text-[#4a4a6a]">
                  {cmsConnected ? getCMSName(cmsConnection.platform) : 'CMS Platform'}
                </span>
                {cmsConnected ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-200 text-red-800 bg-red-50">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>

              {/* Analytics Status */}
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium text-[#4a4a6a]">Google Analytics</span>
                {analyticsConnected ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-200 text-red-800 bg-red-50">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {!bothConnected ? (
        /* Setup Required */
        <Card className="border-[#b0b0d8] bg-white">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-[#4a4a6a] mb-3">Setup Required</h3>
              <p className="text-[#6b7280] mb-6">
                To view published blogs and analytics data, you need to connect both a CMS platform and Google Analytics.
              </p>

              <div className="space-y-3">
                {!cmsConnected && (
                  <Button
                    onClick={handleConnectCMS}
                    className="w-full bg-[#7765e3] hover:bg-[#6658f4] text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Connect CMS Platform
                  </Button>
                )}

                {!analyticsConnected && (
                  <Button
                    onClick={handleConnectAnalytics}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Connect Google Analytics
                  </Button>
                )}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
                <h4 className="font-semibold text-[#4a4a6a] mb-2">Why do I need both?</h4>
                <ul className="text-sm text-[#6b7280] space-y-1">
                  <li>• <strong>CMS Platform:</strong> Publishes and hosts your blog content</li>
                  <li>• <strong>Google Analytics:</strong> Tracks blog performance and visitor data</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Published Blogs Display */
        <div className="space-y-4">
          {isLoadingBlogs && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6658f4]"></div>
              <span className="ml-2 text-[#4a4a6a]">Loading published blogs...</span>
            </div>
          )}

          {!isLoadingBlogs && publishedBlogs.length === 0 && (
            <Card className="border-[#b0b0d8] bg-white">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-[#4a4a6a] mb-2">No Published Blogs Yet</h3>
                <p className="text-[#6b7280] mb-4">
                  Publish some content from your Content Calendar to see analytics data here.
                </p>
                <Button
                  onClick={() => navigate('/dashboard?section=content-calendar')}
                  className="bg-[#6658f4] hover:bg-[#5a47e8] text-white"
                >
                  Go to Content Calendar
                </Button>
              </CardContent>
            </Card>
          )}

          {!isLoadingBlogs && publishedBlogs.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[#4a4a6a]">
                  Published Blogs ({publishedBlogs.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">
                    {getCMSName(cmsConnection.platform)} Connected
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800">
                    Analytics Connected
                  </Badge>
                </div>
              </div>

              {publishedBlogs.map((blog) => (
                <Card key={blog.id} className="border-0.3 border-[#b0b0d8] bg-white hover:border-[#6658f4] transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-semibold text-[#4a4a6a]">{blog.title}</h4>
                          <Badge className="bg-green-100 text-green-800">
                            Published
                          </Badge>
                          <Badge variant="outline" className="border-blue-200 text-blue-800">
                            {getCMSName(blog.cmsPlatform)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <span className="text-sm font-medium text-[#4a4a6a]">Published Date:</span>
                            <p className="text-sm text-[#6b7280]">
                              {new Date(blog.publishedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-[#4a4a6a]">Target Keywords:</span>
                            <p className="text-sm text-[#6b7280]">
                              {Array.isArray(blog.keywords) ? blog.keywords.join(', ') : blog.keywords}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-[#4a4a6a]">Target Audience:</span>
                            <p className="text-sm text-[#6b7280]">
                              {blog.targetAudience || 'General audience'}
                            </p>
                          </div>
                        </div>

                        {/* Analytics Data Placeholder */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-[#4a4a6a]">-</div>
                            <div className="text-xs text-[#6b7280]">Views</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-[#4a4a6a]">-</div>
                            <div className="text-xs text-[#6b7280]">Clicks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-[#4a4a6a]">-</div>
                            <div className="text-xs text-[#6b7280]">Avg. Position</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-[#4a4a6a]">-</div>
                            <div className="text-xs text-[#6b7280]">CTR</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col space-y-2">
                        {blog.publishedUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(blog.publishedUrl, '_blank')}
                            className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/editor/${blog.id}`)}
                          className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PublishedBlogsView;