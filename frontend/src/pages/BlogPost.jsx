import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  ArrowLeft,
  Calendar,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  Check,
  ChevronRight,
  Sparkles,
  Mail
} from 'lucide-react';
import { getBlogPostBySlug, getBlogPosts } from '../services/contentful';
import BlogCard from '../components/BlogCard';

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Reading progress
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(false);
      try {
        const fetchedPost = await getBlogPostBySlug(slug);
        if (fetchedPost) {
          setPost(fetchedPost);
          // Fetch related posts
          const allPosts = await getBlogPosts(4);
          const related = allPosts.filter(p => p.slug !== slug).slice(0, 3);
          setRelatedPosts(related);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error loading blog post:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    window.scrollTo(0, 0);
  }, [slug]);

  // Rich text rendering options
  const renderOptions = {
    renderNode: {
      [BLOCKS.PARAGRAPH]: (node, children) => (
        <p className="mb-6 text-lg text-gray-700 leading-relaxed">{children}</p>
      ),
      [BLOCKS.HEADING_1]: (node, children) => (
        <h1 className="text-4xl font-bold text-gray-900 mb-6 mt-12">{children}</h1>
      ),
      [BLOCKS.HEADING_2]: (node, children) => (
        <h2 className="text-3xl font-bold text-gray-900 mb-5 mt-10 pb-3 border-b border-gray-200">{children}</h2>
      ),
      [BLOCKS.HEADING_3]: (node, children) => (
        <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-8">{children}</h3>
      ),
      [BLOCKS.HEADING_4]: (node, children) => (
        <h4 className="text-xl font-semibold text-gray-900 mb-3 mt-6">{children}</h4>
      ),
      [BLOCKS.UL_LIST]: (node, children) => (
        <ul className="space-y-3 mb-6 ml-6">{children}</ul>
      ),
      [BLOCKS.OL_LIST]: (node, children) => (
        <ol className="space-y-3 mb-6 ml-6 list-decimal">{children}</ol>
      ),
      [BLOCKS.LIST_ITEM]: (node, children) => (
        <li className="text-lg text-gray-700 pl-2 relative before:content-['→'] before:absolute before:-left-6 before:text-primary-600 before:font-bold">{children}</li>
      ),
      [BLOCKS.QUOTE]: (node, children) => (
        <blockquote className="border-l-4 border-primary-500 pl-6 pr-6 py-6 my-8 italic text-xl text-gray-800 bg-gradient-to-r from-primary-50/50 to-transparent rounded-r-lg">
          {children}
        </blockquote>
      ),
      [BLOCKS.EMBEDDED_ASSET]: (node) => {
        const { file, title } = node.data.target.fields;
        const imageUrl = file.url.startsWith('//') ? `https:${file.url}` : file.url;
        return (
          <div className="my-10">
            <img
              src={imageUrl}
              alt={title || 'Blog image'}
              className="w-full rounded-xl shadow-2xl"
            />
            {title && (
              <p className="text-center text-sm text-gray-500 mt-3 italic">{title}</p>
            )}
          </div>
        );
      },
      [INLINES.HYPERLINK]: (node, children) => (
        <a
          href={node.data.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-700 underline decoration-2 underline-offset-2 font-medium transition-colors"
        >
          {children}
        </a>
      ),
    },
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Share functions
  const shareOnTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post?.title)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareOnLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
            <span className="text-4xl">404</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Sorry, we couldn't find the article you're looking for.
          </p>
          <Button onClick={() => navigate('/blog')} className="gradient-primary text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('//') ? `https:${url}` : url;
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 origin-left z-[200]"
        style={{ scaleX }}
      />

      {/* Background Orbs */}
      <div className="gradient-orb gradient-orb-purple w-[500px] h-[500px] -top-48 right-0 opacity-20" />
      <div className="gradient-orb gradient-orb-blue w-[400px] h-[400px] top-1/3 left-0 opacity-15" />

      {/* Breadcrumb & Navigation */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/blog" className="hover:text-primary-600 transition-colors">Blog</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 truncate max-w-[200px]">{post.title}</span>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.header
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed font-light">
              {post.excerpt}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 pb-8 border-b border-gray-200">
            {post.author && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {post.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{post.author}</p>
                  <p className="text-sm text-gray-500">Author</p>
                </div>
              </div>
            )}
            {post.publishedDate && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span className="text-sm">{formatDate(post.publishedDate)}</span>
              </div>
            )}
          </div>
        </motion.header>

        {/* Featured Image */}
        {post.featuredImage && (
          <motion.div
            className="mb-12 rounded-2xl overflow-hidden shadow-2xl relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
            <img
              src={getImageUrl(post.featuredImage)}
              alt={post.title}
              className="w-full h-auto"
            />
          </motion.div>
        )}

        {/* Social Share - Sticky Sidebar */}
        <div className="hidden lg:block fixed left-8 top-1/2 transform -translate-y-1/2 z-40">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 space-y-3">
            <p className="text-xs text-gray-500 font-medium text-center mb-2">Share</p>
            <button
              onClick={shareOnTwitter}
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center"
              title="Share on Twitter"
            >
              <Twitter className="w-5 h-5" />
            </button>
            <button
              onClick={shareOnFacebook}
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center justify-center"
              title="Share on Facebook"
            >
              <Facebook className="w-5 h-5" />
            </button>
            <button
              onClick={shareOnLinkedIn}
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-800 transition-all flex items-center justify-center"
              title="Share on LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </button>
            <button
              onClick={copyLink}
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center justify-center relative"
              title="Copy link"
            >
              {linkCopied ? <Check className="w-5 h-5 text-green-600" /> : <Link2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Article Content */}
        <motion.div
          className="prose prose-lg max-w-none mb-16 article-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {post.content && typeof post.content === 'object'
            ? documentToReactComponents(post.content, renderOptions)
            : <div className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">{post.content}</div>
          }
        </motion.div>

        {/* Share Section (Mobile) */}
        <Card className="mb-12 border-2 border-primary-200 shadow-lg lg:hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-gray-900">Share this article</span>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareOnTwitter}
                  className="hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600"
                >
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareOnFacebook}
                  className="hover:bg-blue-50 hover:border-blue-600 hover:text-blue-700"
                >
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareOnLinkedIn}
                  className="hover:bg-blue-50 hover:border-blue-700 hover:text-blue-800"
                >
                  <Linkedin className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLink}
                  className="hover:bg-primary-50 hover:border-primary-400 hover:text-primary-600"
                >
                  {linkCopied ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Newsletter Subscription */}
        <Card className="mb-12 border-0 bg-gradient-to-br from-primary-50 to-primary-100/50 shadow-xl overflow-hidden">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Get more insights like this
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join 10,000+ content creators receiving weekly tips on content optimization and SEO strategy
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
            <p className="text-xs text-gray-500 mt-3">
              No spam. Unsubscribe anytime.
            </p>
          </CardContent>
        </Card>

        {/* Author Bio */}
        {post.author && (
          <Card className="mb-12 border border-gray-200 shadow-md">
            <CardContent className="p-8">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-md">
                  {post.author.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Written by {post.author}</h4>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Content strategist and SEO expert helping brands create high-performing content that ranks and converts.
                  </p>
                  <Link to="/blog" className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center group">
                    View all articles
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 mb-8">
              <Sparkles className="w-6 h-6 text-primary-600" />
              <h2 className="text-3xl font-bold text-gray-900">Related Articles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost, index) => (
                <BlogCard key={relatedPost.id} post={relatedPost} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-900 to-primary-700 text-white relative overflow-hidden">
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
              Ready to optimize your content?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Start using Snowball AI to analyze and improve your content just like this article
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-100 hover:shadow-2xl transition-all duration-300 font-semibold text-lg px-10 py-6">
                Get Started Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default BlogPost;
