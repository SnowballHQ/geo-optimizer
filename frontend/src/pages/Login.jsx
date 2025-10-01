import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Eye, EyeOff, ArrowLeft, Shield, CheckCircle, Star, Sparkles, TrendingUp } from 'lucide-react';
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
    try {
      const onboardingResponse = await apiService.getOnboardingStatus();

      if (onboardingResponse.data.isCompleted) {
        try {
          const brandsResponse = await apiService.getUserBrands();
          const userBrands = brandsResponse.data.brands || [];

          if (userBrands.length > 0) {
            console.log('User has brands, going to brand dashboard');
            navigate('/dashboard?redirect=brand-dashboard');
          } else {
            console.log('User has no brands, going to main dashboard');
            navigate('/dashboard');
          }
        } catch (brandsError) {
          console.error('Error fetching user brands:', brandsError);
          navigate('/dashboard');
        }
      } else {
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
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

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex relative overflow-hidden">
      {/* Background Effects */}
      <div className="gradient-orb gradient-orb-purple w-[600px] h-[600px] -top-48 -left-24 fixed" />
      <div className="gradient-orb gradient-orb-pink w-[500px] h-[500px] bottom-0 right-0 fixed" />
      <div className="dot-grid-subtle fixed inset-0" />

      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 relative z-10">
        <motion.div
          className="w-full max-w-md space-y-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Back to Home */}
          <motion.div variants={fadeInUp}>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span>Back to home</span>
            </Link>
          </motion.div>

          {/* Logo & Title */}
          <motion.div className="text-center space-y-4" variants={fadeInUp}>
            <Link to="/" className="inline-flex items-center justify-center w-16 h-16 gradient-primary rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <span className="text-2xl font-bold text-white">S</span>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">
                Welcome back
              </h1>
              <p className="text-gray-600">
                Sign in to continue to your workspace
              </p>
            </div>
          </motion.div>

          {/* Login Form */}
          <motion.div variants={fadeInUp}>
            <Card className="border border-gray-200 shadow-xl">
              <CardContent className="p-8">
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
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email address</label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="h-12 text-base border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="h-12 text-base pr-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isLoading}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-gray-600">Remember me</span>
                    </label>
                    <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base font-semibold gradient-primary hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>

                {/* Security Badge */}
                <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Secured with 256-bit encryption</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Register Link */}
          <motion.div className="text-center text-sm" variants={fadeInUp}>
            <span className="text-gray-600">Don't have an account? </span>
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">
              Sign up for free
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Visual Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
            animate={{ backgroundPosition: ['0px 0px', '40px 40px'] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <motion.div
          className="relative z-10 space-y-12 max-w-lg"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* Brand Message */}
          <div className="space-y-6">
            <Badge className="bg-white/10 text-white border-0 backdrop-blur-xl px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Content Intelligence
            </Badge>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Join 10,000+ creators optimizing their content
            </h2>
            <p className="text-primary-100 text-lg">
              Analyze, optimize, and enhance your content with advanced AI. Get real-time SEO recommendations and performance analytics.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {[
              { icon: TrendingUp, text: "250% increase in content quality" },
              { icon: CheckCircle, text: "Real-time SEO optimization" },
              { icon: Star, text: "Trusted by leading brands" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-3 text-white"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
              >
                <div className="w-8 h-8 bg-white/10 backdrop-blur-xl rounded-lg flex items-center justify-center">
                  <feature.icon className="w-4 h-4" />
                </div>
                <span className="text-primary-100">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Testimonial */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <div className="flex items-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-white mb-4 leading-relaxed">
              "Snowball transformed our content strategy. The insights are incredibly accurate and actionable."
            </p>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">SJ</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Sarah Johnson</p>
                <p className="text-primary-200 text-xs">Content Manager at TechCorp</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
