import { createClient } from 'contentful';

// Initialize Contentful client
const client = createClient({
  space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
  environment: import.meta.env.VITE_CONTENTFUL_ENVIRONMENT || 'master'
});

/**
 * Fetch all blog posts
 * @param {number} limit - Number of posts to fetch
 * @param {number} skip - Number of posts to skip (for pagination)
 * @returns {Promise} Array of blog posts
 */
export const getBlogPosts = async (limit = 10, skip = 0) => {
  try {
    const response = await client.getEntries({
      content_type: 'pageBlogPost',
      limit,
      skip,
      order: '-fields.publishedDate'
    });

    return response.items.map(item => ({
      id: item.sys.id,
      title: item.fields.title || item.fields.internalName,
      slug: item.fields.slug,
      excerpt: item.fields.subtitle || '',
      content: item.fields.content,
      featuredImage: item.fields.featuredImage?.fields?.file?.url,
      author: item.fields.author?.fields?.name || 'Anonymous',
      category: '', // Template doesn't have category
      tags: [], // Template doesn't have tags
      publishedDate: item.fields.publishedDate,
      readingTime: null, // Template doesn't have reading time
      createdAt: item.sys.createdAt,
      updatedAt: item.sys.updatedAt
    }));
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }
};

/**
 * Fetch a single blog post by slug
 * @param {string} slug - Post slug
 * @returns {Promise} Blog post object
 */
export const getBlogPostBySlug = async (slug) => {
  try {
    const response = await client.getEntries({
      content_type: 'pageBlogPost',
      'fields.slug': slug,
      limit: 1
    });

    if (response.items.length === 0) {
      return null;
    }

    const item = response.items[0];
    return {
      id: item.sys.id,
      title: item.fields.title || item.fields.internalName,
      slug: item.fields.slug,
      excerpt: item.fields.subtitle || '',
      content: item.fields.content,
      featuredImage: item.fields.featuredImage?.fields?.file?.url,
      author: item.fields.author?.fields?.name || 'Anonymous',
      category: '', // Template doesn't have category
      tags: [], // Template doesn't have tags
      publishedDate: item.fields.publishedDate,
      readingTime: null, // Template doesn't have reading time
      createdAt: item.sys.createdAt,
      updatedAt: item.sys.updatedAt
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    throw error;
  }
};

/**
 * Fetch featured blog posts
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise} Array of featured blog posts
 */
export const getFeaturedBlogPosts = async (limit = 3) => {
  try {
    const response = await client.getEntries({
      content_type: 'pageBlogPost',
      limit,
      order: '-fields.publishedDate'
    });

    return response.items.map(item => ({
      id: item.sys.id,
      title: item.fields.title || item.fields.internalName,
      slug: item.fields.slug,
      excerpt: item.fields.subtitle || '',
      featuredImage: item.fields.featuredImage?.fields?.file?.url,
      author: item.fields.author?.fields?.name || 'Anonymous',
      category: '',
      tags: [],
      publishedDate: item.fields.publishedDate,
      readingTime: null
    }));
  } catch (error) {
    console.error('Error fetching featured blog posts:', error);
    // Return empty array instead of throwing to allow graceful degradation
    return [];
  }
};

/**
 * Fetch blog posts by category
 * @param {string} category - Category name
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise} Array of blog posts
 */
export const getBlogPostsByCategory = async (category, limit = 10) => {
  try {
    // Template doesn't have categories, so just return all posts
    const response = await client.getEntries({
      content_type: 'pageBlogPost',
      limit,
      order: '-fields.publishedDate'
    });

    return response.items.map(item => ({
      id: item.sys.id,
      title: item.fields.title || item.fields.internalName,
      slug: item.fields.slug,
      excerpt: item.fields.subtitle || '',
      featuredImage: item.fields.featuredImage?.fields?.file?.url,
      author: item.fields.author?.fields?.name || 'Anonymous',
      category: '',
      tags: [],
      publishedDate: item.fields.publishedDate,
      readingTime: null
    }));
  } catch (error) {
    console.error('Error fetching blog posts by category:', error);
    throw error;
  }
};

/**
 * Search blog posts
 * @param {string} query - Search query
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise} Array of matching blog posts
 */
export const searchBlogPosts = async (query, limit = 10) => {
  try {
    const response = await client.getEntries({
      content_type: 'pageBlogPost',
      query,
      limit,
      order: '-fields.publishedDate'
    });

    return response.items.map(item => ({
      id: item.sys.id,
      title: item.fields.title || item.fields.internalName,
      slug: item.fields.slug,
      excerpt: item.fields.subtitle || '',
      featuredImage: item.fields.featuredImage?.fields?.file?.url,
      author: item.fields.author?.fields?.name || 'Anonymous',
      category: '',
      tags: [],
      publishedDate: item.fields.publishedDate,
      readingTime: null
    }));
  } catch (error) {
    console.error('Error searching blog posts:', error);
    throw error;
  }
};

// ============================================
// AI TOOLS FUNCTIONS
// ============================================

/**
 * Fetch all AI tools
 * @param {number} limit - Number of tools to fetch
 * @param {number} skip - Number of tools to skip (for pagination)
 * @returns {Promise} Array of AI tools
 */
export const getAITools = async (limit = 20, skip = 0) => {
  try {
    const response = await client.getEntries({
      content_type: 'aiTool',
      limit,
      skip,
      order: '-fields.featured,-sys.createdAt'
    });

    return response.items.map(item => ({
      id: item.sys.id,
      name: item.fields.toolName || item.fields.internalName,
      slug: item.fields.slug,
      tagline: item.fields.tagline || '',
      logo: item.fields.logo?.fields?.file?.url,
      category: item.fields.category || [],
      description: item.fields.description || '',
      pricingType: item.fields.pricingType || 'Free',
      monthlyPrice: item.fields.monthlyPrice || null,
      rating: item.fields.rating || 0,
      reviewCount: item.fields.reviewCount || 0,
      verified: item.fields.verified || false,
      featured: item.fields.featured || false,
      websiteUrl: item.fields.websiteUrl,
      platforms: item.fields.platforms || [],
      createdAt: item.sys.createdAt,
      updatedAt: item.sys.updatedAt
    }));
  } catch (error) {
    console.error('Error fetching AI tools:', error);
    throw error;
  }
};

/**
 * Fetch a single AI tool by slug
 * @param {string} slug - Tool slug
 * @returns {Promise} AI tool object
 */
export const getAIToolBySlug = async (slug) => {
  try {
    const response = await client.getEntries({
      content_type: 'aiTool',
      'fields.slug': slug,
      limit: 1
    });

    if (response.items.length === 0) {
      return null;
    }

    const item = response.items[0];
    return {
      id: item.sys.id,
      name: item.fields.toolName || item.fields.internalName,
      slug: item.fields.slug,
      tagline: item.fields.tagline || '',
      logo: item.fields.logo?.fields?.file?.url,
      category: item.fields.category || [],
      description: item.fields.description || '',
      keyFeatures: item.fields.keyFeatures || [],
      pros: item.fields.pros || [],
      cons: item.fields.cons || [],
      useCases: item.fields.useCases || [],
      pricingType: item.fields.pricingType || 'Free',
      pricingDetails: item.fields.pricingDetails || '',
      monthlyPrice: item.fields.monthlyPrice || null,
      websiteUrl: item.fields.websiteUrl,
      platforms: item.fields.platforms || [],
      screenshots: item.fields.screenshots?.map(img => img.fields?.file?.url) || [],
      rating: item.fields.rating || 0,
      reviewCount: item.fields.reviewCount || 0,
      verified: item.fields.verified || false,
      featured: item.fields.featured || false,
      aiModels: item.fields.aiModelsUsed || [],
      lastUpdated: item.fields.lastUpdated,
      createdAt: item.sys.createdAt,
      updatedAt: item.sys.updatedAt
    };
  } catch (error) {
    console.error('Error fetching AI tool:', error);
    throw error;
  }
};

/**
 * Fetch AI tools by category
 * @param {string} category - Category name
 * @param {number} limit - Number of tools to fetch
 * @returns {Promise} Array of AI tools
 */
export const getAIToolsByCategory = async (category, limit = 20) => {
  try {
    const response = await client.getEntries({
      content_type: 'aiTool',
      'fields.category[in]': category,
      limit,
      order: '-fields.featured,-sys.createdAt'
    });

    return response.items.map(item => ({
      id: item.sys.id,
      name: item.fields.toolName || item.fields.internalName,
      slug: item.fields.slug,
      tagline: item.fields.tagline || '',
      logo: item.fields.logo?.fields?.file?.url,
      category: item.fields.category || [],
      description: item.fields.description || '',
      pricingType: item.fields.pricingType || 'Free',
      monthlyPrice: item.fields.monthlyPrice || null,
      rating: item.fields.rating || 0,
      reviewCount: item.fields.reviewCount || 0,
      verified: item.fields.verified || false,
      featured: item.fields.featured || false,
      websiteUrl: item.fields.websiteUrl
    }));
  } catch (error) {
    console.error('Error fetching AI tools by category:', error);
    throw error;
  }
};

/**
 * Fetch featured AI tools
 * @param {number} limit - Number of tools to fetch
 * @returns {Promise} Array of featured AI tools
 */
export const getFeaturedAITools = async (limit = 6) => {
  try {
    const response = await client.getEntries({
      content_type: 'aiTool',
      'fields.featured': true,
      limit,
      order: '-sys.createdAt'
    });

    return response.items.map(item => ({
      id: item.sys.id,
      name: item.fields.toolName || item.fields.internalName,
      slug: item.fields.slug,
      tagline: item.fields.tagline || '',
      logo: item.fields.logo?.fields?.file?.url,
      category: item.fields.category || [],
      description: item.fields.description || '',
      pricingType: item.fields.pricingType || 'Free',
      rating: item.fields.rating || 0,
      verified: item.fields.verified || false,
      websiteUrl: item.fields.websiteUrl
    }));
  } catch (error) {
    console.error('Error fetching featured AI tools:', error);
    return [];
  }
};

/**
 * Search AI tools
 * @param {string} query - Search query
 * @param {number} limit - Number of tools to fetch
 * @returns {Promise} Array of matching AI tools
 */
export const searchAITools = async (query, limit = 20) => {
  try {
    const response = await client.getEntries({
      content_type: 'aiTool',
      query,
      limit,
      order: '-fields.featured,-sys.createdAt'
    });

    return response.items.map(item => ({
      id: item.sys.id,
      name: item.fields.toolName || item.fields.internalName,
      slug: item.fields.slug,
      tagline: item.fields.tagline || '',
      logo: item.fields.logo?.fields?.file?.url,
      category: item.fields.category || [],
      description: item.fields.description || '',
      pricingType: item.fields.pricingType || 'Free',
      rating: item.fields.rating || 0,
      verified: item.fields.verified || false,
      websiteUrl: item.fields.websiteUrl
    }));
  } catch (error) {
    console.error('Error searching AI tools:', error);
    throw error;
  }
};
