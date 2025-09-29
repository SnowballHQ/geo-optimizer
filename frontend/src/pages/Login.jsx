import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { apiService } from '../utils/api';
import { toast } from 'react-toastify';
import GoogleSignIn from '../components/GoogleSignIn';
import { isSuperuser } from '../utils/auth';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLoginSuccess = async (response) => {
    // Check onboarding status and redirect accordingly
    try {
      const onboardingResponse = await apiService.getOnboardingStatus();

      if (onboardingResponse.data.isCompleted) {
        // User has completed onboarding, check if they have brands
        try {
          const brandsResponse = await apiService.getUserBrands();
          const userBrands = brandsResponse.data.brands || [];

          if (userBrands.length > 0) {
            // User has brands, redirect to dashboard with brand-dashboard state
            console.log('User has brands, going to brand dashboard');
            navigate('/dashboard?redirect=brand-dashboard');
          } else {
            // User has no brands, go to regular dashboard
            console.log('User has no brands, going to main dashboard');
            navigate('/dashboard');
          }
        } catch (brandsError) {
          console.error('Error fetching user brands:', brandsError);
          // If brands fetch fails, go to regular dashboard
          navigate('/dashboard');
        }
      } else {
        // User needs to complete onboarding
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // If there's an error, assume onboarding is needed
      navigate('/onboarding');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await apiService.login(formData);
      
      if (response.data.token) {
        localStorage.setItem('auth', response.data.token);
        toast.success('Login successful!');
        await handleLoginSuccess(response.data);
      } else {
        toast.error('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.msg || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignInSuccess = async (data) => {
    await handleLoginSuccess(data);
  };

  const handleGoogleSignInError = (error) => {
    console.error('Google sign-in failed:', error);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-primary rounded-2xl mb-6">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="text-3xl font-semibold text-[#4a4a6a] mb-2">
            What's your email address?
          </h1>
          <p className="text-[#4a4a6a]">
            Enter your credentials to access your workspace
          </p>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            {/* Google Sign-in */}
            <div className="mb-6">
              <GoogleSignIn 
                onSuccess={handleGoogleSignInSuccess}
                onError={handleGoogleSignInError}
                disabled={isLoading}
              />
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#b0b0d8]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#4a4a6a]">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email address..."
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-12 text-base border-[#b0b0d8] focus:border-[#6658f4] focus:ring-[#6658f4]"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password..."
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="h-12 text-base pr-12 border-[#b0b0d8] focus:border-[#6658f4] focus:ring-[#6658f4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4a4a6a] hover:text-[#6658f4] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Form Options */}
              <div className="flex items-center text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isLoading}
                    className="w-4 h-4 text-[#6658f4] border-[#b0b0d8] rounded focus:ring-[#6658f4]"
                  />
                  <span className="text-[#4a4a6a]">Remember for 30 days</span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-base font-medium gradient-primary hover:shadow-lg transition-all duration-200 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Continue with email"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Link to="/" className="text-sm text-[#6658f4] hover:underline font-medium">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
