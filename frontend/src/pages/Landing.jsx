import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
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
  Sparkles,
  Zap,
  Shield,
  Rocket,
  ChevronDown,
  Brain,
  Bot,
  Plus,
  Minus,
  Check,
  BookOpen
} from 'lucide-react';
import { SiWordpress, SiShopify, SiWebflow } from 'react-icons/si';
import BlogCard from '../components/BlogCard';
import { getBlogPosts } from '../services/contentful';

const Landing = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [blogPosts, setBlogPosts] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // Fetch blog posts on component mount
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoadingBlogs(true);
      try {
        const posts = await getBlogPosts(3); // Fetch 3 latest posts
        setBlogPosts(posts);
      } catch (error) {
        console.error('Error loading blog posts:', error);
        // Silently fail - blog section won't show if there's an error
      } finally {
        setLoadingBlogs(false);
      }
    };

    fetchBlogs();
  }, []);

  // Parallax scroll effect
  const { scrollY } = useScroll();

  // Hero text: moves slower, stays visible longer
  const heroTextY = useTransform(scrollY, [0, 500], [0, -50]);
  const heroTextOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  // Hero image: moves faster, comes over the text
  const heroImageY = useTransform(scrollY, [0, 500], [0, -150]);
  const heroImageScale = useTransform(scrollY, [0, 500], [1, 1.02]);

  // Animation variants - Linear-inspired timing
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1] // Custom cubic bezier for smooth animation
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  // Data
  const clientLogos = [
    'TechCorp', 'DataFlow', 'GrowthLab', 'CloudSync', 'InnovateCo',
    'MarketPro', 'ContentHub', 'SEOBoost', 'AnalyticsPro', 'BrandWise',
    'DigitalEdge', 'ContentMaster'
  ];

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Analysis",
      description: "Advanced algorithms analyze content quality, engagement, and SEO in real-time."
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "SEO Optimization",
      description: "Get instant recommendations to boost your search rankings and visibility."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Performance Tracking",
      description: "Monitor content performance with detailed analytics and insights."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Audience Insights",
      description: "Understand your audience with advanced readability and engagement metrics."
    }
  ];

  const showcaseSections = [
    {
      title: "Analyze Your Content Quality",
      description: "Get comprehensive quality scores and detailed recommendations for every piece of content.",
      image: "/images/landing/content-quality.png"
    },
    {
      title: "Track SEO Rankings in Real-Time",
      description: "Monitor your search performance and identify opportunities for improvement instantly.",
      image: "/images/landing/seo-rankings.png"
    },
    {
      title: "Identify Content Gaps and Take Action",
      description: "Discover what's missing from your content strategy and get actionable insights to fill the gaps.",
      image: "/images/landing/content-gap.png"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Content Manager",
      company: "TechCorp",
      avatar: "SJ",
      image: "/api/placeholder/80/80",
      text: "Snowball transformed our content strategy. The insights are incredibly accurate and actionable.",
      metric: "+150% Traffic"
    },
    {
      name: "Michael Chen",
      role: "SEO Specialist",
      company: "DigitalFlow",
      avatar: "MC",
      image: "/api/placeholder/80/80",
      text: "Like having a content expert working 24/7. Our engagement rates have never been better.",
      metric: "+89% Engagement"
    },
    {
      name: "Emily Rodriguez",
      role: "Marketing Director",
      company: "GrowthLab",
      avatar: "ER",
      image: "/api/placeholder/80/80",
      text: "The quality scores and recommendations are spot-on. Our content performance improved dramatically.",
      metric: "+200% Quality Score"
    }
  ];

  const useCases = [
    {
      title: "For Content Marketers",
      description: "Optimize every piece of content for maximum impact and engagement.",
      benefits: ["Content quality analysis", "SEO recommendations", "Audience insights"]
    },
    {
      title: "For SEO Teams",
      description: "Track rankings, analyze competitors, and identify optimization opportunities.",
      benefits: ["Real-time tracking", "Competitor analysis", "Keyword insights"]
    },
    {
      title: "For Bloggers",
      description: "Create better content that ranks higher and engages more readers.",
      benefits: ["Writing guidance", "Readability scores", "Performance metrics"]
    }
  ];

  const pricingTiers = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for individual bloggers and small sites",
      features: [
        "10 content analyses per month",
        "Basic SEO recommendations",
        "Performance tracking",
        "Email support"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Growth",
      price: "$99",
      period: "/month",
      description: "Ideal for growing businesses and content teams",
      features: [
        "Unlimited content analyses",
        "Advanced SEO optimization",
        "Competitor analysis",
        "Team collaboration",
        "Priority support",
        "Custom reports"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations with specific needs",
      features: [
        "Everything in Growth",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantee",
        "Advanced security",
        "Training & onboarding"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const integrations = [
    { name: 'WordPress', color: '#21759b', icon: SiWordpress },
    { name: 'Shopify', color: '#96bf48', icon: SiShopify },
    { name: 'Webflow', color: '#4353ff', icon: SiWebflow }
  ];

  const faqs = [
    {
      question: "How does Snowball's content analysis work?",
      answer: "Snowball uses advanced AI algorithms to analyze your content across multiple dimensions including SEO, readability, engagement potential, and quality. We provide actionable recommendations based on industry best practices and real-time data."
    },
    {
      question: "Can I analyze content from any platform?",
      answer: "Yes! Snowball works with any URL or content management system. Simply paste your URL or upload your content, and our AI will analyze it instantly. We also offer integrations with popular platforms like WordPress, Medium, and more."
    },
    {
      question: "What makes Snowball different from other SEO tools?",
      answer: "Unlike traditional SEO tools that focus only on keywords, Snowball provides comprehensive content intelligence. We analyze quality, engagement, readability, and SEO together, giving you a complete picture of your content's performance and potential."
    },
    {
      question: "How accurate are the content quality scores?",
      answer: "Our quality scores are based on analyzing millions of high-performing pieces of content. Our AI models are continuously trained on the latest best practices and ranking factors, ensuring highly accurate and up-to-date recommendations."
    },
    {
      question: "Do you offer a free trial?",
      answer: "Yes! We offer a 14-day free trial on all plans. No credit card required. You'll get full access to all features to see how Snowball can transform your content strategy."
    }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-[100] border-b border-gray-200/60 bg-white/80 backdrop-blur-2xl sticky top-0"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="text-lg font-semibold text-gradient-primary">
                Snowball
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                Features
              </a>
              <Link to="/blog" className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                Blog
              </Link>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                Pricing
              </a>
              <a href="#testimonials" className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                Customers
              </a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                FAQ
              </a>
            </div>
            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                <Button variant="ghost" onClick={handleLogin} className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors duration-150">
                  Log in
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                <Button onClick={handleGetStarted} className="text-sm gradient-primary hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-150 text-white font-medium px-5 py-2">
                  Get Started
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-primary-50/10 to-white overflow-hidden" style={{ contain: 'layout style paint' }}>
        {/* Background Orbs - Very subtle */}
        <div className="gradient-orb gradient-orb-purple w-[600px] h-[600px] -top-48 -right-24 opacity-40" />

        {/* Dot Grid */}
        <div className="dot-grid-subtle" />

        <div className="max-w-7xl mx-auto relative">
          {/* Hero Text with Parallax */}
          <motion.div
            className="text-center space-y-8 max-w-4xl mx-auto relative z-10"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            style={{ y: heroTextY, opacity: heroTextOpacity }}
          >
            <motion.div variants={fadeInUp}>
              <Badge className="gradient-primary text-white border-0 shadow-md px-3 py-1.5 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                AI-Powered Content Intelligence
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-bold text-black leading-[1.1] tracking-tight">
              Dominate Content With
              <span className="block text-gradient-primary mt-2">AI-Powered Insights</span>
            </motion.h1>

            <motion.p
              className="text-lg text-gray-600 max-w-2xl mx-auto leading-[1.6] tracking-[-0.01em]"
              variants={fadeInUp}
            >
              Analyze, optimize, and enhance your content with advanced AI. Get real-time SEO recommendations and performance analytics that drive results.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
              variants={fadeInUp}
            >
              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="text-base px-8 py-3 gradient-primary hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-200 text-white font-medium tracking-tight"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <button
                  className="text-base px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium tracking-tight flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Watch Demo</span>
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center items-center gap-6 pt-6 text-xs text-gray-500"
              variants={fadeInUp}
            >
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                <span>No credit card required</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Dashboard Preview Image with Parallax */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            style={{ y: heroImageY, scale: heroImageScale }}
            className="mt-20 max-w-5xl mx-auto relative z-20"
          >
            <div className="relative group">
              {/* Subtle Glowing effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl opacity-10 group-hover:opacity-20 blur-3xl transition-opacity duration-300" />

              {/* Image container */}
              <div className="relative bg-white rounded-xl shadow-xl p-1.5 border border-gray-200/40">
                <img
                  src="/images/landing/hero-dashboard.png"
                  alt="Snowball AI Dashboard Preview"
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Client Logos Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm font-medium text-gray-500 mb-8 uppercase tracking-wide">
            Trusted by leading content teams
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {clientLogos.map((logo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ y: -2, scale: 1.05 }}
                className="text-gray-400 hover:text-primary-600 transition-all duration-300 ease-out font-semibold text-sm cursor-pointer grayscale hover:grayscale-0 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                {logo}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Metrics Section */}
      <section className="py-24 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Real Results from Real Users
            </h2>
            <p className="text-primary-200 text-lg">
              See how Snowball transforms content performance
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedMetricCard
              value={250}
              suffix="%"
              label="Increase in Content Quality"
              icon={<TrendingUp className="w-12 h-12" />}
              delay={0}
            />
            <AnimatedMetricCard
              value={180}
              suffix="%"
              label="More SEO Visibility"
              icon={<Search className="w-12 h-12" />}
              delay={0.2}
            />
            <AnimatedMetricCard
              value={95}
              suffix="%"
              label="Higher Engagement Rates"
              icon={<Users className="w-12 h-12" />}
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Key Features - Icon Based */}
      <section id="features" className="py-28 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50/10 via-white to-primary-50/10 relative overflow-hidden" style={{ contain: 'layout style paint' }}>
        {/* Subtle Orb */}
        <div className="gradient-orb gradient-orb-pink w-[500px] h-[500px] top-0 right-0" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center space-y-3 mb-20"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight leading-[1.15]">
              Everything you need to <span className="text-gradient-primary">excel</span>
            </h2>
            <p className="text-base text-gray-600 max-w-xl mx-auto tracking-[-0.01em]">
              Powerful tools designed to transform your content strategy
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Visual Product Showcase */}
      <section className="py-28 md:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ contain: 'layout style paint' }}>
        {/* Background Effects */}
        <div className="gradient-orb gradient-orb-blue w-[500px] h-[500px] top-1/2 left-0" />

        <div className="max-w-7xl mx-auto space-y-24 relative z-10">
          {showcaseSections.map((section, index) => (
            <ShowcaseSection key={index} section={section} index={index} reversed={index % 2 !== 0} />
          ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-900 to-primary-700 text-white relative overflow-hidden" style={{ contain: 'layout style paint' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <motion.div
          className="max-w-4xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Content quality directly impacts 70% of search rankings
          </h2>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Don't let poor content hold you back. Join thousands of creators who've transformed their strategy with Snowball's AI-powered insights.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="mt-8 text-lg px-10 py-6 bg-white text-primary-700 hover:bg-gray-100 hover:shadow-xl transition-all duration-300 font-semibold"
            >
              Start Optimizing Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Customer Success Stories */}
      <section id="testimonials" className="py-28 md:py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center space-y-4 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="gradient-primary text-white border-0 shadow-lg px-4 py-2 text-sm font-medium">
              <Users className="w-4 h-4 mr-2" />
              Customer Success
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-black">
              Loved by <span className="text-gradient-primary">content creators</span> worldwide
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50/20 via-white to-primary-50/20 relative overflow-hidden" style={{ contain: 'layout style paint' }}>
        {/* Background Effects */}
        <div className="gradient-orb gradient-orb-purple w-[400px] h-[400px] bottom-0 right-0" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center space-y-4 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-black">
              Built for every <span className="text-gradient-primary">content team</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're a solo blogger or an enterprise team, Snowball scales with you
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <UseCaseCard key={index} useCase={useCase} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-28 md:py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center space-y-4 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge className="gradient-primary text-white border-0 shadow-lg px-4 py-2 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Flexible Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-black">
              Choose the <span className="text-gradient-primary">perfect plan</span> for you
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade as you grow. All plans include a 14-day free trial.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <PricingCard key={index} tier={tier} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Seamless <span className="text-gradient-primary">Integration</span>
            </h3>
            <p className="text-lg text-gray-600">
              Connect your content platform in seconds
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-items-center">
            {integrations.map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.05 }}
                className="group w-full"
              >
                <Card className="border-2 border-gray-200 hover:border-primary-300 bg-white shadow-sm hover:shadow-xl transition-all duration-300 ease-out">
                  <CardContent className="p-8">
                    <div className="text-center">
                      {/* Logo */}
                      <motion.div
                        className="w-24 h-24 mx-auto mb-6 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-2xl"
                        style={{ backgroundColor: integration.color + '08' }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <integration.icon
                          className="transition-all duration-300"
                          style={{ color: integration.color }}
                          size={56}
                        />
                      </motion.div>

                      {/* Name */}
                      <h4 className="text-2xl font-bold text-black mb-3 group-hover:text-primary-600 transition-colors duration-300">
                        {integration.name}
                      </h4>

                      {/* Status Badge */}
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs px-2 py-1">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Available
                      </Badge>

                      {/* Connect Button */}
                      <motion.div
                        className="mt-4"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-gray-300 hover:border-primary-400 hover:text-primary-600 transition-all duration-300"
                        >
                          Connect
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Coming Soon */}
          <motion.p
            className="text-center text-sm text-gray-500 mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            More integrations coming soon
          </motion.p>
        </div>
      </section>

      {/* Blog Section */}
      {blogPosts.length > 0 && (
        <section className="py-28 md:py-32 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div
              className="text-center space-y-4 mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="gradient-primary text-white border-0 shadow-lg px-4 py-2 text-sm font-medium">
                <BookOpen className="w-4 h-4 mr-2" />
                Latest Insights
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-black">
                From our <span className="text-gradient-primary">blog</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Expert tips, insights, and best practices for content optimization
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {blogPosts.map((post, index) => (
                <BlogCard key={post.id} post={post} index={index} />
              ))}
            </div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Link to="/blog">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-gray-300 hover:border-primary-400 hover:text-primary-600 transition-all duration-300"
                >
                  View All Articles
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50/20 via-white to-primary-50/20 relative overflow-hidden" style={{ contain: 'layout style paint' }}>
        {/* Background Effects */}
        <div className="gradient-orb gradient-orb-blue w-[400px] h-[400px] top-0 left-0" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            className="text-center space-y-4 mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-black">
              Frequently asked <span className="text-gradient-primary">questions</span>
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Snowball
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                faq={faq}
                index={index}
                isOpen={openFaqIndex === index}
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden" style={{ contain: 'layout style paint' }}>
        {/* Background Effects */}
        <div className="gradient-orb gradient-orb-purple w-[400px] h-[400px] top-1/2 right-0" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="border-0 bg-white shadow-2xl overflow-hidden">
              <CardContent className="p-12">
                <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <Rocket className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
                  Ready to <span className="text-gradient-primary">transform</span> your content?
                </h2>

                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Join over 10,000 content creators who are already using Snowball to optimize their content and grow their audience.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="lg"
                      onClick={handleGetStarted}
                      className="text-lg px-12 py-6 gradient-primary hover:shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 text-white font-semibold"
                    >
                      Start Your Free Trial
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>

                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>No credit card required • 14-day free trial</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
                <span className="text-lg font-semibold text-gradient-primary">
                  Snowball
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                AI-powered content analysis and optimization platform helping creators worldwide.
              </p>
              <div className="flex space-x-4">
                {[
                  { icon: <Globe className="w-5 h-5" />, href: "#" },
                  { icon: <Users className="w-5 h-5" />, href: "#" },
                  { icon: <Star className="w-5 h-5" />, href: "#" },
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="text-gray-400 hover:text-primary-600 transition-colors duration-200"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-black">Product</h3>
              <div className="space-y-3">
                {['Features', 'Pricing', 'Integrations', 'API', 'Changelog'].map((link) => (
                  <div key={link}>
                    <a href="#" className="block text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200">
                      {link}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-black">Company</h3>
              <div className="space-y-3">
                {['About', 'Blog', 'Careers', 'Contact'].map((link) => (
                  <div key={link}>
                    <a href="#" className="block text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200">
                      {link}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-black">Legal</h3>
              <div className="space-y-3">
                {['Privacy', 'Terms', 'Security'].map((link) => (
                  <div key={link}>
                    <a href="#" className="block text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200">
                      {link}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2025 Snowball. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Component: Feature Card
const FeatureCard = ({ feature, index }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="h-full"
    >
      <Card className="border border-gray-200/60 bg-white shadow-sm hover:shadow-lg hover:border-primary-200/60 transition-all duration-200 ease-out h-full rounded-lg">
        <CardContent className="p-6">
          <motion.div
            className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4 shadow-sm"
            whileHover={{ scale: 1.05, rotate: 3 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-white">
              {feature.icon}
            </div>
          </motion.div>
          <h3 className="text-lg font-semibold text-black mb-2 tracking-tight">
            {feature.title}
          </h3>
          <p className="text-gray-600 leading-relaxed text-sm tracking-[-0.01em]">
            {feature.description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Component: Showcase Section
const ShowcaseSection = ({ section, index, reversed }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6 }}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${reversed ? 'lg:flex-row-reverse' : ''}`}
    >
      <div className={`space-y-6 ${reversed ? 'lg:order-2' : ''}`}>
        <motion.div
          initial={{ opacity: 0, x: reversed ? 50 : -50 }}
          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: reversed ? 50 : -50 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Badge className="gradient-primary text-white border-0 shadow-md px-3 py-1 text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3 mr-2" />
            Feature Highlight
          </Badge>
          <h3 className="text-3xl md:text-4xl font-bold text-black mb-4">
            {section.title}
          </h3>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            {section.description}
          </p>

          {/* Feature Benefits */}
          <div className="space-y-3 mb-6">
            {['Real-time analysis', 'Actionable insights', 'Instant recommendations'].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                className="flex items-center space-x-3"
              >
                <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </motion.div>
            ))}
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Button className="gradient-primary text-white font-semibold hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300">
              Learn More
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <div className={`${reversed ? 'lg:order-1' : ''}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: reversed ? -50 : 50 }}
          animate={inView ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0.95, x: reversed ? -50 : 50 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative group"
        >
          {/* Glowing Border Animation */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500" />

          <div className="relative bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl p-8 shadow-2xl border border-primary-200">
            <div className="aspect-video bg-white rounded-lg shadow-lg overflow-hidden">
              <img
                src={section.image}
                alt={section.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Metric Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl p-4 border-2 border-primary-200"
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">Quality Score</div>
                  {inView && (
                    <div className="text-lg font-bold text-primary-600">
                      <CountUp start={0} end={95} duration={2} delay={0.8} suffix="%" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Component: Testimonial Card
const TestimonialCard = ({ testimonial, index }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="h-full"
    >
      <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-2xl hover:border-primary-200 transition-all duration-300 ease-out h-full">
        <CardContent className="p-8">
          {/* Stars */}
          <div className="flex items-center space-x-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>

          {/* Quote */}
          <blockquote className="text-gray-700 mb-6 leading-relaxed">
            "{testimonial.text}"
          </blockquote>

          {/* Metric */}
          <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-lg border border-primary-200">
            <div className="text-2xl font-bold text-gradient-primary">
              {testimonial.metric}
            </div>
            <div className="text-sm text-primary-700 font-medium">Results achieved</div>
          </div>

          {/* Author */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-white">{testimonial.avatar}</span>
            </div>
            <div>
              <p className="font-semibold text-black">{testimonial.name}</p>
              <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Component: Use Case Card
const UseCaseCard = ({ useCase, index }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="h-full"
    >
      <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 ease-out h-full">
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold text-black mb-4">
            {useCase.title}
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {useCase.description}
          </p>
          <div className="space-y-3">
            {useCase.benefits.map((benefit, i) => (
              <div key={i} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Component: Pricing Card
const PricingCard = ({ tier, index }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -6, scale: tier.popular ? 1.03 : 1.02 }}
      className="relative h-full"
    >
      {tier.popular && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
          <Badge className="gradient-primary text-white border-0 shadow-lg px-4 py-1 text-xs font-medium">
            Most Popular
          </Badge>
        </div>
      )}
      <Card className={`border ${tier.popular ? 'border-primary-500 shadow-lg' : 'border-gray-200'} bg-white hover:shadow-2xl hover:border-primary-300 transition-all duration-300 ease-out h-full`}>
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold text-black mb-2">
            {tier.name}
          </h3>
          <div className="mb-4">
            <span className="text-4xl font-bold text-black">{tier.price}</span>
            {tier.period && <span className="text-gray-500">{tier.period}</span>}
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {tier.description}
          </p>
          <Button
            className={`w-full mb-6 font-semibold ${tier.popular ? 'gradient-primary text-white' : 'border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            {tier.cta}
          </Button>
          <div className="space-y-3">
            {tier.features.map((feature, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Component: FAQ Item
const FAQItem = ({ faq, index, isOpen, onClick }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className={`border ${isOpen ? 'border-primary-300 shadow-lg' : 'border-gray-200'} bg-white shadow-sm hover:shadow-lg transition-all duration-300 ease-out`}>
        <CardContent className="p-0">
          <button
            onClick={onClick}
            className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-300 ease-out"
          >
            <span className="text-lg font-semibold text-black pr-8">
              {faq.question}
            </span>
            <div className="flex-shrink-0">
              {isOpen ? (
                <Minus className="w-5 h-5 text-primary-600" />
              ) : (
                <Plus className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>
          <motion.div
            initial={false}
            animate={{ height: isOpen ? 'auto' : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-gray-600 leading-relaxed">
              {faq.answer}
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Component: Animated Metric Card
const AnimatedMetricCard = ({ value, suffix, label, icon, delay }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.9 }}
      transition={{ duration: 0.6, delay }}
      className="relative"
    >
      <Card className="border-0 bg-white/10 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:bg-white/15 transition-all duration-300 overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardContent className="p-8 text-center relative z-10">
          <motion.div
            className="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center"
            animate={inView ? {
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut"
            }}
          >
            {icon}
          </motion.div>

          <div className="mb-4">
            {inView ? (
              <div className="text-5xl md:text-6xl font-bold text-white">
                <CountUp
                  start={0}
                  end={value}
                  duration={2.5}
                  delay={delay}
                  separator=","
                  suffix={suffix}
                />
              </div>
            ) : (
              <div className="text-5xl md:text-6xl font-bold text-white">
                0{suffix}
              </div>
            )}
          </div>

          <p className="text-primary-100 text-lg font-medium">
            {label}
          </p>

          {/* Animated Progress Bar */}
          <motion.div
            className="mt-6 h-1 bg-white/20 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: delay + 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary-300 to-white rounded-full"
              initial={{ width: '0%' }}
              animate={inView ? { width: '100%' } : { width: '0%' }}
              transition={{ duration: 2, delay: delay + 0.5, ease: "easeOut" }}
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Landing;