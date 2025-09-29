import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ShoppingBag, ExternalLink, Check, AlertCircle, Loader2 } from 'lucide-react';

const ShopifySettings = ({ onConnectionChange }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/shopify`;

  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Handle OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopifySuccess = urlParams.get('shopify_success');
    const shopifyError = urlParams.get('shopify_error');
    const shop = urlParams.get('shop');
    const accessToken = urlParams.get('access_token');
    const error = urlParams.get('error');

    if (shopifySuccess === '1' && shop && accessToken) {
      // Save credentials via API
      saveShopifyCredentials(shop, accessToken);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (shopifyError === '1') {
      toast.error(`Shopify connection failed: ${error || 'Unknown error'}`);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const saveShopifyCredentials = async (shop, accessToken) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/save-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth')}`
        },
        body: JSON.stringify({ shop, accessToken })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        await checkConnectionStatus();
      } else {
        toast.error(data.error || 'Failed to save Shopify credentials');
      }
    } catch (error) {
      console.error('Error saving Shopify credentials:', error);
      toast.error('Failed to save Shopify credentials');
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth')}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setConnectionStatus(data.status);
        if (data.status === 'connected') {
          setShopInfo(data);
        } else {
          setShopInfo(null);
        }
      } else {
        setConnectionStatus('error');
        toast.error(data.error || 'Failed to check connection status');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setConnectionStatus('error');
      toast.error('Failed to check connection status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Make authenticated API call to get OAuth URL
      // For testing with your development store
      const response = await fetch(`${API_BASE}/connect?shop=testingsnowball.myshopify.com`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth')}`
        }
      });
      
      if (response.redirected) {
        // If the backend returns a redirect, follow it
        window.location.href = response.url;
      } else if (response.ok) {
        // If backend returns OAuth URL in response
        const data = await response.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        } else {
          throw new Error('No OAuth URL received');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get OAuth URL');
      }
    } catch (error) {
      console.error('Error initiating connection:', error);
      setIsConnecting(false);
      toast.error(`Failed to initiate connection: ${error.message}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setConnectionStatus('disconnected');
        setShopInfo(null);
        if (onConnectionChange) {
          onConnectionChange('shopify', 'disconnected');
        }
      } else {
        toast.error(data.message || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect from Shopify');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'disconnected':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Not Connected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Checking...';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnected':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (loading && !isConnecting) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#6658f4] mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading Shopify integration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
        <div className="flex items-center space-x-3">
          <ShoppingBag className="w-6 h-6 text-[#95BF47]" />
          <div>
            <h3 className="font-medium text-gray-900">Shopify Store</h3>
            <p className="text-sm text-gray-600">Connect your store to publish blog content</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          
          <Button
            onClick={checkConnectionStatus}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-gray-300"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Connected State */}
      {connectionStatus === 'connected' && shopInfo && (
        <div className="p-4 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h4 className="font-medium text-green-800">Connected Store</h4>
              <div className="space-y-1 text-sm text-green-700">
                <p><strong>Shop:</strong> {shopInfo.shop}</p>
                <p><strong>Connected:</strong> {new Date(shopInfo.connectedAt).toLocaleDateString()}</p>
                <p><strong>Permissions:</strong> {shopInfo.scopes}</p>
              </div>
            </div>
            
            <div className="space-x-2">
              <Button
                onClick={() => window.open(`https://${shopInfo.shop}/admin/blogs`, '_blank')}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View Blogs
              </Button>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
                disabled={loading}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnected State */}
      {connectionStatus === 'disconnected' && (
        <div className="p-6 border rounded-lg bg-gray-50 border-gray-200 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="font-medium text-gray-900 mb-2">Connect Your Shopify Store</h4>
          <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
            Connect your Shopify store to automatically publish blog content from our platform directly to your store's blog.
          </p>
          
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-[#95BF47] hover:bg-[#7a9c3a] text-white"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Connect Shopify Store
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error State */}
      {connectionStatus === 'error' && (
        <div className="p-4 border rounded-lg bg-red-50 border-red-200">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <h4 className="font-medium">Connection Error</h4>
          </div>
          <p className="text-sm text-red-600 mt-2">
            There was an error checking your Shopify connection. Please try again.
          </p>
          <Button
            onClick={checkConnectionStatus}
            variant="outline"
            size="sm"
            className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
          >
            Try Again
          </Button>
        </div>
      )}

    </div>
  );
};

export default ShopifySettings;