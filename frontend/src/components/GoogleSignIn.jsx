import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { apiService } from '../utils/api';

const GoogleSignIn = ({ onSuccess, onError, disabled = false }) => {
  const googleButtonRef = useRef();
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [initAttempts, setInitAttempts] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false); // New state for backend processing
  const maxAttempts = 50; // 5 seconds with 100ms intervals

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log('🔑 Google Client ID:', clientId);
    console.log('🌐 Environment variables:', import.meta.env);
    console.log('🔍 Disabled prop:', disabled);
    console.log('🌍 Current URL:', window.location.href);
    
    if (!clientId) {
      console.error('❌ Google Client ID is missing from environment variables');
      console.error('📝 Available env vars:', Object.keys(import.meta.env));
      return;
    }
    
    const initializeGoogle = (attemptNumber = 1) => {
      console.log(`🔄 Attempt ${attemptNumber}/${maxAttempts} to initialize Google Sign-in`);
      
      if (window.google && window.google.accounts && window.google.accounts.id) {
        console.log('✅ Google API loaded, initializing with Client ID:', clientId.substring(0, 20) + '...');
        
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          if (googleButtonRef.current) {
            console.log('🎯 Rendering Google button...');
            window.google.accounts.id.renderButton(
              googleButtonRef.current,
              {
                theme: 'outline',
                size: 'large',
                type: 'standard',
                shape: 'rectangular',
                text: 'signin_with',
                logo_alignment: 'left',
                width: '100%'
              }
            );
            setIsGoogleLoaded(true);
            console.log('✅ Google button rendered successfully');
          } else {
            console.error('❌ googleButtonRef.current is null');
          }
        } catch (error) {
          console.error('❌ Google Sign-in initialization error:', error);
        }
      } else {
        setInitAttempts(attemptNumber);
        if (attemptNumber < maxAttempts) {
          console.log(`⏳ Google API not loaded yet (attempt ${attemptNumber}/${maxAttempts}), retrying in 100ms...`);
          console.log('🔍 Window.google status:', window.google ? 'exists' : 'undefined');
          setTimeout(() => initializeGoogle(attemptNumber + 1), 100);
        } else {
          console.error('❌ Google API failed to load after maximum attempts');
        }
      }
    };

    if (!disabled && !isProcessing) {
      initializeGoogle();
    }
  }, [disabled]);

  const handleCredentialResponse = async (response) => {
    try {
      console.log('Google credential response:', response);
      
      // Show loading state during backend processing
      setIsProcessing(true);
      
      // Send the Google ID token to our backend for verification
      const result = await apiService.post('/api/v1/auth/google', {
        idToken: response.credential
      });

      if (result.data.success && result.data.token) {
        // Store the auth token
        localStorage.setItem('auth', result.data.token);
        toast.success('Google sign-in successful!');
        
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        throw new Error('Failed to authenticate with Google');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      const errorMessage = error.response?.data?.msg || 'Google sign-in failed. Please try again.';
      toast.error(errorMessage);
      
      if (onError) {
        onError(error);
      }
    } finally {
      // Always hide loading state
      setIsProcessing(false);
    }
  };

  if (disabled) {
    return (
      <div className="w-full h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 text-sm">Google Sign-in unavailable</span>
      </div>
    );
  }

  // Show processing state during backend authentication
  if (isProcessing) {
    return (
      <div className="w-full h-12 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-600 text-sm">Authenticating with Google...</span>
        </div>
      </div>
    );
  }

  // Show loading state while Google API loads
  if (!isGoogleLoaded && initAttempts > 0 && initAttempts < maxAttempts) {
    return (
      <div className="w-full h-12 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-600 text-sm">Loading Google Sign-in... ({initAttempts}/{maxAttempts})</span>
        </div>
      </div>
    );
  }

  // Show error state if Google API failed to load
  if (initAttempts >= maxAttempts && !isGoogleLoaded) {
    return (
      <div className="w-full h-12 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
        <span className="text-red-600 text-sm">Google Sign-in failed to load. Please refresh the page.</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={googleButtonRef} className="w-full flex justify-center"></div>
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500">
          Debug: Loaded={isGoogleLoaded.toString()}, Attempts={initAttempts}, ClientID={import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Present' : 'Missing'}
        </div>
      )}
    </div>
  );
};

export default GoogleSignIn;