const axios = require('axios');

class UnsplashService {
  constructor() {
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY;
    this.baseUrl = 'https://api.unsplash.com';
    
    if (!this.accessKey || this.accessKey === 'your_unsplash_access_key_here') {
      console.warn('⚠️ Unsplash API key not configured. Banner generation will be disabled.');
    }
  }

  // Check if Unsplash is properly configured
  isConfigured() {
    return this.accessKey && this.accessKey !== 'your_unsplash_access_key_here';
  }

  // Generate banner for blog post (automatic selection)
  async generateBlogBanner(title, keywords = '') {
    try {
      if (!this.isConfigured()) {
        console.log('🖼️ Unsplash not configured, skipping banner generation');
        return null;
      }

      // Create search query from title and keywords
      const searchTerms = this.extractSearchTerms(title, keywords);
      console.log(`🖼️ Generating banner for: "${title}" with terms: "${searchTerms}"`);

      const response = await axios.get(`${this.baseUrl}/search/photos`, {
        params: {
          query: searchTerms,
          per_page: 5,
          orientation: 'landscape',
          content_filter: 'high',
          order_by: 'relevant'
        },
        headers: {
          'Authorization': `Client-ID ${this.accessKey}`,
          'Accept-Version': 'v1'
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.data.results && response.data.results.length > 0) {
        // Select the first (most relevant) image
        const selectedImage = response.data.results[0];
        
        const bannerData = {
          id: selectedImage.id,
          url: selectedImage.urls.regular, // High quality version
          downloadUrl: selectedImage.links.download_location,
          photographer: selectedImage.user.name,
          photographerUrl: selectedImage.user.links.html,
          unsplashUrl: selectedImage.links.html,
          altText: selectedImage.alt_description || selectedImage.description || `Banner image for ${title}`,
          width: selectedImage.width,
          height: selectedImage.height
        };

        // Track download for Unsplash API compliance
        await this.trackDownload(selectedImage.links.download_location);

        console.log(`✅ Generated banner by ${bannerData.photographer} for "${title}"`);
        return bannerData;
      }

      console.log(`❌ No suitable banner images found for "${title}"`);
      return null;

    } catch (error) {
      console.error('Error generating banner from Unsplash:', error.response?.data || error.message);
      return null; // Fail gracefully - blog creation continues without banner
    }
  }

  // Extract relevant search terms from title and keywords
  extractSearchTerms(title, keywords = '') {
    // Remove common blog post words and extract meaningful terms
    const commonWords = [
      'how', 'to', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'with', 'by',
      'your', 'you', 'best', 'top', 'guide', 'tips', 'strategies', 'ways', 'ultimate', 'complete'
    ];
    
    // Combine title and keywords
    const allText = `${title} ${keywords}`.toLowerCase();
    
    // Extract meaningful words
    const words = allText
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 3); // Take top 3 relevant words

    // Fallback to broader terms if no specific words found
    if (words.length === 0) {
      return 'business professional modern';
    }

    // Add generic terms to improve search results
    const searchTerms = words.join(' ') + ' business professional';
    return searchTerms.substring(0, 100); // Unsplash query length limit
  }

  // Track download for API compliance (required by Unsplash)
  async trackDownload(downloadLocation) {
    try {
      if (!downloadLocation || !this.isConfigured()) return;

      await axios.get(downloadLocation, {
        headers: {
          'Authorization': `Client-ID ${this.accessKey}`
        },
        timeout: 5000
      });

      console.log('📊 Unsplash download tracked successfully');
    } catch (error) {
      console.warn('Failed to track Unsplash download:', error.message);
      // Don't throw error as this is just for analytics compliance
    }
  }

  // Generate HTML for banner image with proper attribution
  generateBannerHTML(bannerData, title) {
    if (!bannerData) return '';

    return `
<div class="blog-banner" style="margin-bottom: 30px;">
  <img 
    src="${bannerData.url}" 
    alt="${bannerData.altText}"
    style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"
  />
  <p style="font-size: 12px; color: #666; margin: 8px 0 0 0; text-align: center; font-style: italic;">
    Photo by <a href="${bannerData.photographerUrl}?utm_source=snowball&utm_medium=referral" target="_blank" style="color: #666;">${bannerData.photographer}</a> on 
    <a href="${bannerData.unsplashUrl}?utm_source=snowball&utm_medium=referral" target="_blank" style="color: #666;">Unsplash</a>
  </p>
</div>`;
  }

  // Get service status for debugging
  getStatus() {
    return {
      configured: this.isConfigured(),
      accessKey: this.accessKey ? 'Set' : 'Not set',
      baseUrl: this.baseUrl
    };
  }
}

module.exports = new UnsplashService();