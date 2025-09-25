import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ShoppingBag, Globe, FileText, ArrowLeft, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const CMSConnectionSelector = ({ onBack, focusPlatform = null }) => {
  const [selectedPlatform, setSelectedPlatform] = useState(focusPlatform);
  const [connectionStates, setConnectionStates] = useState({
    shopify: { status: 'checking', details: null },
    webflow: { status: 'checking', details: null },
    wordpress: { status: 'checking', details: null }
  });
  const [isConnecting, setIsConnecting] = useState({
    shopify: false,
    webflow: false,
    wordpress: false
  });

  const platforms = [
    {
      id: 'shopify',
      name: 'Shopify',
      icon: <ShoppingBag className="w-8 h-8" />,
      description: 'Connect your Shopify store to publish blog posts directly',
      color: 'bg-green-500',
      features: ['Blog publishing', 'Product integration', 'Store analytics', 'SEO optimization']
    },
    {
      id: 'webflow',
      name: 'Webflow',
      icon: <Globe className="w-8 h-8" />,
      description: 'Publish content to your Webflow CMS collections',
      color: 'bg-blue-500',
      features: ['CMS collections', 'Custom fields', 'Responsive design', 'Clean URLs']
    },
    {
      id: 'wordpress',
      name: 'WordPress',
      icon: <FileText className="w-8 h-8" />,
      description: 'Connect to WordPress sites for content publishing',
      color: 'bg-purple-500',
      features: ['Post publishing', 'Category management', 'Media library', 'Plugin compatibility']
    }
  ];

  useEffect(() => {
    checkAllConnections();
  }, []);

  const checkAllConnections = async () => {
    const connections = {};
    
    // Check Shopify
    try {
      const shopifyResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/shopify/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth')}` }
      });
      const shopifyData = await shopifyResponse.json();
      connections.shopify = {
        status: shopifyResponse.ok && shopifyData.status === 'connected' ? 'connected' : 'disconnected',
        details: shopifyData
      };
    } catch (error) {
      connections.shopify = { status: 'error', details: null };
    }

    // Check Webflow
    try {
      const webflowResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/webflow/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth')}` }
      });
      const webflowData = await webflowResponse.json();
      connections.webflow = {
        status: webflowResponse.ok && webflowData.status === 'connected' ? 'connected' : 'disconnected',
        details: webflowData
      };
    } catch (error) {
      connections.webflow = { status: 'error', details: null };
    }

    // Check WordPress
    try {
      const wordpressResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/wordpress/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth')}` }
      });
      const wordpressData = await wordpressResponse.json();
      connections.wordpress = {
        status: wordpressResponse.ok && wordpressData.status === 'connected' ? 'connected' : 'disconnected',
        details: wordpressData
      };
    } catch (error) {
      connections.wordpress = { status: 'error', details: null };
    }

    setConnectionStates(connections);
  };

  const handleConnect = async (platformId) => {
    setIsConnecting(prev => ({ ...prev, [platformId]: true }));
    
    try {
      let authUrl;
      
      switch (platformId) {
        case 'shopify':
          const shopifyResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/shopify/auth-url`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth')}` }
          });
          const shopifyData = await shopifyResponse.json();
          if (shopifyData.success) {
            authUrl = shopifyData.authUrl;
          }
          break;
          
        case 'webflow':
          const webflowResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/webflow/auth-url`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth')}` }
          });
          const webflowData = await webflowResponse.json();
          if (webflowData.success) {
            authUrl = webflowData.authUrl;
          }
          break;
          
        case 'wordpress':
          // WordPress might have different auth flow
          toast.info('WordPress connection will be available in your Settings > WordPress section');
          setIsConnecting(prev => ({ ...prev, [platformId]: false }));
          return;
          
        default:
          throw new Error('Unknown platform');
      }

      if (authUrl) {
        // Open auth URL in same window
        window.location.href = authUrl;
      } else {
        throw new Error('Failed to get authentication URL');
      }
    } catch (error) {
      console.error(`Error connecting to ${platformId}:`, error);
      toast.error(`Failed to connect to ${platforms.find(p => p.id === platformId)?.name}. Please try again.`);
      setIsConnecting(prev => ({ ...prev, [platformId]: false }));
    }
  };

  const handleDisconnect = async (platformId) => {
    if (!window.confirm(`Are you sure you want to disconnect from ${platforms.find(p => p.id === platformId)?.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/${platformId}/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth')}` }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully disconnected from ${platforms.find(p => p.id === platformId)?.name}`);
        checkAllConnections(); // Refresh connection status
      } else {
        throw new Error(data.error || 'Failed to disconnect');
      }
    } catch (error) {
      console.error(`Error disconnecting from ${platformId}:`, error);
      toast.error(`Failed to disconnect from ${platforms.find(p => p.id === platformId)?.name}`);
    }
  };

  const getConnectionStatus = (platformId) => {
    const connection = connectionStates[platformId];
    if (!connection) return { status: 'checking', color: 'text-gray-500', icon: null };

    switch (connection.status) {
      case 'connected':
        return {
          status: 'Connected',
          color: 'text-green-600',
          icon: <CheckCircle className="w-4 h-4" />,
          bgColor: 'bg-green-50 border-green-200'
        };
      case 'disconnected':
        return {
          status: 'Not Connected',
          color: 'text-gray-600',
          icon: <AlertCircle className="w-4 h-4" />,
          bgColor: 'bg-gray-50 border-gray-200'
        };
      case 'error':
        return {
          status: 'Connection Error',
          color: 'text-red-600',
          icon: <AlertCircle className="w-4 h-4" />,
          bgColor: 'bg-red-50 border-red-200'
        };
      default:
        return {
          status: 'Checking...',
          color: 'text-gray-500',
          icon: null,
          bgColor: 'bg-gray-50 border-gray-200'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#4a4a6a]">Connect CMS Platform</h2>
          <p className="text-[#6b7280] mt-1">Choose your preferred platform for publishing content</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack} className="inline-flex items-center border-[#b0b0d8] text-[#4a4a6a] hover:bg-white hover:border-[#6658f4]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        )}
      </div>

      {/* Platform Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map((platform) => {
          const status = getConnectionStatus(platform.id);
          const isLoading = isConnecting[platform.id];
          const isConnected = connectionStates[platform.id]?.status === 'connected';

          return (
            <Card 
              key={platform.id} 
              className={`border-2 transition-all duration-200 ${
                selectedPlatform === platform.id 
                  ? 'border-[#7765e3] shadow-lg' 
                  : `border-gray-200 hover:border-[#7765e3]/50 ${status.bgColor}`
              }`}
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 ${platform.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white`}>
                  {platform.icon}
                </div>
                <CardTitle className="text-xl text-[#4a4a6a]">{platform.name}</CardTitle>
                <CardDescription className="text-sm">{platform.description}</CardDescription>
                
                {/* Connection Status */}
                <div className={`flex items-center justify-center space-x-2 mt-3 px-3 py-2 rounded-full text-sm font-medium ${status.bgColor}`}>
                  {status.icon}
                  <span className={status.color}>{status.status}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                <div>
                  <h4 className="font-medium text-[#4a4a6a] text-sm mb-2">Features:</h4>
                  <ul className="space-y-1">
                    {platform.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-xs text-[#6b7280]">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  {isConnected ? (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleDisconnect(platform.id)}
                      >
                        Disconnect
                      </Button>
                      {connectionStates[platform.id]?.details?.shop && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(
                            `https://${connectionStates[platform.id].details.shop}/admin`, 
                            '_blank'
                          )}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View {platform.name}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      className={`w-full ${platform.color} hover:opacity-90 text-white disabled:opacity-50`}
                      onClick={() => handleConnect(platform.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        `Connect ${platform.name}`
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connection Info */}
      <Card className="border-[#b0b0d8] bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[#4a4a6a] mb-2">Important Notes</h3>
              <ul className="text-sm text-[#6b7280] space-y-1">
                <li>• You only need to connect <strong>one</strong> CMS platform for publishing</li>
                <li>• All connections are secure and use OAuth 2.0 authentication</li>
                <li>• You can switch platforms anytime from Settings</li>
                <li>• Your content will be published with your brand voice and style applied</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CMSConnectionSelector;