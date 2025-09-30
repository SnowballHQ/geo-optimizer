import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  BarChart3, 
  FileText, 
  Globe, 
  Search, 
  Target, 
  TrendingUp, 
  Users, 
  Star,
  ArrowRight,
  CheckCircle,
  Play,
  Mail,
  Twitter,
  Linkedin,
  Github
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Content Quality Scoring",
      description: "AI-powered analysis of your blog content with detailed scoring across readability, SEO, and engagement metrics."
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "SEO Optimization",
      description: "Comprehensive SEO analysis with actionable recommendations to improve your search engine rankings."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Readability Analysis",
      description: "Advanced readability scoring using our GEO framework to ensure your content resonates with your audience."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Growth Tracking",
      description: "Monitor your content performance over time with detailed analytics and improvement suggestions."
    }
  ];

  const steps = [
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Enter your domain",
      description: "Simply input your website URL to get started with the analysis."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "AI Analysis",
      description: "Our advanced AI analyzes your content using multiple frameworks and metrics."
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Get Recommendations",
      description: "Receive detailed, actionable recommendations to improve your content quality."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Content Manager",
      company: "TechCorp",
      avatar: "SJ",
      rating: 5,
      text: "Snowball has transformed how we approach content creation. The insights are incredibly valuable."
    },
    {
      name: "Michael Chen",
      role: "SEO Specialist",
      company: "DigitalFlow",
      avatar: "MC",
      rating: 5,
      text: "The blog analysis feature is game-changing. It's like having an expert content strategist on your team."
    },
    {
      name: "Emily Rodriguez",
      role: "Marketing Director",
      company: "GrowthLab",
      avatar: "ER",
      rating: 5,
      text: "Finally, a tool that gives us actionable insights for content optimization. Highly recommended!"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-[#b0b0d8] bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="text-lg font-semibold text-[#4a4a6a]">Snowball</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/dashboard" className="text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors duration-200">
                Dashboard
              </Link>
              <Link to="/dashboard" className="text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors duration-200">
                Blog Analysis
              </Link>
              <Link to="/dashboard" className="text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors duration-200">
                History
              </Link>
              <Link to="/dashboard" className="text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors duration-200">
                Settings
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleLogin} className="text-sm text-[#4a4a6a] hover:text-[#6658f4]">
                Log in
              </Button>
              <Button onClick={handleGetStarted} className="text-sm gradient-primary hover:shadow-lg transition-all duration-200 text-white">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-[#f8f9ff] to-[#f0f2ff]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <Badge variant="secondary" className="mb-4 bg-white text-[#4a4a6a] border-[#b0b0d8] shadow-sm">
              🚀 Now with AI-powered insights
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-black leading-tight">
              Analyze and optimize your{' '}
              <span className="text-gradient-primary">blog content</span>{' '}
              with AI-powered insights
            </h1>
            
            <p className="text-xl text-black max-w-3xl mx-auto leading-relaxed">
              Transform your content strategy with advanced AI analysis. Get detailed scoring, 
              SEO recommendations, and actionable insights to improve your blog performance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" onClick={handleGetStarted} className="text-base px-8 py-3 gradient-primary hover:shadow-lg transition-all duration-200 text-white">
                Start Analyzing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-base px-8 py-3 border-[#6658f4] text-[#6658f4] hover:bg-[#6658f4] hover:text-white transition-all duration-200">
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-16">
            <Card className="border-0.3 border-[#b0b0d8] shadow-lg bg-gradient-to-br from-white to-[#f8f9ff]">
              <CardContent className="p-8">
                <div className="aspect-video bg-gradient-to-br from-[#f8f9ff] to-white rounded-lg flex items-center justify-center border border-[#e8eaff]">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#6658f4] to-[#7c77ff] rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-black">Snowball Dashboard Preview</h3>
                      <p className="text-sm text-black">Advanced analytics and insights at your fingertips</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#f8f9ff] via-white to-[#f0f2ff]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black">
              Everything you need to optimize your content
            </h2>
            <p className="text-lg text-black max-w-2xl mx-auto">
              Powerful features designed to help you create better content and grow your audience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0.3 border-[#b0b0d8] bg-gradient-to-br from-white to-[#f8f9ff] card-hover glow-primary shadow-sm">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#6658f4] to-[#7c77ff] rounded-lg flex items-center justify-center mb-4 shadow-md">
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-black mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-black">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-[#f8f9ff] to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black">
              How it works
            </h2>
            <p className="text-lg text-black max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#6658f4] to-[#7c77ff] rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <div className="text-white">
                      {step.icon}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-[#b0b0d8] to-[#d5d6eb] transform translate-x-4">
                      <div className="w-full h-full bg-gradient-to-r from-[#6658f4] to-[#7c77ff]"></div>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-black">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#f0f2ff] via-[#f8f9ff] to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black">
              Loved by content creators worldwide
            </h2>
            <p className="text-lg text-black max-w-2xl mx-auto">
              See what our users are saying about Snowball.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0.3 border-[#b0b0d8] bg-gradient-to-br from-white to-[#f8f9ff] card-hover shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-black mb-4">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#6658f4] to-[#7c77ff] rounded-full flex items-center justify-center shadow-md">
                      <span className="text-sm font-semibold text-white">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black">{testimonial.name}</p>
                      <p className="text-xs text-black">{testimonial.role} at {testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-[#f8f9ff] to-[#f0f2ff]">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-0.3 border-[#b0b0d8] bg-gradient-to-br from-white to-[#f8f9ff] shadow-lg">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                Ready to transform your content?
              </h2>
              <p className="text-lg text-black mb-8 max-w-2xl mx-auto">
                Join thousands of content creators who are already using Snowball to improve their blog performance.
              </p>
              <Button size="lg" onClick={handleGetStarted} className="text-base px-8 py-3 gradient-primary hover:shadow-lg transition-all duration-200 text-white">
                Start Your Free Analysis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#b0b0d8] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
                <span className="text-lg font-semibold text-black">Snowball</span>
              </div>
              <p className="text-sm text-black">
                AI-powered content analysis and optimization platform.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-black">Product</h3>
              <div className="space-y-2">
                <Link to="/dashboard" className="block text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  Blog Analysis
                </Link>
                <Link to="/dashboard" className="block text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  Domain Analysis
                </Link>
                <Link to="/dashboard" className="block text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  SEO Tools
                </Link>
                <Link to="/dashboard" className="block text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  Analytics
                </Link>
              </div>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-black">Company</h3>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  About
                </a>
                <a href="#" className="block text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  Blog
                </a>
                <a href="#" className="block text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  Careers
                </a>
                <a href="#" className="block text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  Contact
                </a>
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-black">Legal</h3>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="block text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="block text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  Cookie Policy
                </a>
                <a href="#" className="block text-sm text-[#4a4a6a] hover:text-[#6658f4] transition-colors">
                  GDPR
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-[#b0b0d8] mt-12 pt-8 text-center">
            <p className="text-sm text-black">
              © 2024 Snowball. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;