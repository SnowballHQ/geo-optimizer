import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Eye, EyeOff, ArrowLeft, Shield, CheckCircle, Star, Sparkles, TrendingUp, Check, X } from 'lucide-react';
import { apiService } from '../utils/api';
import { toast } from 'react-toastify';
import GoogleSignIn from '../components/GoogleSignIn';

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

  const handleRegisterSuccess = async (response) => {
    try {
      const onboardingResponse = await apiService.getOnboardingStatus();

      if (onboardingResponse.data.isCompleted) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (onboardingError) {
      console.error('Error checking onboarding status:', onboardingError);
      navigate('/onboarding');
    }
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
        localStorage.setItem('auth', response.data.token);
        toast.success('Registration successful! Welcome to Snowball!');
        await handleRegisterSuccess(response.data);
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

  const handleGoogleSignInSuccess = async (data) => {
    await handleRegisterSuccess(data);
  };

  const handleGoogleSignInError = (error) => {
    console.error('Google sign-in failed:', error);
  };

  // Password strength calculator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500'];

    return { strength, label: labels[strength], color: colors[strength] };
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
          
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">
                Create your account
              </h1>
          
            </div>
          </motion.div>

          {/* Register Form */}
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
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Full name</label>
                    <Input
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="h-12 text-base border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

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
                        placeholder="Create a strong password"
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

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                passwordStrength.strength >= level
                                  ? passwordStrength.strength === 1
                                    ? 'bg-red-500'
                                    : passwordStrength.strength === 2
                                    ? 'bg-orange-500'
                                    : passwordStrength.strength === 3
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        {passwordStrength.label && (
                          <p className={`text-xs font-medium ${passwordStrength.color}`}>
                            Password strength: {passwordStrength.label}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Confirm password</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="h-12 text-base pr-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Password Match Indicator */}
                    {formData.confirmPassword && (
                      <div className="flex items-center space-x-2">
                        {formData.password === formData.confirmPassword ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-600 font-medium">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-red-500" />
                            <span className="text-xs text-red-600 font-medium">Passwords don't match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Terms & Privacy */}
                  <div className="text-xs text-gray-600">
                    By creating an account, you agree to our{' '}
                    <Link to="/terms" className="text-primary-600 hover:underline font-medium">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-primary-600 hover:underline font-medium">
                      Privacy Policy
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
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      "Create account"
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

          {/* Login Link */}
          <motion.div className="text-center text-sm" variants={fadeInUp}>
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">
              Sign in
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
              Get Started in Minutes
            </Badge>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Transform your content strategy with AI
            </h2>
            <p className="text-primary-100 text-lg">
              Join thousands of content creators who are already using Snowball to optimize their content and drive better results.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: CheckCircle, text: "14-day free trial, no credit card required" },
              { icon: TrendingUp, text: "Instant AI-powered insights" },
              { icon: Star, text: "Cancel anytime, no questions asked" }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-3 text-white"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
              >
                <div className="w-8 h-8 bg-white/10 backdrop-blur-xl rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-4 h-4" />
                </div>
                <span className="text-primary-100">{benefit.text}</span>
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
              "Setting up was incredibly easy. Within minutes, I had my first analysis running and the insights were game-changing!"
            </p>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">MC</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Michael Chen</p>
                <p className="text-primary-200 text-xs">SEO Specialist at DigitalFlow</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
