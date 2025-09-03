const cron = require('node-cron');
const ContentCalendar = require('../models/ContentCalendar');
const CMSCredentials = require('../models/CMSCredentials');
const cmsIntegration = require('./cmsIntegration');

class AutoPublisher {
  constructor() {
    this.isRunning = false;
    this.init();
  }

  init() {
    // Schedule daily check at 9 AM
    cron.schedule('0 9 * * *', () => {
      this.checkAndPublishScheduledContent();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    console.log('Auto-publisher initialized - checking daily at 9 AM UTC');
  }

  async checkAndPublishScheduledContent() {
    if (this.isRunning) {
      console.log('Auto-publisher already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting auto-publishing check...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all approved content scheduled for today
      const scheduledContent = await ContentCalendar.find({
        status: 'approved',
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }).populate('userId');

      console.log(`Found ${scheduledContent.length} pieces of content to publish today`);

      for (const content of scheduledContent) {
        try {
          await this.publishContent(content);
        } catch (error) {
          console.error(`Failed to publish content ${content._id}:`, error);
          
          // Update status to failed
          await ContentCalendar.findByIdAndUpdate(content._id, {
            status: 'failed',
            publishedAt: new Date(),
            error: error.message
          });
        }
      }

      console.log('Auto-publishing check completed');
    } catch (error) {
      console.error('Error in auto-publishing check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async publishContent(content) {
    console.log(`Publishing content: ${content.title} for user ${content.userId}`);

    // Get CMS credentials for the user and platform
    const credentials = await CMSCredentials.findOne({
      userId: content.userId,
      platform: content.cmsPlatform,
      isActive: true
    });

    if (!credentials) {
      throw new Error(`No active CMS credentials found for platform: ${content.cmsPlatform}`);
    }

    // Publish to CMS
    const result = await cmsIntegration.publishContent(
      content.cmsPlatform,
      credentials,
      {
        title: content.title,
        description: content.content || content.description, // Prioritize full content over description
        keywords: content.keywords,
        targetAudience: content.targetAudience
      }
    );

    if (!result.success) {
      throw new Error(`CMS publishing failed: ${result.error}`);
    }

    // Update content status to published
    await ContentCalendar.findByIdAndUpdate(content._id, {
      status: 'published',
      publishedAt: new Date(),
      cmsPostId: result.postId,
      cmsUrl: result.url
    });

    console.log(`Successfully published: ${content.title} to ${content.cmsPlatform}`);
    return result;
  }

  async publishSpecificContent(contentId, companyName) {
    try {
      // Find content by ID and company name
      const content = await ContentCalendar.findOne({
        _id: contentId,
        companyName: companyName
      }).populate('userId');
      
      if (!content) {
        throw new Error('Content not found for this company');
      }

      if (content.status !== 'approved') {
        throw new Error(`Content status is ${content.status}, must be approved to publish`);
      }

      const result = await this.publishContent(content);
      
      return {
        success: true,
        message: `Content "${content.title}" published successfully to ${content.cmsPlatform}`,
        data: result
      };
    } catch (error) {
      console.error(`Error publishing specific content ${contentId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async retryFailedPublishing() {
    try {
      const failedContent = await ContentCalendar.find({
        status: 'failed'
      }).populate('userId');

      console.log(`Found ${failedContent.length} failed content pieces to retry`);

      for (const content of failedContent) {
        try {
          await this.publishContent(content);
        } catch (error) {
          console.error(`Retry failed for content ${content._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error retrying failed publishing:', error);
    }
  }

  // Manual trigger for testing
  async triggerPublishing() {
    console.log('Manually triggering auto-publishing...');
    await this.checkAndPublishScheduledContent();
  }

  // Get publishing statistics
  async getPublishingStats() {
    try {
      const stats = await ContentCalendar.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const total = await ContentCalendar.countDocuments();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const publishedToday = await ContentCalendar.countDocuments({
        status: 'published',
        publishedAt: { $gte: today }
      });

      return {
        total,
        publishedToday,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting publishing stats:', error);
      throw error;
    }
  }
}

module.exports = new AutoPublisher();
