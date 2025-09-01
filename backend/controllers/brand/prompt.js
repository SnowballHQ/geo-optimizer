const CategorySearchPrompt = require("../../models/CategorySearchPrompt");
const TokenCostLogger = require("../../utils/tokenCostLogger");

// Initialize token logger
const tokenLogger = new TokenCostLogger();

exports.generateAndSavePrompts = async (openai, catDocs, brand, competitors = []) => {
  console.log(`🔄 Starting simplified two-step prompt generation for ${catDocs.length} categories`);
  console.log(`🏢 Using competitors: ${competitors.join(', ')}`);
  const prompts = [];
  
  for (const catDoc of catDocs) {
    console.log(`📝 Step 1: Getting long-tail keywords for category: ${catDoc.categoryName} (${catDoc._id})`);

    // Step 1: Get long-tail keywords from OpenAI
    let keywords = [];
    try {
      const keywordPrompt = `Generate 10 long-tail keywords for ${brand.domain} in the ${catDoc.categoryName} category. These should be specific search terms that users might use when looking for services like what ${brand.domain} offers.

Return ONLY a JSON array of 10 keyword strings. Example format:
["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6", "keyword 7", "keyword 8", "keyword 9", "keyword 10"]

Focus on:
- Specific, long-tail search terms
- User intent-based keywords
- Terms that would naturally lead to brand mentions
- Current, relevant search patterns`;

      const keywordResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: keywordPrompt }],
        max_tokens: 300,
        temperature: 0.1
      });

      const keywordContent = keywordResponse.choices[0].message.content;
      
      // Log token usage and cost for keyword generation
      tokenLogger.logOpenAICall(
        `Keyword Generation - ${catDoc.categoryName}`,
        keywordPrompt,
        keywordContent,
        'gpt-3.5-turbo'
      );
      
      console.log("OpenAI keyword response:", keywordContent);

      // Parse keywords from response
      try {
        const parsedKeywords = JSON.parse(keywordContent);
        if (Array.isArray(parsedKeywords)) {
          keywords = parsedKeywords.slice(0, 10);
        }
      } catch (parseError) {
        console.log("⚠️ JSON parsing failed, extracting keywords with regex");
        // Fallback: Extract quoted strings
        const quotedStrings = keywordContent.match(/"([^"]+)"/g);
        if (quotedStrings) {
          keywords = quotedStrings.map(s => s.replace(/"/g, "")).slice(0, 10);
        }
      }

      console.log(`✅ Retrieved ${keywords.length} keywords for ${catDoc.categoryName}:`, keywords);
    } catch (error) {
      console.error(`❌ Error getting keywords for ${catDoc.categoryName}:`, error.message);
      // Fallback keywords
      keywords = [
        `${catDoc.categoryName} solutions`,
        `best ${catDoc.categoryName} services`,
        `${catDoc.categoryName} comparison`,
        `${catDoc.categoryName} alternatives`,
        `${catDoc.categoryName} reviews`
      ];
    }

    // Step 2: Generate prompts based on keywords
    console.log(`📝 Step 2: Generating prompts based on keywords for ${catDoc.categoryName}`);
    
    // Use real competitors if provided, otherwise fallback
    const competitorList = competitors.length > 0 ? competitors : [
      'competitor1', 'competitor2', 'competitor3', 'competitor4', 'competitor5'
    ];
    
    // Generate prompts based on keywords that users typically ask ChatGPT
    const promptGen = `You are helping a digital marketing researcher generate realistic, user-like questions that people typically ask ChatGPT about ${catDoc.categoryName} services.

Long-tail keywords for ${brand.domain} in ${catDoc.categoryName}: ${keywords.join(', ')}

Popular competitors include: ${competitorList.join(', ')}.

Generate 5 natural, conversational questions that users typically ask ChatGPT about these keywords. These questions should be framed so that responses would naturally mention ${brand.brandName} but it should not mention explicitly or showing biasness towrads ${brand.brandName} , also same goes for competitors.

Guidelines:
- prompt should not mention ${brand.brandName}.
- Use the provided keywords as inspiration for question topics
- Use natural, conversational phrasing reflecting genuine user curiosity (e.g., "What are the best…", "Which platforms…", "How do I choose…").
- Cover themes like comparisons, alternatives, recommendations, trending tools, and value-for-money.
- Do NOT mention the brand name in the questions themselves.
- Structure questions in the style commonly found in topic-based research or FAQs.
- Create questions that lead naturally to mentioning brands in answers.
- Focus on questions that users would actually ask ChatGPT for help with.

Format: Output only a JSON array of 5 strings.`;


    try {
      const promptResp = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: promptGen }],
        max_tokens: 300,
      });
      
      const promptContent = promptResp.choices[0].message.content;
      
      // Log token usage and cost for prompt generation
      tokenLogger.logOpenAICall(
        `Prompt Generation - ${catDoc.categoryName}`,
        promptGen,
        promptContent,
        'gpt-3.5-turbo'
      );
      
      console.log("OpenAI promptResp:", promptContent);
      let promptArr = [];
      try {
        promptArr = JSON.parse(promptContent);
      } catch (parseError) {
        console.log("⚠️ JSON parsing failed for prompts, extracting with regex");
        // Fallback: Extract quoted strings
        const quotedStrings = promptContent.match(/"([^"]+)"/g);
        if (quotedStrings) {
          promptArr = quotedStrings.map(s => s.replace(/"/g, ""));
        }
      }
      promptArr = promptArr.slice(0, 5);
      console.log(`📋 Generated ${promptArr.length} prompts for category ${catDoc.categoryName}`);
      for (const p of promptArr) {
        const promptText = typeof p === "string" ? p : p.query;
        console.log(`💾 Saving prompt: ${promptText.substring(0, 50)}...`);
        const promptDoc = await CategorySearchPrompt.create({ 
          categoryId: catDoc._id, 
          brandId: brand._id,
          promptText 
        });
        // Validate data before pushing to ensure structure integrity
        if (promptDoc && catDoc) {
          prompts.push({ promptDoc, catDoc });
          console.log("✅ CategorySearchPrompt created:", promptDoc._id, "for category:", catDoc.categoryName);
        } else {
          console.error("❌ Invalid data structure:", { 
            hasPromptDoc: !!promptDoc, 
            hasCatDoc: !!catDoc,
            promptId: promptDoc?._id,
            categoryId: catDoc?._id 
          });
        }
      }
    } catch (error) {
      console.error(`❌ Error generating prompts for category ${catDoc.categoryName}:`, error);
      console.error(`❌ Full error details:`, {
        message: error.message,
        stack: error.stack,
        categoryId: catDoc._id,
        categoryName: catDoc.categoryName,
        brandId: brand._id
      });
      // Continue with next category instead of failing completely
    }
  }
  console.log(`🎉 Prompt generation complete. Created ${prompts.length} prompts total.`);
  return prompts;
};