const axios = require('axios');

class DataForSeoService {
  constructor() {
    this.login = process.env.DATAFORSEO_LOGIN;
    this.password = process.env.DATAFORSEO_PASSWORD;
    this.apiUrl = process.env.DATAFORSEO_API_URL || 'https://api.dataforseo.com';
    
    if (!this.login || !this.password) {
      console.warn('⚠️ DataForSEO credentials not found in environment variables');
    }
  }

  async makeRequest(endpoint, data = null) {
    try {
      const config = {
        method: data ? 'POST' : 'GET',
        url: `${this.apiUrl}${endpoint}`,
        auth: {
          username: this.login,
          password: this.password
        },
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      console.log(`📡 DataForSEO API Request: ${endpoint}`);
      const response = await axios(config);
      
      if (response.data && response.data.status_code === 20000) {
        console.log(`✅ DataForSEO API Success: ${endpoint}`);
        return response.data;
      } else {
        throw new Error(`DataForSEO API Error: ${response.data.status_message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`❌ DataForSEO API Error for ${endpoint}:`, error.message);
      throw error;
    }
  }

  extractDomainFromUrl(url) {
    try {
      if (!url) return null;
      
      let domain = url;
      
      if (url.includes('://')) {
        domain = url.split('://')[1];
      }
      
      domain = domain.split('/')[0];
      domain = domain.replace('www.', '');
      
      return domain;
    } catch (error) {
      console.error('Error extracting domain:', error);
      return null;
    }
  }

  async getDomainKeywords(domain, limit = 50) {
    try {
      if (!this.login || !this.password) {
        console.error('❌ DataForSEO credentials not configured');
        console.log('   Login exists:', !!this.login);
        console.log('   Password exists:', !!this.password);
        throw new Error('DataForSEO credentials not configured');
      }

      console.log('🔍 DEBUG: DataForSEO getDomainKeywords input:');
      console.log('   Raw domain:', domain);
      console.log('   Domain type:', typeof domain);
      console.log('   Limit:', limit);

      const cleanDomain = this.extractDomainFromUrl(domain);
      if (!cleanDomain) {
        console.error('❌ Invalid domain after extraction');
        console.log('   Original domain:', domain);
        console.log('   Cleaned domain:', cleanDomain);
        throw new Error('Invalid domain provided');
      }

      console.log(`🔍 Fetching keywords for domain: ${cleanDomain}`);
      console.log('   Using credentials:', this.login ? 'Login OK' : 'Login Missing', this.password ? 'Password OK' : 'Password Missing');

      const requestData = [{
        target: cleanDomain,
        location_code: 2840, // USA
        language_code: "en",
        limit: Math.min(limit, 100),
        offset: 0,
        filters: [
          ["search_volume", ">=", 100],
          ["keyword_difficulty", "<=", 70]
        ],
        order_by: ["search_volume,desc"]
      }];

      console.log('🔍 DEBUG: Making DataForSEO API request with data:');
      console.log('   Endpoint: /v3/dataforseo_labs/google/domain_keywords/live');
      console.log('   Request data:', JSON.stringify(requestData, null, 2));

      const response = await this.makeRequest('/v3/dataforseo_labs/google/domain_keywords/live', requestData);

      console.log('🔍 DEBUG: DataForSEO API Response structure:');
      console.log('   Response has tasks:', !!response.tasks);
      console.log('   Tasks length:', response.tasks?.length || 0);
      console.log('   First task exists:', !!response.tasks?.[0]);
      console.log('   First task has result:', !!response.tasks?.[0]?.result);
      console.log('   Result length:', response.tasks?.[0]?.result?.length || 0);

      if (response.tasks && response.tasks[0] && response.tasks[0].result) {
        const keywords = response.tasks[0].result;
        console.log(`📊 Found ${keywords.length} keywords for ${cleanDomain}`);
        
        // Log a sample of the keywords for debugging
        if (keywords.length > 0) {
          console.log('🔍 DEBUG: Sample keywords (first 3):');
          keywords.slice(0, 3).forEach((kw, idx) => {
            console.log(`   ${idx + 1}. ${kw.keyword} (${kw.search_volume} searches, ${kw.keyword_difficulty}% difficulty)`);
          });
        }

        const processedKeywords = keywords.map(keyword => ({
          keyword: keyword.keyword,
          searchVolume: keyword.search_volume || 0,
          difficulty: keyword.keyword_difficulty || 0,
          cpc: keyword.cpc || 0,
          competition: keyword.competition || 0,
          source: 'dataforseo'
        }));

        return {
          success: true,
          domain: cleanDomain,
          keywords: processedKeywords,
          totalKeywords: processedKeywords.length
        };
      }

      console.log('⚠️ No keywords found in DataForSEO response');
      console.log('   Full response:', JSON.stringify(response, null, 2));

      return {
        success: false,
        domain: cleanDomain,
        keywords: [],
        error: 'No keywords found'
      };

    } catch (error) {
      console.error('Error fetching domain keywords:', error);
      return {
        success: false,
        domain: domain,
        keywords: [],
        error: error.message
      };
    }
  }

  async getKeywordSuggestions(keyword, limit = 30) {
    try {
      if (!this.login || !this.password) {
        throw new Error('DataForSEO credentials not configured');
      }

      console.log(`💡 Getting keyword suggestions for: ${keyword}`);

      const requestData = [{
        keyword: keyword,
        location_code: 2840, // USA
        language_code: "en",
        limit: Math.min(limit, 100),
        offset: 0,
        filters: [
          ["search_volume", ">=", 50]
        ],
        order_by: ["search_volume,desc"]
      }];

      const response = await this.makeRequest('/v3/dataforseo_labs/google/keyword_suggestions/live', requestData);

      if (response.tasks && response.tasks[0] && response.tasks[0].result) {
        const suggestions = response.tasks[0].result;
        console.log(`💡 Found ${suggestions.length} keyword suggestions for ${keyword}`);

        const processedSuggestions = suggestions.map(suggestion => ({
          keyword: suggestion.keyword,
          searchVolume: suggestion.search_volume || 0,
          difficulty: suggestion.keyword_difficulty || 0,
          cpc: suggestion.cpc || 0,
          competition: suggestion.competition || 0,
          source: 'dataforseo'
        }));

        return {
          success: true,
          seedKeyword: keyword,
          suggestions: processedSuggestions,
          totalSuggestions: processedSuggestions.length
        };
      }

      return {
        success: false,
        seedKeyword: keyword,
        suggestions: [],
        error: 'No suggestions found'
      };

    } catch (error) {
      console.error('Error fetching keyword suggestions:', error);
      return {
        success: false,
        seedKeyword: keyword,
        suggestions: [],
        error: error.message
      };
    }
  }

  filterKeywordsByRelevance(keywords, brandCategories = [], minSearchVolume = 100, maxDifficulty = 60) {
    try {
      let filteredKeywords = keywords.filter(kw => 
        kw.searchVolume >= minSearchVolume && 
        kw.difficulty <= maxDifficulty
      );

      if (brandCategories && brandCategories.length > 0) {
        const categoryTerms = brandCategories.map(cat => 
          typeof cat === 'string' ? cat.toLowerCase() : cat.categoryName?.toLowerCase()
        ).filter(Boolean);

        const relevantKeywords = filteredKeywords.filter(kw => {
          const keywordLower = kw.keyword.toLowerCase();
          return categoryTerms.some(term => 
            keywordLower.includes(term) || 
            term.includes(keywordLower.split(' ')[0])
          );
        });

        if (relevantKeywords.length > 0) {
          filteredKeywords = relevantKeywords;
        }
      }

      filteredKeywords.sort((a, b) => b.searchVolume - a.searchVolume);

      console.log(`🎯 Filtered keywords: ${filteredKeywords.length} relevant keywords`);
      return filteredKeywords;

    } catch (error) {
      console.error('Error filtering keywords:', error);
      return keywords;
    }
  }

  formatKeywordsForContentGeneration(keywords, limit = 20) {
    try {
      const topKeywords = keywords.slice(0, limit);
      
      const keywordGroups = {
        highVolume: topKeywords.filter(kw => kw.searchVolume > 1000).slice(0, 5),
        mediumVolume: topKeywords.filter(kw => kw.searchVolume >= 500 && kw.searchVolume <= 1000).slice(0, 5),
        longTail: topKeywords.filter(kw => kw.keyword.split(' ').length >= 3).slice(0, 5),
        lowCompetition: topKeywords.filter(kw => kw.difficulty < 30).slice(0, 5)
      };

      const keywordString = topKeywords.map(kw => 
        `${kw.keyword} (${kw.searchVolume} searches)`
      ).join(', ');

      return {
        keywordString,
        keywordGroups,
        totalKeywords: topKeywords.length,
        averageSearchVolume: Math.round(
          topKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0) / topKeywords.length
        )
      };

    } catch (error) {
      console.error('Error formatting keywords:', error);
      return {
        keywordString: '',
        keywordGroups: { highVolume: [], mediumVolume: [], longTail: [], lowCompetition: [] },
        totalKeywords: 0,
        averageSearchVolume: 0
      };
    }
  }

  async getComprehensiveKeywords(domain, brandCategories = []) {
    try {
      console.log(`🚀 Starting comprehensive keyword research for: ${domain}`);
      
      const domainKeywords = await this.getDomainKeywords(domain, 50);
      
      if (!domainKeywords.success || domainKeywords.keywords.length === 0) {
        console.log(`⚠️ No domain keywords found, generating fallback keywords`);
        return this.generateFallbackKeywords(domain, brandCategories);
      }

      const filteredKeywords = this.filterKeywordsByRelevance(
        domainKeywords.keywords, 
        brandCategories,
        100, // min search volume
        70   // max difficulty
      );

      const finalKeywords = filteredKeywords.slice(0, 30);

      console.log(`✅ Comprehensive keyword research completed: ${finalKeywords.length} keywords`);
      
      return {
        success: true,
        domain,
        keywords: finalKeywords,
        source: 'dataforseo',
        metadata: {
          totalFound: domainKeywords.keywords.length,
          afterFiltering: filteredKeywords.length,
          finalCount: finalKeywords.length,
          averageSearchVolume: Math.round(
            finalKeywords.reduce((sum, kw) => sum + kw.searchVolume, 0) / finalKeywords.length
          )
        }
      };

    } catch (error) {
      console.error('Error in comprehensive keyword research:', error);
      return this.generateFallbackKeywords(domain, brandCategories);
    }
  }

  generateFallbackKeywords(domain, brandCategories = []) {
    console.log(`🔄 Generating fallback keywords for: ${domain}`);
    
    const domainName = this.extractDomainFromUrl(domain) || domain;
    const baseName = domainName.split('.')[0];
    
    const fallbackKeywords = [
      { keyword: `${baseName} guide`, searchVolume: 500, difficulty: 30, source: 'fallback' },
      { keyword: `${baseName} tips`, searchVolume: 400, difficulty: 25, source: 'fallback' },
      { keyword: `how to use ${baseName}`, searchVolume: 300, difficulty: 20, source: 'fallback' },
      { keyword: `${baseName} best practices`, searchVolume: 250, difficulty: 35, source: 'fallback' },
      { keyword: `${baseName} tutorial`, searchVolume: 200, difficulty: 30, source: 'fallback' }
    ];

    if (brandCategories && brandCategories.length > 0) {
      brandCategories.forEach(category => {
        const categoryName = typeof category === 'string' ? category : category.categoryName;
        if (categoryName) {
          fallbackKeywords.push(
            { keyword: `${categoryName} guide`, searchVolume: 300, difficulty: 25, source: 'fallback' },
            { keyword: `best ${categoryName}`, searchVolume: 250, difficulty: 30, source: 'fallback' }
          );
        }
      });
    }

    return {
      success: true,
      domain,
      keywords: fallbackKeywords.slice(0, 15),
      source: 'fallback',
      metadata: {
        note: 'Generated fallback keywords due to API unavailability',
        totalFound: fallbackKeywords.length
      }
    };
  }
}

module.exports = new DataForSeoService();