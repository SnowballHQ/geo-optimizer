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
  publishedUrl: {
    type: String,
    default: null
  },
  lastAnalyzedAt: {
    type: Date,
    default: null
  },
  // Banner image data from Unsplash
  bannerUrl: {
    type: String,
    default: null
  },
  bannerData: {
    photographer: {
      type: String,
      default: null
    },
    photographerUrl: {
      type: String,
      default: null
    },
    unsplashUrl: {
      type: String,
      default: null
    },
    altText: {
      type: String,
      default: null
    }
  },
  // SEO Keywords from DataForSEO
  sourceKeywords: [{
    keyword: {
      type: String,
      required: true
    },
    searchVolume: {
      type: Number,
      default: 0
    },
    difficulty: {
      type: Number,
      default: 0
    },
    cpc: {
      type: Number,
      default: 0
    },
    competition: {
      type: Number,
      default: 0
    },
    source: {
      type: String,
      enum: ['dataforseo', 'fallback', 'manual'],
      default: 'manual'
    }
  }],
  keywordResearchData: {
    domain: {
      type: String,
      default: null
    },
    researchDate: {
      type: Date,
      default: null
    },
    totalKeywordsFound: {
      type: Number,
      default: 0
    },
    averageSearchVolume: {
      type: Number,
      default: 0
    },
    keywordSource: {
      type: String,
      enum: ['dataforseo', 'fallback', 'none'],
      default: 'none'
    }
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
