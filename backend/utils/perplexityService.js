const axios = require('axios');
const TokenCostLogger = require('./tokenCostLogger');

class PerplexityService {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.baseURL = 'https://api.perplexity.ai';
    this.tokenLogger = new TokenCostLogger();
  }

  async getDomainInfo(domainUrl) {
    try {
      console.log(`🔍 Fetching domain info and description from Perplexity for: ${domainUrl}`);
      
      if (!this.apiKey) {
        console.warn('⚠️ Perplexity API key not found, using fallback');
        const fallbackInfo = `Information about ${domainUrl} - a business website offering various services and solutions.`;
        const fallbackDescription = `${domainUrl} is a business website that provides various services and solutions to its customers.`;
        return { domainInfo: fallbackInfo, description: fallbackDescription };
      }

      const prompt = `Analyze ${domainUrl} and provide two things:

1. A comprehensive overview of what this company does, their primary services, products, and offerings (for category analysis)
2. A concise brand description that summarizes their core value proposition

Format your response as:
OVERVIEW: [detailed business overview for analysis]
DESCRIPTION: [concise brand description]`;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'sonar',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const fullResponse = response.data.choices[0].message.content;
      
      // Parse the response to extract both parts
      let domainInfo = '';
      let description = '';
      
      const overviewMatch = fullResponse.match(/OVERVIEW:\s*(.*?)(?=DESCRIPTION:|$)/s);
      const descriptionMatch = fullResponse.match(/DESCRIPTION:\s*(.*?)$/s);
      
      if (overviewMatch) {
        domainInfo = overviewMatch[1].trim();
      } else {
        domainInfo = fullResponse.trim();
      }
      
      if (descriptionMatch) {
        description = descriptionMatch[1].trim();
        // Clean up the description
        if (description.length > 200) {
          const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
          if (sentences.length >= 2) {
            description = sentences.slice(0, 2).join('. ') + '.';
          } else {
            description = description.substring(0, 200).trim();
            if (!description.endsWith('.')) {
              description += '...';
            }
          }
        }
      } else {
        // Fallback: create description from domain info
        description = domainInfo.length > 200 ? 
          domainInfo.substring(0, 200).trim() + '...' : 
          domainInfo;
      }
      
      // Log token usage and cost
      this.tokenLogger.logPerplexityCall(
        'Domain Information & Description',
        prompt,
        fullResponse,
        'sonar-pro'
      );

      console.log(`✅ Perplexity response received for ${domainUrl}`);
      console.log(`📝 Domain info length: ${domainInfo.length} chars`);
      console.log(`📝 Description length: ${description.length} chars`);
      console.log(`📝 Full response length: ${fullResponse.length} chars`);
      
      // Return the full response as one complete piece for comprehensive brand info
      return { 
        domainInfo: fullResponse, // Save the complete response as domainInfo
        description: fullResponse, // Save the complete response as description too
        fullResponse: fullResponse, // Keep for backward compatibility
        rawResponse: response.data // Export the complete API response object
      };

    } catch (error) {
      console.error(`❌ Perplexity API error for ${domainUrl}:`, error.message);
      
      // Fallback response
      const fallbackInfo = `Information about ${domainUrl} - a business website offering various services and solutions.`;
      const fallbackDescription = `${domainUrl} is a business website that provides various services and solutions to its customers.`;
      const fallbackFullResponse = `OVERVIEW: ${fallbackInfo}\nDESCRIPTION: ${fallbackDescription}`;
      return { 
        domainInfo: fallbackFullResponse, // Save complete fallback response
        description: fallbackFullResponse, // Save complete fallback response
        fullResponse: fallbackFullResponse,
        rawResponse: { 
          choices: [{ message: { content: fallbackFullResponse } }],
          usage: { total_tokens: 0 },
          model: 'fallback'
        }
      };
    }
  }
}

module.exports = PerplexityService; 