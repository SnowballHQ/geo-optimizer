import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Star, CheckCircle, ExternalLink } from 'lucide-react';

const AIToolCard = ({ tool, index = 0 }) => {
  // Get image URL
  const getImageUrl = (url) => {
    if (!url) return '/api/placeholder/100/100';
    return url.startsWith('//') ? `https:${url}` : url;
  };

  // Get pricing badge color
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      viewport={{ once: true }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="h-full"
    >
      <Link to={`/ai-tools/${tool.slug}`} className="block h-full">
        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 ease-out h-full overflow-hidden group">
          <CardContent className="p-6">
            {/* Header with Logo and Name */}
            <div className="flex items-start space-x-4 mb-4">
              {/* Logo */}
              <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center border border-gray-200">
                <img
                  src={getImageUrl(tool.logo)}
                  alt={tool.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Name and Verified Badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {tool.name}
                  </h3>
                  {tool.verified && (
                    <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" title="Verified" />
                  )}
                </div>

                {/* Rating */}
                {tool.rating > 0 && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-700">{tool.rating.toFixed(1)}</span>
                    {tool.reviewCount > 0 && (
                      <span className="text-xs text-gray-500">({tool.reviewCount})</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tagline */}
            {tool.tagline && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                {tool.tagline}
              </p>
            )}

            {/* Categories */}
            {tool.category && tool.category.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tool.category.slice(0, 3).map((cat, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs border-gray-300 text-gray-600"
                  >
                    {cat}
                  </Badge>
                ))}
                {tool.category.length > 3 && (
                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                    +{tool.category.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Footer with Pricing and CTA */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
              {/* Pricing */}
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs border ${getPricingColor(tool.pricingType)}`}>
                  {tool.pricingType}
                </Badge>
                {tool.monthlyPrice && tool.monthlyPrice > 0 && (
                  <span className="text-sm font-semibold text-gray-700">
                    ${tool.monthlyPrice}/mo
                  </span>
                )}
              </div>

              {/* View Link */}
              <div className="flex items-center text-primary-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                View
                <ExternalLink className="w-4 h-4 ml-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default AIToolCard;
