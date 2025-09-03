const axios = require('axios');
const marked = require('marked');

class CMSIntegration {
  constructor() {
    this.platforms = {
      wordpress: this.publishToWordPress.bind(this),
      webflow: this.publishToWebflow.bind(this),
      shopify: this.publishToShopify.bind(this),
      wix: this.publishToWix.bind(this)
    };
  }

  async publishContent(platform, credentials, content) {
    try {
      if (!this.platforms[platform]) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      const result = await this.platforms[platform](credentials, content);
      return {
        success: true,
        platform,
        postId: result.postId,
        url: result.url,
        message: `Successfully published to ${platform}`
      };
    } catch (error) {
      console.error(`Error publishing to ${platform}:`, error);
      return {
        success: false,
        platform,
        error: error.message
      };
    }
  }

  async publishToWordPress(credentials, content) {
    const { siteUrl, username, applicationPassword } = credentials.authDetails;
    
    if (!siteUrl || !username || !applicationPassword) {
      throw new Error('Missing WordPress credentials');
    }

    const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
    
    const postData = {
      title: content.title,
      content: content.description,
      status: 'publish',
      excerpt: content.description.substring(0, 150),
              categories: Array.isArray(content.keywords) ? content.keywords : content.keywords.split(',').map(k => k.trim()),
      meta: {
        target_audience: content.targetAudience,
        seo_keywords: content.keywords
      }
    };

    const response = await axios.post(`${siteUrl}/wp-json/wp/v2/posts`, postData, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      postId: response.data.id,
      url: response.data.link
    };
  }

  async publishToWebflow(credentials, content) {
    const { apiKey, siteId } = credentials.authDetails;
    
    if (!apiKey || !siteId) {
      throw new Error('Missing Webflow credentials');
    }

    const postData = {
      name: content.title,
      slug: content.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      'post-body': content.description,
      'post-summary': content.description.substring(0, 150),
              'post-category': Array.isArray(content.keywords) ? content.keywords[0] : content.keywords.split(',').map(k => k.trim())[0],
      'post-meta-title': content.title,
      'post-meta-description': content.description.substring(0, 160),
      'post-meta-keywords': content.keywords
    };

    const response = await axios.post(`https://api.webflow.com/sites/${siteId}/collections/posts/items`, postData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      postId: response.data._id,
      url: `https://${siteId}.webflow.io/posts/${response.data.slug}`
    };
  }

  async publishToShopify(credentials, content) {
    const { shopDomain, accessToken, apiVersion = '2024-10' } = credentials.authDetails;
    
    if (!shopDomain || !accessToken) {
      throw new Error('Missing Shopify credentials');
    }

    // Validate content
    if (!content.title || !content.description) {
      throw new Error('Content must have title and description');
    }

    if (!Array.isArray(content.keywords) || content.keywords.length === 0) {
      console.warn('Content has no keywords, using default tags');
      content.keywords = ['AI Content', 'SEO'];
    }

    // Clean and validate content
    const cleanTitle = content.title.trim();
    const cleanDescription = content.description.trim();
    const cleanTargetAudience = (content.targetAudience || 'General Audience').trim();
    
    console.log('🔍 CMS Integration received content:', {
      title: cleanTitle,
      descriptionLength: cleanDescription.length,
      descriptionPreview: cleanDescription.substring(0, 200) + '...',
      targetAudience: cleanTargetAudience
    });
    
    if (cleanTitle.length < 3) {
      throw new Error('Title must be at least 3 characters long');
    }
    
    if (cleanDescription.length < 10) {
      throw new Error('Description must be at least 10 characters long');
    }

    // First, check if we have a blog, create one if not
    let blogId = 1;
    try {
      // Try to get existing blogs
      const blogsResponse = await axios.get(`https://${shopDomain}/admin/api/${apiVersion}/blogs.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (blogsResponse.data.blogs && blogsResponse.data.blogs.length > 0) {
        blogId = blogsResponse.data.blogs[0].id;
        console.log(`Using existing blog with ID: ${blogId}`);
      } else {
        // Create a new blog if none exists
        const createBlogResponse = await axios.post(`https://${shopDomain}/admin/api/${apiVersion}/blogs.json`, {
          blog: {
            title: 'AI Generated Content',
            handle: 'ai-content',
            commentable: 'moderate'
          }
        }, {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        });
        
        blogId = createBlogResponse.data.blog.id;
        console.log(`Created new blog with ID: ${blogId}`);
      }
    } catch (error) {
      console.error('Error checking/creating blog:', error.message);
      // Fallback to default blog ID
      blogId = 1;
    }

    // Function to format content with Markdown
    const formatContentWithMarkdown = (content) => {
      try {
        // Configure marked options for security and formatting
        marked.setOptions({
          breaks: true,        // Convert line breaks to <br>
          gfm: true,          // GitHub Flavored Markdown
          headerIds: true,    // Add IDs to headers for linking
          mangle: false,      // Don't escape HTML
          sanitize: false     // Allow HTML (we'll sanitize separately)
        });

        // Convert markdown to HTML
        const htmlContent = marked.parse(content);
        
        // Basic HTML sanitization (remove potentially dangerous tags)
        const sanitizedContent = htmlContent
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
          .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
        
        return sanitizedContent;
      } catch (error) {
        console.error('Error formatting content with Markdown:', error);
        // Fallback to basic paragraph formatting
        return `<p>${content}</p>`;
      }
    };

    // Use the actual blog content - Shopify expects clean HTML without extra wrapper divs
    // If content already contains HTML tags, use it directly; otherwise format as markdown
    let processedContent;
    if (cleanDescription.includes('<') && cleanDescription.includes('>')) {
      // Content already contains HTML tags, use directly
      processedContent = cleanDescription;
    } else {
      // Convert markdown to HTML for plain text content
      processedContent = formatContentWithMarkdown(cleanDescription);
    }

    // Add minimal metadata at the end without wrapper divs that might cause raw HTML display
    const enhancedDescription = `${processedContent}

<hr>

<p><strong>Target Audience:</strong> ${cleanTargetAudience}</p>
<p><strong>Keywords:</strong> ${Array.isArray(content.keywords) ? content.keywords.join(', ') : content.keywords}</p>
<p><em>Generated by AI Content Creator - Optimized for ${cleanTargetAudience}</em></p>`;

    const postData = {
      article: {
        title: cleanTitle,
        body_html: enhancedDescription,
        summary_html: cleanDescription.substring(0, 150),
        tags: Array.isArray(content.keywords) ? content.keywords : content.keywords.split(',').map(k => k.trim()),
        author: 'AI Content Generator',
        published: true,
        // Add SEO meta fields
        seo: {
          title: cleanTitle,
          description: cleanDescription.substring(0, 160),
          keywords: Array.isArray(content.keywords) ? content.keywords.join(', ') : content.keywords
        }
      }
    };

    console.log(`Publishing to Shopify blog ${blogId}:`, {
      title: cleanTitle,
      keywords: content.keywords,
      descriptionLength: cleanDescription.length,
      targetAudience: cleanTargetAudience
    });

    console.log('Post data being sent to Shopify:', JSON.stringify(postData, null, 2));

    let response;
    try {
      response = await axios.post(`https://${shopDomain}/admin/api/${apiVersion}/blogs/${blogId}/articles.json`, postData, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Successfully published to Shopify:`, response.data.article.id);
    } catch (error) {
      console.error('Shopify publishing error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        errors: error.response?.data?.errors,
        message: error.message
      });
      throw error;
    }

    return {
      postId: response.data.article.id,
      url: `https://${shopDomain}/blogs/ai-content/${response.data.article.handle}`
    };
  }

  async publishToWix(credentials, content) {
    const { siteId, apiKey, accessToken } = credentials.authDetails;
    
    if (!siteId || !apiKey || !accessToken) {
      throw new Error('Missing Wix credentials');
    }

    const postData = {
      post: {
        title: content.title,
        excerpt: content.description.substring(0, 150),
        content: content.description,
        tags: Array.isArray(content.keywords) ? content.keywords : content.keywords.split(',').map(k => k.trim()),
        status: 'PUBLISHED'
      }
    };

    const response = await axios.post(`https://www.wixapis.com/blog/v3/posts`, postData, {
      headers: {
        'Authorization': accessToken,
        'wix-site-id': siteId,
        'Content-Type': 'application/json'
      }
    });

    return {
      postId: response.data.post.id,
      url: `https://${siteId}.wixsite.com/blog/${response.data.post.slug}`
    };
  }

  async testConnection(platform, credentials) {
    try {
      switch (platform) {
        case 'wordpress':
          return await this.testWordPressConnection(credentials);
        case 'webflow':
          return await this.testWebflowConnection(credentials);
        case 'shopify':
          return await this.testShopifyConnection(credentials);
        case 'wix':
          return await this.testWixConnection(credentials);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testWordPressConnection(credentials) {
    const { siteUrl, username, applicationPassword } = credentials.authDetails;
    const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
    
    const response = await axios.get(`${siteUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    return {
      success: true,
      user: response.data.name,
      site: siteUrl
    };
  }

  async testWebflowConnection(credentials) {
    const { apiKey, siteId } = credentials.authDetails;
    
    const response = await axios.get(`https://api.webflow.com/sites/${siteId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return {
      success: true,
      site: response.data.name,
      siteId: response.data._id
    };
  }

  async testShopifyConnection(credentials) {
    const { shopDomain, accessToken } = credentials.authDetails;
    
    if (!shopDomain || !accessToken) {
      throw new Error('Missing Shopify credentials: shopDomain and accessToken are required');
    }

    // Ensure shopDomain doesn't have protocol
    const cleanShopDomain = shopDomain.replace(/^https?:\/\//, '');
    
    console.log('Testing Shopify connection for:', cleanShopDomain);
    
    try {
      const response = await axios.get(`https://${cleanShopDomain}/admin/api/2024-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Shopify API response:', response.status, response.data);
      
      return {
        success: true,
        shop: response.data.shop.name,
        domain: cleanShopDomain
      };
    } catch (error) {
      console.error('Shopify connection test failed:', error.response?.status, error.response?.data);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid access token. Please check your Shopify access token.');
      } else if (error.response?.status === 404) {
        throw new Error('Shop domain not found. Please check your shop domain.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Cannot connect to Shopify store. Please check your shop domain.');
      } else {
        throw new Error(`Shopify API error: ${error.response?.data?.errors || error.message}`);
      }
    }
  }

  async testWixConnection(credentials) {
    const { siteId, apiKey, accessToken } = credentials.authDetails;
    
    const response = await axios.get(`https://www.wixapis.com/site/v1/site`, {
      headers: {
        'Authorization': accessToken,
        'wix-site-id': siteId
      }
    });

    return {
      success: true,
      site: response.data.site.displayName,
      siteId: response.data.site.id
    };
  }
}

module.exports = new CMSIntegration();
