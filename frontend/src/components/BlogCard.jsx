import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const BlogCard = ({ post, index = 0 }) => {
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get image URL (add https: if it's a protocol-relative URL)
  const getImageUrl = (url) => {
    if (!url) return '/api/placeholder/400/250';
    return url.startsWith('//') ? `https:${url}` : url;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="h-full"
    >
      <Link to={`/blog/${post.slug}`} className="block h-full">
        <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 ease-out h-full overflow-hidden group">
          {/* Featured Image */}
          <div className="relative h-48 overflow-hidden bg-gray-100">
            <img
              src={getImageUrl(post.featuredImage)}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {post.category && (
              <div className="absolute top-4 left-4">
                <Badge className="gradient-primary text-white border-0 shadow-md">
                  {post.category}
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="p-6">
            {/* Title */}
            <h3 className="text-xl font-bold text-black mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
              {post.title}
            </h3>

            {/* Excerpt */}
            <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>

            {/* Meta Information */}
            {post.publishedDate && (
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{formatDate(post.publishedDate)}</span>
              </div>
            )}

            {/* Author */}
            {post.author && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-600">By {post.author}</span>
                <ArrowRight className="w-5 h-5 text-primary-600 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default BlogCard;
