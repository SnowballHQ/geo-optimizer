import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  ArrowLeft,
  ExternalLink,
  Star,
  CheckCircle,
  X,
  Sparkles,
  ChevronRight,
  DollarSign,
  Globe,
  Calendar
} from 'lucide-react';
import { getAIToolBySlug, getAITools } from '../services/contentful';
import AIToolCard from '../components/AIToolCard';

const AIToolDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [similarTools, setSimilarTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTool = async () => {
      setLoading(true);
      setError(false);
      try {
        const fetchedTool = await getAIToolBySlug(slug);
        if (fetchedTool) {
          setTool(fetchedTool);
          // Fetch similar tools (same category)
          if (fetchedTool.category && fetchedTool.category.length > 0) {
            const allTools = await getAITools(10);
            const similar = allTools
              .filter(t => t.slug !== slug && t.category.some(cat => fetchedTool.category.includes(cat)))
              .slice(0, 3);
            setSimilarTools(similar);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error loading AI tool:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTool();
    window.scrollTo(0, 0);
  }, [slug]);

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('//') ? `https:${url}` : url;
  };

  const getPricingColor = (type) => {
    switch(type?.toLowerCase()) {
      case 'free':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'freemium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'paid':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading tool details...</p>
        </div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
            <span className="text-4xl">404</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tool Not Found</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Sorry, we couldn't find the AI tool you're looking for.
          </p>
          <Button onClick={() => navigate('/ai-tools')} className="gradient-primary text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Orbs */}
      <div className="gradient-orb gradient-orb-purple w-[500px] h-[500px] -top-48 right-0 opacity-20" />
      <div className="gradient-orb gradient-orb-blue w-[400px] h-[400px] top-1/3 left-0 opacity-15" />

      {/* Breadcrumb & Navigation */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/ai-tools" className="hover:text-primary-600 transition-colors">AI Tools</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 truncate max-w-[200px]">{tool.name}</span>
          </div>
          <Link
            to="/ai-tools"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header */}
        <motion.header
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left: Logo and Title */}
            <div className="flex-1">
              <div className="flex items-start space-x-6 mb-6">
                {/* Logo */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border-2 border-gray-200 shadow-lg flex-shrink-0">
                  <img
                    src={getImageUrl(tool.logo) || '/api/placeholder/96/96'}
                    alt={tool.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name and Tagline */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900">{tool.name}</h1>
                    {tool.verified && (
                      <CheckCircle className="w-7 h-7 text-primary-600 flex-shrink-0" title="Verified Tool" />
                    )}
                  </div>
                  {tool.tagline && (
                    <p className="text-xl text-gray-600 mb-4">{tool.tagline}</p>
                  )}

                  {/* Rating */}
                  {tool.rating > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(tool.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold text-gray-700">{tool.rating.toFixed(1)}</span>
                      {tool.reviewCount > 0 && (
                        <span className="text-sm text-gray-500">({tool.reviewCount} reviews)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Info Card */}
            <Card className="w-full lg:w-80 border-2 border-primary-200 shadow-lg sticky top-20">
              <CardContent className="p-6 space-y-4">
                {/* Visit Button */}
                <a
                  href={tool.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full gradient-primary text-white font-semibold text-lg py-6">
                    Visit Tool
                    <ExternalLink className="w-5 h-5 ml-2" />
                  </Button>
                </a>

                {/* Pricing */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">Pricing</span>
                    <Badge className={`border ${getPricingColor(tool.pricingType)}`}>
                      {tool.pricingType}
                    </Badge>
                  </div>
                  {tool.monthlyPrice && tool.monthlyPrice > 0 && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-gray-600" />
                      <span className="text-lg font-bold text-gray-900">${tool.monthlyPrice}</span>
                      <span className="text-sm text-gray-500">/month</span>
                    </div>
                  )}
                </div>

                {/* Categories */}
                {tool.category && tool.category.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 font-medium mb-2">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {tool.category.map((cat, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-gray-300">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Platforms */}
                {tool.platforms && tool.platforms.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 font-medium mb-2">Platforms</p>
                    <div className="flex flex-wrap gap-2">
                      {tool.platforms.map((platform, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last Updated */}
                {tool.lastUpdated && (
                  <div className="pt-4 border-t border-gray-200 flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Updated {new Date(tool.lastUpdated).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.header>

        {/* Description */}
        <motion.section
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Overview</h2>
          <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
            {tool.description}
          </p>
        </motion.section>

        {/* Key Features */}
        {tool.keyFeatures && tool.keyFeatures.length > 0 && (
          <motion.section
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tool.keyFeatures.map((feature, idx) => (
                <Card key={idx} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-700">{feature}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {/* Pros and Cons */}
        {((tool.pros && tool.pros.length > 0) || (tool.cons && tool.cons.length > 0)) && (
          <motion.section
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Pros & Cons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pros */}
              {tool.pros && tool.pros.length > 0 && (
                <Card className="border-2 border-green-200 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-green-700 mb-4 flex items-center">
                      <CheckCircle className="w-6 h-6 mr-2" />
                      Pros
                    </h3>
                    <ul className="space-y-3">
                      {tool.pros.map((pro, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Cons */}
              {tool.cons && tool.cons.length > 0 && (
                <Card className="border-2 border-red-200 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-red-700 mb-4 flex items-center">
                      <X className="w-6 h-6 mr-2" />
                      Cons
                    </h3>
                    <ul className="space-y-3">
                      {tool.cons.map((con, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.section>
        )}

        {/* Use Cases */}
        {tool.useCases && tool.useCases.length > 0 && (
          <motion.section
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Use Cases</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tool.useCases.map((useCase, idx) => (
                <Card key={idx} className="border border-primary-200 shadow-sm hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">{idx + 1}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{useCase}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {/* Pricing Details */}
        {tool.pricingDetails && (
          <motion.section
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Pricing Details</h2>
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {tool.pricingDetails}
                </p>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* CTA Box */}
        <Card className="mb-12 border-0 bg-gradient-to-br from-primary-50 to-primary-100/50 shadow-xl">
          <CardContent className="p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Optimize Your Content with Snowball AI
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              While {tool.name} helps with specific tasks, Snowball AI ensures your entire content strategy is optimized for search rankings and engagement.
            </p>
            <Button className="gradient-primary text-white px-8 py-3 text-lg">
              Try Snowball AI Free
            </Button>
          </CardContent>
        </Card>
      </article>

      {/* Similar Tools */}
      {similarTools.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 mb-8">
              <Sparkles className="w-6 h-6 text-primary-600" />
              <h2 className="text-3xl font-bold text-gray-900">Similar Tools</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {similarTools.map((similarTool, index) => (
                <AIToolCard key={similarTool.id} tool={similarTool} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AIToolDetail;
