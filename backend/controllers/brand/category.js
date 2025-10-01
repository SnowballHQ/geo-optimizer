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

  const catPrompt = `Analyze the brand domain ${domain} and identify 4 content categories that best define the brand.

Domain information: ${domainInfo}

Respond ONLY with valid JSON in this exact format (no explanations, no markdown):

{
  "categories": ["Category 1", "Category 2", "Category 3", "Category 4"]
}`;
  
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
       model: "gpt-4o-mini",
       messages: [
         {
           role: 'system',
           content: 'You are a brand categorization expert. Always respond with valid JSON only, no explanations or markdown formatting.'
         },
         { role: 'user', content: catPrompt }
       ],
       response_format: { type: "json_object" },
       temperature: 0.3
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
      // Clean the response content - remove markdown code blocks if present
      let cleanedContent = responseContent.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\s*/, '').replace(/\s*```$/, '');
      }

      const parsedResponse = JSON.parse(cleanedContent);

      // Extract categories from the simplified response
      if (parsedResponse.categories && Array.isArray(parsedResponse.categories)) {
        categories = parsedResponse.categories.filter(cat => cat && typeof cat === 'string' && cat.trim());
        console.log("🏷️ Extracted categories:", categories);
      } else {
        console.error("❌ Unexpected response format:", parsedResponse);
        categories = [];
      }
    } catch (e) {
      console.error("Failed to parse categories JSON:", e.message);
      console.error("Response content:", responseContent);
      categories = [];
    }
    
    // Ensure we always return exactly 4 categories
    const finalCategories = categories.slice(0, 4);
    if (finalCategories.length < 4) {
      console.log(`⚠️ Only ${finalCategories.length} categories extracted, using fallback for remaining`);
      const fallbackSuffixes = ["Solutions", "Services", "Platform", "Tools"];
      while (finalCategories.length < 4) {
        finalCategories.push(`${domain} ${fallbackSuffixes[finalCategories.length - 1] || "Category"}`);
      }
    }
    
    return finalCategories;
    
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