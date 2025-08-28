const mongoose = require("mongoose");

const SuperUserAnalysisSchema = new mongoose.Schema({
  // Core Analysis Info
  superUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true 
  },
  analysisId: { 
    type: String, 
    unique: true,
    index: true 
  },
  
  // Domain Information
  domain: { type: String, required: true },
  brandName: { type: String, required: true },
  brandInformation: { type: String, default: "" },
  brandTonality: { type: String, default: "" },
  
  // Analysis Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  currentStep: { type: Number, default: 1 },
  
  // Onboarding Flow Data (isolated for each analysis)
  step1Data: {
    domain: String,
    brandName: String,
    description: String,
    completed: { type: Boolean, default: false }
  },
  
  step2Data: {
    categories: [String],
    completed: { type: Boolean, default: false }
  },
  
  step3Data: {
    competitors: [String],
    completed: { type: Boolean, default: false }
  },
  
  step4Data: {
    prompts: [{
      categoryName: String,
      prompts: [String]
    }],
    completed: { type: Boolean, default: false }
  },
  
  step5Data: {
    mentions: [{
      companyName: String,
      promptText: String,
      responseText: String,
      categoryName: String,
      confidence: Number,
      createdAt: Date
    }],
    totalMentions: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: Date
  },
  
  step6Data: {
    shareOfVoice: { type: mongoose.Schema.Types.Mixed },
    brandShare: { type: Number, default: 0 },
    competitorShares: [{
      competitor: String,
      share: Number,
      mentions: Number
    }],
    completed: { type: Boolean, default: false },
    completedAt: Date
  },
  
  // Analysis Results (isolated per analysis)
  analysisResults: {
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "BrandProfile" },
    categories: [{
      name: String,
      prompts: [String]
    }],
    competitors: [String],
    shareOfVoice: { type: mongoose.Schema.Types.Mixed },
    mentionCounts: { type: mongoose.Schema.Types.Mixed },
    totalMentions: { type: Number, default: 0 },
    brandShare: { type: Number, default: 0 },
    aiVisibilityScore: { type: Number, default: 0 },
    analysisSteps: { type: mongoose.Schema.Types.Mixed }
  },
  
  // Analysis Metadata
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  analysisTime: { type: Number }, // in milliseconds
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate unique analysis ID
SuperUserAnalysisSchema.pre('save', function(next) {
  if (!this.analysisId) {
    // Generate a unique analysis ID
    this.analysisId = `SUA_${this.superUserId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  this.updatedAt = new Date();
  next();
});

// Alternative: Generate analysisId before validation
SuperUserAnalysisSchema.pre('validate', function(next) {
  if (!this.analysisId) {
    this.analysisId = `SUA_${this.superUserId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Calculate analysis time when completed
SuperUserAnalysisSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    this.analysisTime = this.completedAt.getTime() - this.startedAt.getTime();
  }
  next();
});

// Compound index for efficient queries
SuperUserAnalysisSchema.index({ superUserId: 1, createdAt: -1 });
SuperUserAnalysisSchema.index({ superUserId: 1, status: 1 });
SuperUserAnalysisSchema.index({ analysisId: 1, superUserId: 1 });

module.exports = mongoose.model("SuperUserAnalysis", SuperUserAnalysisSchema);