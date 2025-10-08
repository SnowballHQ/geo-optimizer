import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Sparkles } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import { getBlogPosts } from '../services/contentful';

const Blog = () => {
  const navigate = useNavigate();
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // Fetch blog posts on component mount
  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const posts = await getBlogPosts(20);
      setBlogPosts(posts);
    } catch (error) {
      console.error('Error loading blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Orbs */}
      <div className="gradient-orb gradient-orb-purple w-[600px] h-[600px] -top-48 -right-24 opacity-30" />
      <div className="gradient-orb gradient-orb-blue w-[500px] h-[500px] top-1/2 left-0 opacity-20" />

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
              <Link to="/#features" className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                Features
              </Link>
              <Link to="/blog" className="text-sm text-primary-600 font-medium">
                Blog
              </Link>
              <Link to="/#pricing" className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                Pricing
              </Link>
              <Link to="/#testimonials" className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                Customers
              </Link>
              <Link to="/#faq" className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                FAQ
              </Link>
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

      {/* Header */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50/30 via-white to-primary-50/10">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-tight">
              Content <span className="text-gradient-primary">Mastery</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Expert tips, cutting-edge strategies, and actionable insights to help you dominate content creation and search rankings
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            // Loading State
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading articles...</p>
            </div>
          ) : blogPosts.length === 0 ? (
            // Empty State
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-primary-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">No articles found</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                Check back soon for new content!
              </p>
            </motion.div>
          ) : (
            <>
              {/* Blog Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map((post, index) => (
                  <BlogCard key={post.id} post={post} index={index} />
                ))}
              </div>

              {/* Post Count */}
              {blogPosts.length > 0 && (
                <div className="mt-16 text-center">
                  <p className="text-sm text-gray-500">
                    Showing {blogPosts.length} article{blogPosts.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-primary-200 shadow-xl overflow-hidden">
            <CardContent className="p-12 text-center bg-gradient-to-br from-primary-50/50 to-white">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Never miss an update
              </h3>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Subscribe to our newsletter and get the latest content strategies, SEO tips, and industry insights delivered to your inbox weekly.
              </p>
              <form className="max-w-md mx-auto flex gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary-400 focus:outline-none"
                />
                <Button type="submit" className="gradient-primary text-white px-6">
                  Subscribe
                </Button>
              </form>
              <p className="text-xs text-gray-500 mt-4">
                No spam. Unsubscribe anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to transform your content?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of content creators using Snowball AI to optimize their content and dominate search rankings
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-white text-primary-700 hover:bg-gray-100 hover:shadow-2xl transition-all duration-300 font-semibold text-lg px-10 py-6"
            >
              Get Started Free
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
