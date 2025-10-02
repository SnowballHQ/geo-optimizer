const mongoose = require("mongoose");

const BrandShareOfVoiceSchema = new mongoose.Schema({
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: "BrandProfile", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "BrandCategory", required: false }, // Made optional
  analysisSessionId: { type: String, required: false, index: true }, // Made optional temporarily
  domain: { type: String, required: true },
  brandName: { type: String, required: true },
  description: { type: String, required: false },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "BrandCategory" }],
  categoryPrompts: [{ type: mongoose.Schema.Types.ObjectId, ref: "CategorySearchPrompt" }],
  aiResponses: [{ type: mongoose.Schema.Types.ObjectId, ref: "PromptAIResponse" }],
  competitors: [String],
  analysisDate: { type: Date, default: Date.now },
  duration: { type: Number, default: 0 },
  
  totalMentions: { type: Number, default: 0 },
  targetMentions: { type: Number, default: 0 },
  shareOfVoicePct: { type: Number, default: 0 }, // Legacy field for backward compatibility
  aiVisibilityScore: { type: Number, default: 0 }, // New field: AI-based visibility score
  trueSOV: { type: Number, default: 0 }, // Future field for multi-source SOV
  
  // Frontend-expected fields - Using Mixed type for proper deserialization
  shareOfVoice: { type: mongoose.Schema.Types.Mixed, default: {} }, // Brand name -> percentage
  mentionCounts: { type: mongoose.Schema.Types.Mixed, default: {} }, // Brand name -> mention count
  brandShare: { type: Number, default: 0 }, // Main brand's share percentage
  
  sourceBreakdown: {
    openai: { type: Number, default: 0 },
    googleSearch: { type: Number, default: 0 },
    seoData: { type: Number, default: 0 },
    socialMedia: { type: Number, default: 0 },
    newsBlogs: { type: Number, default: 0 }
  },
  channelBreakdown: {
    openai: { type: mongoose.Schema.Types.Mixed, default: {} }, // Using Mixed for proper deserialization
    google: { type: mongoose.Schema.Types.Mixed, default: {} }, // Using Mixed for proper deserialization
    reddit: { type: mongoose.Schema.Types.Mixed, default: {} }, // Using Mixed for proper deserialization
    twitter: { type: mongoose.Schema.Types.Mixed, default: {} }, // Using Mixed for proper deserialization
    news: { type: mongoose.Schema.Types.Mixed, default: {} } // Using Mixed for proper deserialization
  },
  coMentions: [{ 
    brands: [String],
    context: String,
    score: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  trendData: [{
    date: { type: Date, default: Date.now },
    score: Number,
    mentions: Number
  }],
  calculatedAt: { type: Date, default: Date.now }
});

// Add compound index for efficient querying by analysis session
BrandShareOfVoiceSchema.index({ userId: 1, analysisSessionId: 1 });

module.exports = mongoose.model("BrandShareOfVoice", BrandShareOfVoiceSchema);