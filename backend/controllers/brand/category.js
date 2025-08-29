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

  const catPrompt = `Task: Analyze the brand domain  ${domain} to identify its brand categorization.
Instruction:

Step 1 – Extract Core Variables: For the given brand ${domain}, determine values for each of the following variables:

Product/Service Offering
Customer Segment / Target Audience
Industry / Sector
Use Case / Customer Need
Price Positioning / Market Tier
Geography / Market Presence
Distribution Model
Brand Positioning / Values
Competitive Landscape
Regulatory/Compliance Environment

Domain information: ${domainInfo}

Step 2 – Derive Exact Categories: From the extracted variables, synthesize the 4 most essential categories that best define the brand overall.

Output Format (JSON):

{
  "brand_domain": "${domain}",
  "core_variables": {
    "product_service_offering": "<value>",
    "customer_segment": "<value>",
    "industry_sector": "<value>",
    "use_case": "<value>",
    "price_positioning": "<value>",
    "geography": "<value>",
    "distribution_model": "<value>",
    "brand_positioning": "<value>",
    "competitive_landscape": "<value>",
    "regulatory_environment": "<value>"
  },
  "final_categories": {
    "category_1": "<value>",
    "category_2": "<value>",
    "category_3": "<value>",
    "category_4": "<value>"
  }
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
      // Clean the response content - remove markdown code blocks if present
      let cleanedContent = responseContent.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsedResponse = JSON.parse(cleanedContent);
      
      // Extract categories from the new structured response
      if (parsedResponse.final_categories) {
        categories = [
          parsedResponse.final_categories.category_1,
          parsedResponse.final_categories.category_2,
          parsedResponse.final_categories.category_3,
          parsedResponse.final_categories.category_4
        ].filter(cat => cat && cat !== "<value>"); // Filter out empty or placeholder values
        
        console.log("📊 Extracted core variables:", parsedResponse.core_variables);
        console.log("🏷️ Final categories:", categories);
      } else {
        // Fallback: try to parse as simple array (backward compatibility)
        categories = Array.isArray(parsedResponse) ? parsedResponse : [];
      }
    } catch (e) {
      console.error("Failed to parse categories JSON:", responseContent);
      
      // Enhanced fallback: try to extract just the final_categories section
      try {
        const categoryMatch = responseContent.match(/"final_categories":\s*{([^}]+)}/);
        if (categoryMatch) {
          const categoriesText = categoryMatch[1];
          const categoryValues = categoriesText.match(/"category_\d+":\s*"([^"]+)"/g);
          if (categoryValues) {
            categories = categoryValues.map(match => {
              const valueMatch = match.match(/"([^"]+)"$/);
              return valueMatch ? valueMatch[1] : null;
            }).filter(Boolean);
          }
        }
      } catch (fallbackError) {
        console.error("Fallback parsing also failed:", fallbackError.message);
        categories = [];
      }
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