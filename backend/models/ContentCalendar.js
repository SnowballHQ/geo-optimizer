const mongoose = require('mongoose');

const contentCalendarSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  keywords: {
    type: [String], // Changed from String to [String] array
    required: true
  },
  targetAudience: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  outline: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'published'],
    default: 'draft'
  },
  cmsPlatform: {
    type: String,
    enum: ['wordpress', 'webflow', 'shopify', 'wix'],
    default: 'wordpress'
  },
  publishedAt: {
    type: Date
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

// Index for efficient queries
contentCalendarSchema.index({ userId: 1, date: 1 });
contentCalendarSchema.index({ status: 1, date: 1 });

// Update timestamp on save
contentCalendarSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ContentCalendar', contentCalendarSchema);
