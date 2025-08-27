const PromptAIResponse = require("../../models/PromptAIResponse");
const TokenCostLogger = require("../../utils/tokenCostLogger");

// Initialize token logger
const tokenLogger = new TokenCostLogger();

exports.runPromptsAndSaveResponses = async (openai, prompts, brandId, userId, analysisSessionId) => {
  const aiResponses = [];
  for (const { promptDoc, catDoc } of prompts) {
    console.log("OpenAI running prompt:", promptDoc.promptText);
    console.log(`🆔 Using analysis session ID: ${analysisSessionId}`);
    
    // Enhance the prompt to ensure brand names are mentioned in the response
    const enhancedPrompt = `${promptDoc.promptText}

IMPORTANT: In your response, make sure to explicitly mention the brand names that are referenced in the question. If the question asks about specific brands, include those brand names in your answer. Be specific and mention the actual brand names rather than using generic terms.`;
    
    const aiResp = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: enhancedPrompt }],
      // max_tokens: 800,
    });
    
    const responseContent = aiResp.choices[0].message.content;
    
    // Log token usage and cost for AI response generation
    tokenLogger.logOpenAICall(
      `AI Response - ${catDoc.categoryName}`,
      enhancedPrompt,
      responseContent,
      'gpt-5'
    );
    
    console.log("OpenAI aiResp:", responseContent);
    const aiText = responseContent;
    
    // Create AI response with brandId and userId for mention tracking
    const aiDoc = await PromptAIResponse.create({ 
      promptId: promptDoc._id, 
      responseText: aiText,
      brandId: brandId,
      userId: userId,
      analysisSessionId: analysisSessionId // ✅ Add analysis session ID
    });
    
    aiResponses.push({ aiDoc, catDoc });
    console.log("PromptAIResponse created:", aiDoc);
  }
  return aiResponses;
};
