const AICompetitorMention = require("../../models/AICompetitorMention");
const TokenCostLogger = require("../../utils/tokenCostLogger");

// Initialize token logger
const tokenLogger = new TokenCostLogger();



exports.extractCompetitorsWithOpenAI = async (openai, brand, websiteContent = null) => {
  console.log("Extracting competitors for brand:", brand.brandName);
  
  // Generate brand description using OpenAI
  let brandContext = '';
  try {
    console.log("🔍 Generating brand description for competitor analysis...");
    const descriptionPrompt = `Analyze this brand and provide a brief overview of what they do:

Brand: ${brand.brandName}
Domain: ${brand.domain}

Provide a concise description of their business, products/services, and target market. Focus on what would help identify competitors.

Respond with only the description, no additional formatting.`;
    
    const descriptionResp = await openai.chat.completions.create({
      model: "gpt-4o-mini-search-preview",
      messages: [{ role: 'user', content: descriptionPrompt }],
    });
    
    const brandDescription = descriptionResp.choices[0].message.content;
    brandContext = `\nBrand Information: ${brandDescription}`;
    
    // Log token usage for description generation
    tokenLogger.logOpenAICall(
      'Brand Description for Competitor Analysis',
      descriptionPrompt,
      brandDescription,
      'gpt-4o-mini-search-preview'
    );
    
    console.log("✅ Brand description generated:", brandDescription);
    
  } catch (error) {
    console.error("⚠️ Failed to generate brand description:", error.message);
    brandContext = `\nBrand Information: ${brand.brandName} is a business operating at ${brand.domain}`;
  }
  
  const competitorPrompt = `
Variables to Extract:
	•	Brand Name: ${brand.brandName}
	•	Domain: ${brand.domain}
	•	Brand Context: ${brandContext}
	•	Target Company Size: find out
	•	Primary ICP Segment: findout
	•	Business Model Type: findout (e.g., SaaS, consulting, services, hybrid)

Task:

Identify 5 real, direct competitors for the given brand, filtered by ICP company size, ICP alignment, and business model type.



Output Requirements:

Analysis Summary:

Target Company Size Category: 
Primary ICP: 
Business Model Type: 


Final Output:

Respond with only a valid JSON array of the final 5 competitor brand names, using exact company names as they appear online:

["Exact Company Name 1", "Exact Company Name 2", "Exact Company Name 3", "Exact Company Name 4", "Exact Company Name 5"]`;

  // Log the complete prompt being sent to OpenAI
  console.log("🔍 Complete OpenAI Prompt for Competitor Extraction:");
  console.log("=" .repeat(80));
  console.log(competitorPrompt);
  console.log("=" .repeat(80));

  try {
    const competitorResp = await openai.chat.completions.create({
      model: "gpt-4o-mini-search-preview",
      messages: [ {
        "role": "system",
        "content": "You are a helpful assistant that returns only valid JSON arrays when requested. Do not include any explanations, formatting, or additional text outside of the requested JSON structure."
      },
      {
        "role": "user",
        "content": competitorPrompt,
  }
  ],
      // max_tokens: 300,
      // temperature: 0.5
    });
    
    const responseContent = competitorResp.choices[0].message.content;
    
    // Log token usage and cost for competitor extraction
    tokenLogger.logOpenAICall(
      'Competitor Extraction',
      competitorPrompt,
      responseContent,
      'gpt-4o-mini-search-preview'
    );
    
    console.log("OpenAI competitor response:", responseContent);
    
    let competitors = [];
    try {
      const parsedResponse = JSON.parse(responseContent);
      console.log("Parsed competitors JSON:", parsedResponse);
      
      // Check if the response is in the expected array format
      if (Array.isArray(parsedResponse)) {
        // Check if it's an array of strings (expected format)
        if (parsedResponse.every(item => typeof item === 'string')) {
          competitors = parsedResponse;
          console.log("✅ Using direct array format:", competitors);
        } 
        // Check if it's an array containing objects with competitors property
        else if (parsedResponse.length > 0 && parsedResponse[0].competitors && Array.isArray(parsedResponse[0].competitors)) {
          competitors = parsedResponse[0].competitors;
          console.log("✅ Using nested competitors property:", competitors);
        }
      } 
      // Check if it's an object with competitors property
      else if (parsedResponse.competitors && Array.isArray(parsedResponse.competitors)) {
        competitors = parsedResponse.competitors;
        console.log("✅ Using object competitors property:", competitors);
      }
    } catch (e) {
      console.error("Failed to parse competitors JSON:", e);
      // Fallback: extract from text
      const content = responseContent;
      competitors = content.match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, "")) || [];
      console.log("Extracted competitors from text:", competitors);
    }

    // Validate and clean competitors
    competitors = competitors
      .filter(c => c && typeof c === 'string' && c.trim().length > 0)
      .map(c => c.trim())
      .slice(0, 5); // Limit to 5 competitors

    // If no competitors found, use simple fallback
    if (competitors.length === 0) {
      console.log("No competitors found, using fallback competitors");
      competitors = ["Competitor A", "Competitor B", "Competitor C", "Competitor D", "Competitor E"];
    }

    console.log("Final competitors list:", competitors);

    // Save each competitor as an AICompetitorMention
    for (const competitorName of competitors) {
      try {
        await AICompetitorMention.create({
          insightId: null, // Not linked to an insight, just direct competitor extraction
          competitorName,
          competitorDomain: null,
          mentionCount: 1,
          sentiment: "neutral"
        });
        console.log("Saved competitor:", competitorName);
      } catch (error) {
        console.error("Error saving competitor:", competitorName, error);
      }
    }

    // Return both competitors and the brand description for use in other parts of the analysis
    return {
      competitors: competitors,
      brandDescription: brandContext.replace('\nBrand Information: ', '') // Remove the prefix
    };
  } catch (error) {
    console.error("Error in competitor extraction:", error);
    // Return simple fallback competitors
    return {
      competitors: ["Competitor A", "Competitor B", "Competitor C", "Competitor D", "Competitor E"],
      brandDescription: `${brand.brandName} is a business operating at ${brand.domain}`
    };
  }
};