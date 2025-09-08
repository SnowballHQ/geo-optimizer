const mongoose = require('mongoose');

const cmsCredentialsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['wordpress', 'webflow', 'shopify', 'wix'],
    required: true
  },
  authDetails: {
    // WordPress.com OAuth
    accessToken: String,
    tokenType: String,
    scope: String,
    userId: String,
    userLogin: String,
    userEmail: String,
    userDisplayName: String,
    sites: [mongoose.Schema.Types.Mixed],
    
    // WordPress Self-hosted (legacy)
    siteUrl: String,
    username: String,
    password: String,
    applicationPassword: String,
    
    // Webflow
    apiKey: String,
    siteId: String,
    
    // Shopify
    shopDomain: String,
    apiVersion: String,
    
    // Wix
    apiKey: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique combination of userId and platform
cmsCredentialsSchema.index({ userId: 1, platform: 1 }, { unique: true });

// Update timestamp on save
cmsCredentialsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CMSCredentials', cmsCredentialsSchema);
