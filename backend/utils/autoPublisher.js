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
    console.log(`Publishing content: ${content.title} for user`, content.userId);

    // First, try to get CMS credentials for the specified platform
    let credentials = await CMSCredentials.findOne({
      userId: content.userId,
      platform: content.cmsPlatform,
      isActive: true
    });

    let targetPlatform = content.cmsPlatform;

    // If no credentials found for specified platform, find ANY active CMS credentials for this user
    if (!credentials) {
      console.log(`No credentials found for ${content.cmsPlatform}, checking for any active CMS credentials...`);
      
      credentials = await CMSCredentials.findOne({
        userId: content.userId,
        isActive: true
      });

      if (credentials) {
        targetPlatform = credentials.platform;
        console.log(`Found active credentials for ${targetPlatform}, using that instead of ${content.cmsPlatform}`);
      }
    }

    if (!credentials) {
      throw new Error(`No active CMS credentials found. Please connect a CMS platform (Shopify or Webflow) first.`);
    }

    // Prepare content data for publishing
    const publishData = {
      title: content.title,
      description: content.content || content.description, // Prioritize full content over description
      keywords: content.keywords,
      targetAudience: content.targetAudience
    };

    // For Webflow, we need to get a siteId - for now, we'll try to get it from user's first site
    if (targetPlatform === 'webflow') {
      try {
        // Get user's Webflow sites to use the first one as default
        const axios = require('axios');
        const sitesResponse = await axios.get('https://api.webflow.com/v2/sites', {
          headers: {
            'Authorization': `Bearer ${credentials.authDetails.accessToken}`,
            'Accept': 'application/json'
          }
        });

        const sites = sitesResponse.data.sites || [];
        if (sites.length > 0) {
          publishData.siteId = sites[0].id;
          console.log(`Using first Webflow site: ${sites[0].displayName} (${sites[0].id})`);
        } else {
          throw new Error('No Webflow sites found. Please create a site in Webflow first.');
        }
      } catch (siteError) {
        console.error('Error fetching Webflow sites:', siteError);
        throw new Error('Unable to fetch Webflow sites. Please check your Webflow connection.');
      }
    }

    // Publish to CMS using the detected target platform
    const result = await cmsIntegration.publishContent(
      targetPlatform,
      credentials,
      publishData
    );

    if (!result.success) {
      throw new Error(`CMS publishing failed: ${result.error}`);
    }

    // Update content status to published and update platform
    await ContentCalendar.findByIdAndUpdate(content._id, {
      status: 'published',
      publishedAt: new Date(),
      cmsPostId: result.postId,
      cmsUrl: result.url,
      cmsPlatform: targetPlatform // Update to the actual platform used
    });

    console.log(`Successfully published: ${content.title} to ${targetPlatform}`);
    
    // Return result with platform information
    return {
      ...result,
      platform: targetPlatform
    };
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

      // Allow publishing of draft or approved content, but not already published
      if (content.status === 'published') {
        console.log(`Content "${content.title}" is already published, skipping...`);
        return {
          success: true,
          message: `Content "${content.title}" was already published`,
          data: { alreadyPublished: true }
        };
      }
      
      // Content can be draft or approved to publish
      if (!['draft', 'approved'].includes(content.status)) {
        throw new Error(`Content status is ${content.status}, must be draft or approved to publish`);
      }

      const result = await this.publishContent(content);
      
      // Get the platform that was actually used
      const actualPlatform = result.platform || content.cmsPlatform;
      
      return {
        success: true,
        message: `Content "${content.title}" published successfully to ${actualPlatform}`,
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
