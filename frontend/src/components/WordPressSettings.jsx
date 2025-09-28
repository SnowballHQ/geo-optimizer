import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Globe, ExternalLink, Check, AlertCircle, Loader2, FileText } from 'lucide-react';

const WordPressSettings = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [wordpressInfo, setWordpressInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/v1/wordpress`;

  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Handle OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const wordpressSuccess = urlParams.get('wordpress_success');
    const wordpressError = urlParams.get('wordpress_error');
    const user = urlParams.get('user');
    const error = urlParams.get('error');

    if (wordpressSuccess === '1') {
      toast.success(`WordPress.com connected successfully! Welcome, ${user || 'User'}`);
      checkConnectionStatus(); // Refresh status
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (wordpressError === '1') {
      toast.error(`WordPress.com connection failed: ${error || 'Unknown error'}`);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'connected') {
          setConnectionStatus('connected');
          setWordpressInfo({
            userLogin: data.userLogin,
            userDisplayName: data.userDisplayName,
            userEmail: data.userEmail,
            sitesCount: data.sitesCount,
            connectedAt: data.connectedAt,
            scope: data.scope
          });
        } else if (data.status === 'token_expired') {
          setConnectionStatus('token_expired');
          setWordpressInfo(null);
        } else {
          setConnectionStatus('disconnected');
          setWordpressInfo(null);
        }
      }
    } catch (error) {
      console.error('Error checking WordPress status:', error);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Make authenticated API call to get OAuth URL
      const response = await fetch(`${API_BASE}/connect`, {
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
      console.error('Error initiating WordPress.com connection:', error);
      setIsConnecting(false);
      toast.error(`Failed to initiate WordPress.com connection: ${error.message}`);
    }
  };

  const disconnectWordPress = async () => {
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
        toast.success('WordPress disconnected successfully');
        setConnectionStatus('disconnected');
        setWordpressInfo(null);
      } else {
        toast.error('Failed to disconnect WordPress');
      }
    } catch (error) {
      console.error('Error disconnecting WordPress:', error);
      toast.error('Failed to disconnect WordPress');
    } finally {
      setLoading(false);
    }
  };


  const getStatusText = () => {
    if (loading) return 'Checking connection...';
    
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Not Connected';
      case 'token_expired':
        return 'Token Expired';
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
      case 'token_expired':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'disconnected':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      case 'token_expired':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };


  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
        <div className="flex items-center space-x-3">
          <FileText className="w-6 h-6 text-[#21759b]" />
          <div>
            <h3 className="font-medium text-gray-900">WordPress.com Account</h3>
            <p className="text-sm text-gray-600">Connect your account to publish blog content</p>
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
      {connectionStatus === 'connected' && wordpressInfo && (
        <div className="p-4 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h4 className="font-medium text-green-800">Connected Account</h4>
              <div className="space-y-1 text-sm text-green-700">
                <p><strong>User:</strong> {wordpressInfo.userDisplayName}</p>
                <p><strong>Login:</strong> {wordpressInfo.userLogin}</p>
                <p><strong>Email:</strong> {wordpressInfo.userEmail}</p>
                <p><strong>Sites:</strong> {wordpressInfo.sitesCount} available</p>
                <p><strong>Connected:</strong> {new Date(wordpressInfo.connectedAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="space-x-2">
              <Button
                onClick={() => window.open('https://wordpress.com/me', '_blank')}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Account
              </Button>
              <Button
                onClick={disconnectWordPress}
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
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="font-medium text-gray-900 mb-2">Connect Your WordPress.com Account</h4>
          <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
            Connect your WordPress.com account to automatically publish blog content from our platform directly to your sites.
          </p>
          
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-[#21759b] hover:bg-[#1a5f7a] text-white"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Connect WordPress.com Account
              </>
            )}
          </Button>
        </div>
      )}

      {/* Token Expired State */}
      {connectionStatus === 'token_expired' && (
        <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
          <div className="flex items-center space-x-2 text-orange-700">
            <AlertCircle className="w-5 h-5" />
            <h4 className="font-medium">Token Expired</h4>
          </div>
          <p className="text-sm text-orange-600 mt-2">
            Your WordPress.com access token has expired. Please reconnect your account.
          </p>
          <Button
            onClick={handleConnect}
            variant="outline"
            size="sm"
            disabled={isConnecting}
            className="mt-3 border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reconnecting...
              </>
            ) : (
              'Reconnect Account'
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
            There was an error checking your WordPress.com connection. Please try again.
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

export default WordPressSettings;