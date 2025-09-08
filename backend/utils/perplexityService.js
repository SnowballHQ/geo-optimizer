const TokenCostLogger = require('./tokenCostLogger');

class PerplexityService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.tokenLogger = new TokenCostLogger();
  }

  async getDomainInfo(domainUrl) {
    try {
      console.log(`🔍 Fetching domain info and description from OpenAI for: ${domainUrl}`);
      
      if (!this.apiKey) {
        console.warn('⚠️ OpenAI API key not found, using fallback');
        const fallbackInfo = `Information about ${domainUrl} - a business website offering various services and solutions.`;
        const fallbackDescription = `${domainUrl} is a business website that provides various services and solutions to its customers.`;
        return { domainInfo: fallbackInfo, description: fallbackDescription };
      }

      const prompt = `Analyze the domain "${domainUrl}" and provide business insights based on the domain name, structure, and likely business type. Provide two things:

1. A comprehensive overview of what this company likely does, their probable primary services, products, and business offerings (for category analysis)
2. A concise brand description that summarizes their likely core value proposition and business focus
3. Don't give citations in the response

Instructions:
- Analyze the domain name and structure to infer business type and industry
- Consider common patterns in domain naming for different industries
- Provide detailed, specific insights rather than generic descriptions
- Focus on actionable business intelligence

Format your response exactly as:
OVERVIEW: [detailed business overview and likely services for analysis]
DESCRIPTION: [concise brand description and value proposition]`;

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: this.apiKey });
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-search-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
    
      });

      const fullResponse = response.choices[0].message.content;
      
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
      this.tokenLogger.logOpenAICall(
        'Domain Information & Description',
        prompt,
        fullResponse,
        'gpt-4o-mini'
      );

      console.log(`✅ OpenAI response received for ${domainUrl}`);
      console.log(`📝 Domain info length: ${domainInfo.length} chars`);
      console.log(`📝 Description length: ${description.length} chars`);
      console.log(`📝 Full response length: ${fullResponse.length} chars`);
      
      // Return the full response as one complete piece for comprehensive brand info
      return { 
        domainInfo: fullResponse, // Save the complete response as domainInfo
        description: fullResponse, // Save the complete response as description too
        fullResponse: fullResponse, // Keep for backward compatibility
        rawResponse: response // Export the complete API response object
      };

    } catch (error) {
      console.error(`❌ OpenAI API error for ${domainUrl}:`, error.message);
      
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