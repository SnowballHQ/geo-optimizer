import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Sparkles, Cpu } from 'lucide-react';
import AIToolCard from '../components/AIToolCard';
import { getAITools } from '../services/contentful';

const AITools = () => {
  const navigate = useNavigate();
  const [aiTools, setAITools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // Categories for filtering
  const categories = [
    { id: 'all', label: 'All Tools', icon: Cpu },
    { id: 'Content Writing', label: 'Content Writing', icon: Sparkles },
    { id: 'SEO', label: 'SEO Tools', icon: Sparkles },
    { id: 'Image', label: 'Image Generation', icon: Sparkles },
    { id: 'Code', label: 'Code Assistants', icon: Sparkles },
    { id: 'Marketing', label: 'Marketing', icon: Sparkles },
    { id: 'Analytics', label: 'Analytics', icon: Sparkles },
  ];

  // Fetch AI tools on component mount
  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const tools = await getAITools(50);
      setAITools(tools);
      setFilteredTools(tools);
    } catch (error) {
      console.error('Error loading AI tools:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle category filter
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    if (categoryId === 'all') {
      setFilteredTools(aiTools);
    } else {
      const filtered = aiTools.filter(tool =>
        tool.category && tool.category.some(cat =>
          cat.toLowerCase().includes(categoryId.toLowerCase())
        )
      );
      setFilteredTools(filtered);
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
              <Link to="/blog" className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                Blog
              </Link>
              <Link to="/ai-tools" className="text-sm text-primary-600 font-medium">
                AI Tools
              </Link>
              <Link to="/#pricing" className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                Pricing
              </Link>
              <Link to="/#testimonials" className="text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200 font-medium">
                Customers
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
              AI Tools <span className="text-gradient-primary">Directory</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover the best AI-powered tools for content creation, SEO, marketing, and productivity. Curated and verified by experts.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 whitespace-nowrap ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-500">
              {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            // Loading State
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading AI tools...</p>
            </div>
          ) : filteredTools.length === 0 ? (
            // Empty State
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                <Cpu className="w-12 h-12 text-primary-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">No tools found</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                {activeCategory !== 'all'
                  ? 'No tools found in this category. Try selecting a different category.'
                  : 'Check back soon for new AI tools!'}
              </p>
              {activeCategory !== 'all' && (
                <Button
                  onClick={() => handleCategoryChange('all')}
                  className="gradient-primary text-white"
                >
                  View All Tools
                </Button>
              )}
            </motion.div>
          ) : (
            <>
              {/* Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTools.map((tool, index) => (
                  <AIToolCard key={tool.id} tool={tool} index={index} />
                ))}
              </div>

              {/* Tool Count */}
              {filteredTools.length > 0 && (
                <div className="mt-16 text-center">
                  <p className="text-sm text-gray-500">
                    Showing {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
                    {activeCategory !== 'all' && ` in ${categories.find(c => c.id === activeCategory)?.label}`}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Request Tool CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-2 border-primary-200 shadow-xl overflow-hidden">
            <CardContent className="p-12 bg-gradient-to-br from-primary-50/50 to-white">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Don't see your favorite tool?
              </h3>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Let us know which AI tool you'd like us to add to our directory. We're constantly expanding our collection!
              </p>
              <Button className="gradient-primary text-white px-8 py-3 text-lg">
                Request a Tool
              </Button>
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
              Optimize your content with Snowball AI
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              While you explore these amazing AI tools, don't forget to optimize your content for maximum impact with Snowball AI
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

export default AITools;
