const BrandCategory = require("../../models/BrandCategory");
const PerplexityService = require("../../utils/perplexityService");
const TokenCostLogger = require("../../utils/tokenCostLogger");

// Initialize services
const perplexityService = new PerplexityService();
const tokenLogger = new TokenCostLogger();

exports.extractCategories = async (domain) => {
  // Get domain information and description from Perplexity API
  let domainInfo = '';
  let brandDescription = '';
  
  try {
    console.log(`🔍 Getting domain information and description from Perplexity for: ${domain}`);
    const response = await perplexityService.getDomainInfo(domain);
    
         // Store the complete Perplexity response as one piece
     domainInfo = response.domainInfo; // Save the full response directly
    
    brandDescription = response.description;
    console.log(`Successfully retrieved domain info and description from Perplexity`);
    console.log("Full Perplexity data stored in domainInfo");
    console.log("Brand description:", brandDescription);
    
    // Store the description globally for later use
    global.extractedBrandDescription = brandDescription;
    
  } catch (error) {
    console.error(`Failed to get domain info from Perplexity for ${domain}:`, error.message);
         domainInfo = `OVERVIEW: Information about ${domain} - a business website offering various services and solutions.\nDESCRIPTION: ${domain} is a business website that provides various services and solutions to its customers.`;
    
    brandDescription = `${domain} is a business website that provides various services and solutions to its customers.`;
    global.extractedBrandDescription = brandDescription;
  }

  const catPrompt = `figure out what does  ${domain} do and what are the main categories of services/products it offers? Give categories for it's exact niche.
domain information: ${domainInfo}
Output:
Return a JSON array of 4 category names with no explanation or extra formatting.`;
  
  // Use OpenAI API for category extraction
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  console.log("🔑 Checking OpenAI API key...");
  console.log("🔑 API Key exists:", !!process.env.OPENAI_API_KEY);
  
  if (!process.env.OPENAI_API_KEY) {
    console.log("⚠️ OpenAI API key not found, using fallback categories");
    return [
      "Business Solutions",
      "Digital Services", 
      "Technology Platform",
      "Professional Services"
    ];
  }
  
  try {
    console.log("🔍 Making OpenAI API request...");
         const catResp = await openai.chat.completions.create({
       model: "gpt-4o-mini-search-preview",
       messages: [{ role: 'user', content: catPrompt }],
       // max_tokens: 200,
       // temperature: 0.1
     });
    
    const responseContent = catResp.choices[0].message.content;
    
         // Log token usage and cost for OpenAI
     tokenLogger.logOpenAICall(
       'Category Extraction',
       catPrompt,
       responseContent,
       'gpt-4o-search-preview'
     );
    
    console.log("✅ OpenAI API response received");
    console.log("OpenAI catResp:", responseContent);
    
    let categories = [];
    try {
      categories = JSON.parse(responseContent);
    } catch (e) {
      console.error("Failed to parse categories JSON:", responseContent);
      categories = responseContent.match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, "")) || [];
    }
    return categories.slice(0, 4);
    
  } catch (error) {
    console.error("❌ OpenAI API error:", error.message);
    
    // Fallback to default categories based on domain
    console.log("🔄 Using fallback categories...");
    const fallbackCategories = [
      "Business Solutions",
      "Digital Services", 
      "Technology Platform",
      "Professional Services"
    ];
    
    return fallbackCategories;
  }
};

exports.saveCategories = async (brand, categories) => {
  const BrandCategory = require("../../models/BrandCategory");
  const catDocs = [];
  for (const cat of categories) {
    // Check if category already exists for this brand to prevent duplicates
    let catDoc = await BrandCategory.findOne({ 
      brandId: brand._id, 
      categoryName: cat 
    });
    
    if (catDoc) {
      console.log("BrandCategory already exists:", {
        id: catDoc._id,
        brandId: catDoc.brandId,
        categoryName: catDoc.categoryName
      });
    } else {
      catDoc = await BrandCategory.create({ brandId: brand._id, categoryName: cat });
      console.log("BrandCategory created:", {
        id: catDoc._id,
        brandId: catDoc.brandId,
        categoryName: catDoc.categoryName
      });
    }
    
    catDocs.push(catDoc);
  }
  return catDocs;
};