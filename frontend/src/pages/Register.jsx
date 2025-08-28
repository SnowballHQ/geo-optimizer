import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { apiService } from '../utils/api';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await apiService.register(registrationData);
      
      if (response.data && response.data.token) {
        // Store the token for automatic login
        localStorage.setItem('auth', response.data.token);
        
        toast.success('Registration successful! Welcome to Snowball!');
        
        // Check onboarding status and redirect accordingly
        try {
          const onboardingResponse = await apiService.getOnboardingStatus();
          
          if (onboardingResponse.data.isCompleted) {
            // User has completed onboarding, go to dashboard
            navigate('/dashboard');
          } else {
            // User needs to complete onboarding
            navigate('/onboarding');
          }
        } catch (onboardingError) {
          console.error('Error checking onboarding status:', onboardingError);
          // If we can't check onboarding status, go to onboarding
          navigate('/onboarding');
        }
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.msg || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            Create your account
          </h1>
          <p className="text-[#4a4a6a]">
            Get started with your SEO analysis journey
          </p>
        </div>

        {/* Register Form */}
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div className="space-y-2">
                <Input
                  type="text"
                  name="name"
                  placeholder="Enter your full name..."
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-12 text-base border-[#b0b0d8] focus:border-[#6658f4] focus:ring-[#6658f4]"
                />
              </div>

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
                    placeholder="Create a password..."
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

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your password..."
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="h-12 text-base pr-12 border-[#b0b0d8] focus:border-[#6658f4] focus:ring-[#6658f4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4a4a6a] hover:text-[#6658f4] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
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
                    <span>Creating account...</span>
                  </div>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-[#4a4a6a]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#6658f4] hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
