import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Layers, ExternalLink, Check, AlertCircle, Loader2 } from 'lucide-react';

const WebflowSettings = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [webflowInfo, setWebflowInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/webflow`;

  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  // Handle OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const webflowSuccess = urlParams.get('webflow_success');
    const webflowError = urlParams.get('webflow_error');
    const accessToken = urlParams.get('access_token');
    const userId = urlParams.get('user_id');
    const userEmail = urlParams.get('user_email');
    const error = urlParams.get('error');

    if (webflowSuccess === '1' && accessToken) {
      // Save credentials via API
      saveWebflowCredentials(accessToken, userId, userEmail);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (webflowError === '1') {
      toast.error(`Webflow connection failed: ${error || 'Unknown error'}`);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const saveWebflowCredentials = async (accessToken, webflowUserId, userEmail) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/save-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth')}`
        },
        body: JSON.stringify({ 
          accessToken, 
          userId: webflowUserId, 
          userEmail 
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        await checkConnectionStatus();
      } else {
        toast.error(data.error || 'Failed to save Webflow credentials');
      }
    } catch (error) {
      console.error('Error saving Webflow credentials:', error);
      toast.error('Failed to save Webflow credentials');
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
          setWebflowInfo(data);
        } else {
          setWebflowInfo(null);
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
        setWebflowInfo(null);
      } else {
        toast.error(data.message || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect from Webflow');
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
          <p className="text-sm text-gray-600">Loading Webflow integration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
        <div className="flex items-center space-x-3">
          <Layers className="w-6 h-6 text-[#146ef5]" />
          <div>
            <h3 className="font-medium text-gray-900">Webflow Site</h3>
            <p className="text-sm text-gray-600">Connect your site to publish blog content</p>
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
      {connectionStatus === 'connected' && webflowInfo && (
        <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Connected Account</h4>
              <div className="space-y-1 text-sm text-blue-700">
                <p><strong>Email:</strong> {webflowInfo.userEmail || 'Unknown'}</p>
                <p><strong>User ID:</strong> {webflowInfo.webflowUserId || 'Unknown'}</p>
                <p><strong>Connected:</strong> {new Date(webflowInfo.connectedAt).toLocaleDateString()}</p>
                <p><strong>Permissions:</strong> {webflowInfo.scopes}</p>
              </div>
            </div>
            
            <div className="space-x-2">
              <Button
                onClick={() => window.open('https://webflow.com/dashboard', '_blank')}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Dashboard
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
          <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="font-medium text-gray-900 mb-2">Connect Your Webflow Site</h4>
          <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
            Connect your Webflow site to automatically publish blog content from our platform directly to your site's CMS.
          </p>
          
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-[#146ef5] hover:bg-[#0d5ad6] text-white"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Layers className="w-4 h-4 mr-2" />
                Connect Webflow Site
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
            There was an error checking your Webflow connection. Please try again.
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

export default WebflowSettings;