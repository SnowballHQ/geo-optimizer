const mongoose = require("mongoose");

const BrandProfileSchema = new mongoose.Schema({
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  brandName: { type: String, required: true },
  domain: { type: String, required: true },
  brandTonality: { 
    type: String, 
    required: false, 
    default: "", 
    trim: true, 
    maxlength: 500 
  },
  brandInformation: { 
    type: String, 
    required: false, 
    default: "", 
    trim: true, 
    maxlength: 10000 
  },
  competitors: [{ type: String }], // Add missing competitors field
  isAdminAnalysis: { type: Boolean, default: false }, // Flag for super user admin analyses
  analysisSessionId: { type: String }, // Session ID for Super User analysis isolation
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Fix legacy index issue for super user functionality
BrandProfileSchema.pre('init', async function() {
  try {
    // Check if old simple unique index exists (without partial filter)
    const indexes = await this.collection.listIndexes().toArray();
    const ownerUserIdIndex = indexes.find(idx => 
      idx.name === 'ownerUserId_1' && !idx.partialFilterExpression
    );
    
    if (ownerUserIdIndex) {
      console.log('🔄 Found legacy ownerUserId index - dropping to enable super user functionality');
      await this.collection.dropIndex("ownerUserId_1");
      console.log('✅ Legacy index dropped - partial index will be recreated automatically');
    }
  } catch (error) {
    // Ignore errors - index might not exist or already be correct
    console.log('ℹ️ Index cleanup completed or skipped:', error.message);
  }
});

// Update the updatedAt field whenever the document is modified
BrandProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add partial unique index to ensure only one regular brand per user (excludes admin analyses)
BrandProfileSchema.index(
  { ownerUserId: 1 }, 
  { 
    unique: true,
    partialFilterExpression: {
      $or: [
        { isAdminAnalysis: { $exists: false } },
        { isAdminAnalysis: false }
      ]
    }
  }
);

// Add validation to prevent multiple brands per user (except for super user admin analyses)
BrandProfileSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Check if this is a super user admin analysis
    if (this.isAdminAnalysis) {
      // Super users can have multiple admin analysis brands
      console.log('🔥 Super user admin analysis - allowing multiple brands');
      return next();
    }
    
    // For regular users, enforce one brand per user rule
    const existingBrand = await this.constructor.findOne({ 
      ownerUserId: this.ownerUserId,
      $or: [
        { isAdminAnalysis: { $exists: false } },
        { isAdminAnalysis: false }
      ]
    });
    
    if (existingBrand) {
      console.log('❌ Regular user attempting to create multiple brands');
      return next(new Error('User already has a brand profile. Only one brand per user is allowed.'));
    }
  }
  next();
});

module.exports = mongoose.model("BrandProfile", BrandProfileSchema);