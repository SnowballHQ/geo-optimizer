const PromptAIResponse = require("../../models/PromptAIResponse");
const TokenCostLogger = require("../../utils/tokenCostLogger");

// Initialize token logger
const tokenLogger = new TokenCostLogger();

exports.runPromptsAndSaveResponses = async (openai, prompts, brandId, userId, analysisSessionId) => {
  console.log(`🚀 Processing ${prompts.length} prompts concurrently for faster analysis...`);
  
  // Process all prompts concurrently for much faster execution
  const processPrompt = async ({ promptDoc, catDoc }) => {
    console.log("OpenAI running prompt:", promptDoc.promptText.substring(0, 80) + "...");
    console.log(`🆔 Using analysis session ID: ${analysisSessionId}`);
    
    // Enhance the prompt to ensure brand names are mentioned in the response
    const enhancedPrompt = `${promptDoc.promptText}

IMPORTANT: In your response, make sure to explicitly mention the brand names that are referenced in the question. If the question asks about specific brands, include those brand names in your answer. Be specific and mention the actual brand names rather than using generic terms.`;
    
    try {
      const aiResp = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using faster model for better performance
        messages: [{ role: "user", content: enhancedPrompt }],
        max_tokens: 600, // Limit tokens for faster responses
      });
      
      const responseContent = aiResp.choices[0].message.content;
      
      // Log token usage and cost for AI response generation
      tokenLogger.logOpenAICall(
        `AI Response - ${catDoc.categoryName}`,
        enhancedPrompt,
        responseContent,
        'gpt-4o-mini'
      );
      
      console.log(`✅ Response generated for: ${promptDoc.promptText.substring(0, 50)}...`);
      
      // Create AI response with brandId and userId for mention tracking
      const aiDoc = await PromptAIResponse.create({ 
        promptId: promptDoc._id, 
        responseText: responseContent,
        brandId: brandId,
        userId: userId,
        analysisSessionId: analysisSessionId
      });
      
      return { aiDoc, catDoc };
    } catch (error) {
      console.error(`❌ Error processing prompt for ${catDoc.categoryName}:`, error.message);
      throw error;
    }
  };
  
  // Process all prompts concurrently with controlled concurrency
  const batchSize = 5; // Process 5 at a time to avoid rate limits
  const aiResponses = [];
  
  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(prompts.length/batchSize)} (${batch.length} prompts)`);
    
    const batchResults = await Promise.all(batch.map(processPrompt));
    aiResponses.push(...batchResults);
    
    // Small delay between batches to respect rate limits
    if (i + batchSize < prompts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`🎉 All ${aiResponses.length} AI responses generated successfully!`);
  return aiResponses;
};
