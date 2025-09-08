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
      console.log('🔍 publishContent wrapper called with platform:', platform);
      
      if (!this.platforms[platform]) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      console.log('🔍 Calling platform-specific publish method...');
      const result = await this.platforms[platform](credentials, content);
      console.log('🔍 Platform method returned result:', result);
      
      const finalResult = {
        success: true,
        platform,
        postId: result.postId,
        url: result.url,
        message: `Successfully published to ${platform}`
      };
      
      console.log('🔍 publishContent wrapper returning:', finalResult);
      return finalResult;
    } catch (error) {
      console.error(`❌ Error in publishContent wrapper for ${platform}:`, error);
      return {
        success: false,
        platform,
        error: error.message
      };
    }
  }

  async publishToWordPress(credentials, content) {
    console.log('🔍 WordPress.com publishToWordPress called with:', {
      userLogin: credentials.authDetails?.userLogin,
      hasAccessToken: !!credentials.authDetails?.accessToken,
      sitesCount: credentials.authDetails?.sites?.length || 0,
      contentTitle: content.title,
      contentLength: content.description?.length
    });

    const { accessToken, tokenType, userLogin, sites } = credentials.authDetails;
    
    if (!accessToken || !tokenType || !sites || sites.length === 0) {
      throw new Error('Missing WordPress.com credentials: accessToken, tokenType, and sites are required');
    }

    // Use the first site (or find a suitable one)
    const targetSite = sites[0];
    if (!targetSite || !targetSite.ID) {
      throw new Error('No valid WordPress.com site found for publishing');
    }

    console.log('📝 Publishing to WordPress.com site:', {
      siteId: targetSite.ID,
      siteName: targetSite.name,
      siteUrl: targetSite.URL
    });
    
    // Clean and validate content
    const cleanTitle = content.title?.trim() || 'Untitled Post';
    const cleanDescription = content.description?.trim() || '';
    const postStatus = content.status || 'publish';
    
    if (!cleanDescription || cleanDescription.length < 10) {
      throw new Error('Content description must be at least 10 characters long');
    }

    // Convert local image URLs to publicly accessible ones if needed
    const convertedContent = await this.convertLocalImageUrls(cleanDescription);
    
    // Handle keywords - convert to tags
    let tags = '';
    if (content.keywords) {
      if (Array.isArray(content.keywords)) {
        tags = content.keywords.join(',');
      } else if (typeof content.keywords === 'string') {
        tags = content.keywords;
      }
    }

    // Prepare WordPress.com post data
    const postData = {
      title: cleanTitle,
      content: convertedContent,
      status: postStatus,
      format: 'standard',
      tags: tags,
      categories: content.targetAudience || ''
    };

    console.log('📝 Preparing WordPress.com post data:', {
      title: cleanTitle,
      contentLength: convertedContent.length,
      status: postStatus,
      tags: tags,
      categories: content.targetAudience
    });

    try {
      console.log('🚀 Sending WordPress.com API request:', {
        siteId: targetSite.ID,
        postDataKeys: Object.keys(postData)
      });

      // Publish to WordPress.com using REST API
      const response = await axios.post(
        `https://public-api.wordpress.com/rest/v1.1/sites/${targetSite.ID}/posts/new`,
        postData,
        {
          headers: {
            'Authorization': `${tokenType} ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ WordPress.com post created successfully:', {
        postId: response.data.ID,
        title: response.data.title,
        status: response.data.status,
        url: response.data.URL
      });

      return {
        postId: response.data.ID,
        url: response.data.URL,
        status: response.data.status,
        title: response.data.title || cleanTitle
      };

    } catch (error) {
      console.error('❌ WordPress.com API error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data
      });
      
      let errorMessage = 'Failed to publish to WordPress.com';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'WordPress.com authentication failed. Please reconnect your WordPress account.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Permission denied. Please ensure your WordPress.com token has publishing permissions.';
      } else if (error.response?.status === 404) {
        errorMessage = 'WordPress.com site not found. Please check your site configuration.';
      }
      
      throw new Error(errorMessage);
    }
  }

  // Add WordPress connection test method
  async testWordPressConnection(credentials) {
    console.log('🔍 Testing WordPress connection...');
    
    const { siteUrl, username, applicationPassword } = credentials.authDetails;
    
    if (!siteUrl || !username || !applicationPassword) {
      return {
        success: false,
        error: 'Missing WordPress credentials: siteUrl, username, and applicationPassword are required'
      };
    }

    const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');
    
    try {
      // Test 1: Check if WordPress REST API is accessible
      console.log('🔍 Testing WordPress REST API access...');
      const apiResponse = await axios.get(`${siteUrl}/wp-json/wp/v2`, {
        timeout: 10000
      });
      
      if (!apiResponse.data || !apiResponse.data.routes) {
        return {
          success: false,
          error: 'WordPress REST API is not accessible or not properly configured'
        };
      }

      // Test 2: Check authentication with user info
      console.log('🔍 Testing WordPress authentication...');
      const userResponse = await axios.get(`${siteUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const userData = userResponse.data;
      
      // Test 3: Check if user can create posts
      console.log('🔍 Testing WordPress post creation permissions...');
      const capabilitiesCheck = userData.capabilities || {};
      const canPublish = capabilitiesCheck.publish_posts || capabilitiesCheck.edit_posts || userData.roles?.includes('administrator') || userData.roles?.includes('editor');
      
      if (!canPublish) {
        return {
          success: false,
          error: 'WordPress user does not have permission to publish posts. User needs Editor or Administrator role.'
        };
      }

      console.log('✅ WordPress connection test successful');
      
      return {
        success: true,
        message: 'WordPress connection successful',
        data: {
          siteUrl: siteUrl,
          siteName: apiResponse.data.name || 'WordPress Site',
          user: {
            id: userData.id,
            name: userData.name,
            username: userData.username || userData.slug,
            email: userData.email,
            roles: userData.roles || []
          },
          capabilities: {
            canPublishPosts: canPublish,
            canEditPosts: capabilitiesCheck.edit_posts || false,
            canManageCategories: capabilitiesCheck.manage_categories || false
          },
          apiVersion: apiResponse.data.version || 'Unknown'
        }
      };

    } catch (error) {
      console.error('❌ WordPress connection test failed:', error.message);
      
      let errorMessage = 'WordPress connection failed';
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot reach WordPress site. Please check the site URL.';
      } else if (error.response?.status === 401) {
        errorMessage = 'WordPress authentication failed. Please check your username and application password.';
      } else if (error.response?.status === 403) {
        errorMessage = 'WordPress access forbidden. Please check your user permissions.';
      } else if (error.response?.status === 404) {
        errorMessage = 'WordPress REST API not found. Please ensure REST API is enabled on your WordPress site.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        details: error.response?.data || error.message
      };
    }
  }

  // Helper function to convert local image URLs to publicly accessible ones
  async convertLocalImageUrls(htmlContent) {
    if (!htmlContent) return htmlContent;
    
    // Find all img tags with local URLs
    const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    let modifiedContent = htmlContent;
    let match;
    
    while ((match = imgTagRegex.exec(htmlContent)) !== null) {
      const fullImgTag = match[0];
      const imageUrl = match[1];
      
      // Check if it's a local URL that needs conversion
      if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1') || imageUrl.includes('192.168.')) {
        console.log('Found local image URL that needs conversion:', imageUrl);
        
        // Replace local URLs with public server URL
        const publicBaseUrl = process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || process.env.RAILWAY_STATIC_URL || 'https://your-deployed-backend.onrender.com';
        const publicUrl = imageUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, publicBaseUrl);
        
        // If still contains localhost, it means we're in development - skip this image for Webflow
        if (publicUrl.includes('localhost') || publicUrl.includes('127.0.0.1')) {
          console.warn('⚠️ Skipping local image for Webflow (not publicly accessible):', imageUrl);
          // Remove the entire img tag for now
          modifiedContent = modifiedContent.replace(fullImgTag, `<p><em>[Image removed: Not accessible from Webflow. Please use public image URLs or deploy your backend.]</em></p>`);
        } else {
          modifiedContent = modifiedContent.replace(imageUrl, publicUrl);
          console.log('Converted image URL:', imageUrl, '→', publicUrl);
        }
      }
    }
    
    return modifiedContent;
  }

  async publishToWebflow(credentials, content) {
    const { accessToken } = credentials.authDetails;
    const { siteId } = content;
    
    if (!accessToken) {
      throw new Error('Missing Webflow credentials: accessToken is required');
    }

    if (!siteId) {
      throw new Error('Site ID is required to publish to Webflow. Please select a site.');
    }

    // Validate content
    if (!content.title || !content.description) {
      throw new Error('Content must have title and description');
    }

    if (!Array.isArray(content.keywords) || content.keywords.length === 0) {
      console.warn('Content has no keywords, using default tags');
      content.keywords = ['AI Content', 'Blog'];
    }

    // Clean and validate content
    const cleanTitle = content.title.trim();
    const cleanDescription = content.description.trim();
    const cleanTargetAudience = (content.targetAudience || 'General Audience').trim();
    
    console.log('🔍 Webflow CMS Integration received content:', {
      title: cleanTitle,
      descriptionLength: cleanDescription.length,
      descriptionPreview: cleanDescription.substring(0, 200) + '...',
      targetAudience: cleanTargetAudience,
      siteId: siteId
    });
    
    if (cleanTitle.length < 3) {
      throw new Error('Title must be at least 3 characters long');
    }
    
    if (cleanDescription.length < 10) {
      throw new Error('Description must be at least 10 characters long');
    }

    try {
      // First, get the site's collections to find a blog collection
      const collectionsResponse = await axios.get(`https://api.webflow.com/v2/sites/${siteId}/collections`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      const collections = collectionsResponse.data.collections || [];
      
      // Find a suitable blog collection (look for 'blog', 'post', 'article' in collection name)
      let blogCollection = collections.find(col => 
        col.singularName.toLowerCase().includes('blog') || 
        col.singularName.toLowerCase().includes('post') || 
        col.singularName.toLowerCase().includes('article') ||
        col.displayName.toLowerCase().includes('blog') ||
        col.displayName.toLowerCase().includes('post')
      );

      // If no blog collection found, use the first collection or create a simple structure
      if (!blogCollection && collections.length > 0) {
        blogCollection = collections[0];
        console.log(`No blog collection found, using collection: ${blogCollection.displayName}`);
      } else if (!blogCollection) {
        throw new Error('No collections found in this Webflow site. Please create a blog collection first.');
      }

      console.log(`📝 Publishing to Webflow collection: ${blogCollection.displayName} (${blogCollection.id})`);

      // Get collection schema to validate what fields are available
      // Note: Webflow API v2 may not have a direct fields endpoint, so we'll get the full collection
      let collectionFields = [];
      let validFieldSlugs = [];
      try {
        const collectionResponse = await axios.get(`https://api.webflow.com/v2/collections/${blogCollection.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });
        
        const collection = collectionResponse.data;
        if (collection && collection.fields) {
          collectionFields = collection.fields;
          validFieldSlugs = collectionFields.map(f => f.slug);
          console.log(`Found ${collectionFields.length} fields in collection:`, validFieldSlugs);
        } else {
          console.warn('Collection response does not contain fields array');
        }
      } catch (error) {
        console.warn('Could not fetch collection schema, using minimal field mapping:', error.response?.status, error.message);
        // When we can't get fields, use only the most basic fields that should exist
        validFieldSlugs = ['name', 'slug'];
      }

      // Generate slug from title
      const slug = cleanTitle.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);

      // Convert local image URLs to publicly accessible ones
      const convertedDescription = await this.convertLocalImageUrls(cleanDescription);
      
      // Create clean excerpt and summary text (without HTML tags)
      const cleanTextContent = convertedDescription.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const shortExcerpt = cleanTextContent.substring(0, 150);
      const metaDescription = cleanTextContent.substring(0, 160);

      // Enhanced description with metadata (similar to Shopify approach but cleaner)
      const enhancedDescription = `${convertedDescription}

<hr>

<p><strong>Target Audience:</strong> ${cleanTargetAudience}</p>
<p><strong>Keywords:</strong> ${Array.isArray(content.keywords) ? content.keywords.join(', ') : content.keywords}</p>
<p><em>Generated by AI Content Creator - Optimized for ${cleanTargetAudience}</em></p>`;

      // Create field mappings with proper validation
      const fieldMappings = {
        'name': cleanTitle,
        'slug': slug,
        'content': enhancedDescription,
        'body': enhancedDescription,
        'post-body': enhancedDescription,
        'article-body': enhancedDescription,
        'description': enhancedDescription,
        'excerpt': shortExcerpt,
        'summary': shortExcerpt,
        'post-summary': shortExcerpt,
        'meta-title': cleanTitle,
        'meta-description': metaDescription,
        'seo-title': cleanTitle,
        'seo-description': metaDescription,
        'tags': Array.isArray(content.keywords) ? content.keywords.join(', ') : content.keywords,
        'keywords': Array.isArray(content.keywords) ? content.keywords.join(', ') : content.keywords
      };

      // Build the item data with only validated fields
      const itemData = {
        isArchived: false,
        isDraft: false,
        fieldData: {
          name: cleanTitle,
          slug: slug
        }
      };

      // Only add fields that exist in the collection schema
      if (validFieldSlugs.length > 2) {
        // We have field information, use it to validate
        Object.keys(fieldMappings).forEach(fieldSlug => {
          if (fieldSlug === 'name' || fieldSlug === 'slug') {
            // Already added
            return;
          }
          
          if (validFieldSlugs.includes(fieldSlug)) {
            itemData.fieldData[fieldSlug] = fieldMappings[fieldSlug];
          }
        });
        
        // If no content fields matched, try to find any rich text field
        if (!itemData.fieldData.content && !itemData.fieldData.body && !itemData.fieldData.description) {
          const richTextField = collectionFields.find(f => f.type === 'RichText' || f.type === 'rich-text');
          if (richTextField) {
            console.log(`Using rich text field: ${richTextField.slug}`);
            itemData.fieldData[richTextField.slug] = enhancedDescription;
          }
        }
      } else {
        // No field validation available, try minimal safe approach
        console.log('Using minimal field mapping due to missing collection schema');
        // Only add the most basic fields that should always exist
        // Don't add any content fields to avoid validation errors
      }

      console.log(`Publishing item data to collection ${blogCollection.id}:`, {
        title: itemData.fieldData.name,
        slug: itemData.fieldData.slug,
        contentLength: itemData.fieldData.content?.length || 0,
        excerptLength: itemData.fieldData.excerpt?.length || 0,
        tags: itemData.fieldData.tags
      });

      // Create the collection item
      const response = await axios.post(`https://api.webflow.com/v2/collections/${blogCollection.id}/items`, itemData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log(`Successfully created Webflow item:`, response.data.id);

      // Publish the site to make the content live with retry logic for rate limiting
      const publishWithRetry = async (retryCount = 0, maxRetries = 2) => {
        try {
          // Try publishing without domains array first (newer API format)
          let publishResponse;
          try {
            publishResponse = await axios.post(`https://api.webflow.com/v2/sites/${siteId}/publish`, {}, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
          } catch (firstAttemptError) {
            // If that fails, try with domains array (older API format)
            console.log('First publish attempt failed, trying with domains array...');
            publishResponse = await axios.post(`https://api.webflow.com/v2/sites/${siteId}/publish`, {
              domains: []
            }, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
          }
          console.log(`Successfully published site ${siteId}`, publishResponse.status);
        } catch (publishError) {
          const isRateLimit = publishError.response?.status === 429;
          
          if (isRateLimit && retryCount < maxRetries) {
            const waitTime = Math.pow(2, retryCount) * 2000; // Exponential backoff: 2s, 4s, 8s
            console.log(`Rate limited (429). Retrying in ${waitTime/1000}s... (attempt ${retryCount + 1}/${maxRetries + 1})`);
            
            setTimeout(async () => {
              await publishWithRetry(retryCount + 1, maxRetries);
            }, waitTime);
          } else {
            const errorMessage = isRateLimit ? 
              'Rate limited - content created but site publishing delayed. Will auto-publish when rate limit resets.' :
              `Publishing failed: ${publishError.response?.data || publishError.message}`;
            
            console.warn('Could not auto-publish site, item created but may need manual publishing:', publishError.response?.status, errorMessage);
          }
        }
      };

      await publishWithRetry();

      // Get site domain for URL construction
      const siteResponse = await axios.get(`https://api.webflow.com/v2/sites/${siteId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      const siteDomain = siteResponse.data.customDomains?.[0] || siteResponse.data.shortName + '.webflow.io';

      return {
        postId: response.data.id,
        url: `https://${siteDomain}/${blogCollection.slug}/${slug}`
      };

    } catch (error) {
      console.error('Webflow publishing error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        errors: error.response?.data?.message || error.response?.data?.errors,
        details: error.response?.data?.details,
        message: error.message
      });
      
      // Provide more specific error messages
      if (error.response?.status === 400) {
        const errorDetails = error.response?.data?.details;
        if (errorDetails && Array.isArray(errorDetails)) {
          const fieldErrors = errorDetails.map(detail => {
            const field = detail.param || detail.field || 'unknown field';
            const message = detail.description || detail.message || 'validation error';
            return `${field}: ${message}`;
          }).join(', ');
          throw new Error(`Webflow validation failed: ${fieldErrors}`);
        }
        throw new Error(`Webflow validation error: ${error.response?.data?.message || 'Invalid field data'}`);
      }
      
      throw error;
    }
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
    let blogHandle = 'ai-content'; // Default handle
    try {
      // Try to get existing blogs
      const blogsResponse = await axios.get(`https://${shopDomain}/admin/api/${apiVersion}/blogs.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (blogsResponse.data.blogs && blogsResponse.data.blogs.length > 0) {
        const existingBlog = blogsResponse.data.blogs[0];
        blogId = existingBlog.id;
        blogHandle = existingBlog.handle;
        console.log(`Using existing blog with ID: ${blogId}, handle: ${blogHandle}`);
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
        
        const newBlog = createBlogResponse.data.blog;
        blogId = newBlog.id;
        blogHandle = newBlog.handle;
        console.log(`Created new blog with ID: ${blogId}, handle: ${blogHandle}`);
      }
    } catch (error) {
      console.error('Error checking/creating blog:', error.message);
      // Fallback to default blog ID
      blogId = 1;
      blogHandle = 'news'; // Most common default handle for existing blogs
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

    const publishedUrl = `https://${shopDomain}/blogs/${blogHandle}/${response.data.article.handle}`;
    console.log('Shopify publish returning URL:', publishedUrl);
    
    return {
      postId: response.data.article.id,
      url: publishedUrl
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

  async testWebflowConnection(credentials) {
    const { accessToken } = credentials.authDetails;
    
    if (!accessToken) {
      throw new Error('Missing Webflow credentials: accessToken is required');
    }
    
    console.log('Testing Webflow connection');
    
    try {
      const response = await axios.get('https://api.webflow.com/v2/sites', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Webflow API response:', response.status);
      
      return {
        success: true,
        sites: response.data.sites || [],
        sitesCount: response.data.sites?.length || 0
      };
    } catch (error) {
      console.error('Webflow connection test failed:', error.response?.status, error.response?.data);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid access token. Please reconnect your Webflow account.');
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions. Please reconnect with proper scopes.');
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error('Cannot connect to Webflow API. Please try again.');
      } else {
        throw new Error(`Webflow API error: ${error.response?.data?.message || error.message}`);
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
