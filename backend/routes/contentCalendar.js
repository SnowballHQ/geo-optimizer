const express = require('express');
const router = express.Router();
const { authenticationMiddleware: auth } = require('../middleware/auth');
const contentCalendarController = require('../controllers/contentCalendar');
const autoPublisher = require('../utils/autoPublisher');
const ContentCalendar = require('../models/ContentCalendar');
const CMSCredentials = require('../models/CMSCredentials'); // Added missing import
const cmsIntegration = require('../utils/cmsIntegration'); // Added missing import

// Apply auth middleware to all routes
router.use(auth);

// Generate 30-day content calendar
router.post('/generate', contentCalendarController.generateCalendar);

// Approve and schedule content calendar
router.post('/approve', contentCalendarController.approveCalendar);

// Get user's content calendar
router.get('/', contentCalendarController.getCalendar);

// Update specific calendar entry
router.put('/:id', contentCalendarController.updateEntry);

// Delete specific calendar entry
router.delete('/:id', contentCalendarController.deleteEntry);

// Get published blogs with analytics data
router.get('/published-blogs', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all published content with URLs
    const publishedBlogs = await ContentCalendar.find({
      userId,
      status: 'published',
      publishedUrl: { $ne: null }
    }).sort({ publishedAt: -1 });

    console.log(`Found ${publishedBlogs.length} published blogs for user ${userId}`);

    // For now, return basic published blogs data
    // Analytics integration will be added in the next step
    const blogsWithBasicData = publishedBlogs.map(blog => ({
      id: blog._id,
      title: blog.title,
      publishedUrl: blog.publishedUrl,
      publishedAt: blog.publishedAt,
      cmsPlatform: blog.cmsPlatform,
      keywords: blog.keywords,
      targetAudience: blog.targetAudience,
      // Analytics data will be populated later
      analytics: {
        position: null,
        clicks: 0,
        impressions: 0,
        ctr: 0
      }
    }));

    res.json({
      success: true,
      data: blogsWithBasicData
    });
  } catch (error) {
    console.error('Error getting published blogs:', error);
    res.status(500).json({ error: 'Failed to get published blogs' });
  }
});

// Get specific calendar entry (for editor)
router.get('/:id', contentCalendarController.getEntry);

// Create new calendar entry
router.post('/entry', contentCalendarController.createEntry);

// Generate content outline using OpenAI
router.post('/:id/generate-outline', contentCalendarController.generateOutline);
router.post('/:id/create-blog', contentCalendarController.createBlogFromOutline);

// Debug route to check CMS credentials (remove in production)
router.get('/debug/cms-credentials', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Debug CMS credentials for user:', userId);
    
    const allCredentials = await CMSCredentials.find({ userId });
    const activeCredentials = await CMSCredentials.findOne({ userId, isActive: true });
    
    console.log('All credentials found:', allCredentials.length);
    console.log('Active credentials found:', !!activeCredentials);
    
    res.json({
      userId,
      allCredentials: allCredentials.map(c => ({
        id: c._id,
        platform: c.platform,
        isActive: c.isActive,
        createdAt: c.createdAt
      })),
      activeCredentials: activeCredentials ? {
        id: activeCredentials._id,
        platform: activeCredentials.platform,
        isActive: activeCredentials.isActive
      } : null
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug route to check content entries (remove in production)
router.get('/debug/content-entries', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Debug content entries for user:', userId);
    
    const allEntries = await ContentCalendar.find({ userId });
    const publishedEntries = await ContentCalendar.find({ userId, status: 'published' });
    const draftEntries = await ContentCalendar.find({ userId, status: 'draft' });
    
    console.log('All entries found:', allEntries.length);
    console.log('Published entries:', publishedEntries.length);
    console.log('Draft entries:', draftEntries.length);
    
    res.json({
      userId,
      totalEntries: allEntries.length,
      publishedEntries: publishedEntries.length,
      draftEntries: draftEntries.length,
      sampleEntries: allEntries.slice(0, 3).map(e => ({
        id: e._id,
        title: e.title,
        status: e.status,
        userId: e.userId,
        companyName: e.companyName
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Publish specific content to Shopify
router.post('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('Publish request:', { id, userId, user: req.user });

    // Get the content entry
    const contentEntry = await ContentCalendar.findById(id);
    if (!contentEntry) {
      console.log('Content not found for ID:', id);
      return res.status(404).json({ error: 'Content not found' });
    }

    console.log('Content entry found:', {
      contentId: contentEntry._id,
      contentUserId: contentEntry.userId,
      contentTitle: contentEntry.title,
      contentStatus: contentEntry.status
    });

    // Check if user owns this content
    if (contentEntry.userId.toString() !== userId) {
      console.log('Access denied - user mismatch:', {
        contentUserId: contentEntry.userId.toString(),
        requestUserId: userId
      });
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user's CMS credentials - try to find any active credentials
    const cmsCredentials = await CMSCredentials.findOne({ 
      userId, 
      isActive: true 
    });
    
    console.log('CMS credentials lookup result:', {
      userId,
      cmsCredentialsFound: !!cmsCredentials,
      platform: cmsCredentials?.platform,
      isActive: cmsCredentials?.isActive
    });
    
    if (!cmsCredentials) {
      // Let's also check if there are any credentials at all for this user
      const anyCredentials = await CMSCredentials.findOne({ userId });
      if (anyCredentials) {
        console.log('User has credentials but they are not active:', {
          platform: anyCredentials.platform,
          isActive: anyCredentials.isActive
        });
        return res.status(400).json({ 
          error: `CMS credentials found for ${anyCredentials.platform} but they are not active. Please activate your CMS credentials first.` 
        });
      } else {
        console.log('No CMS credentials found at all for user:', userId);
        return res.status(400).json({ 
          error: 'No CMS credentials found. Please set up your CMS credentials first in the Content Calendar settings.' 
        });
      }
    }

    // Prepare content for publishing
    const contentToPublish = {
      title: contentEntry.title,
      description: contentEntry.content || contentEntry.description, // Prioritize full content over description
      keywords: contentEntry.keywords,
      targetAudience: contentEntry.targetAudience,
      cmsPlatform: cmsCredentials.platform
    };

    console.log('Publishing content:', {
      title: contentToPublish.title,
      platform: cmsCredentials.platform,
      userId: userId,
      descriptionLength: contentToPublish.description?.length || 0,
      hasFullContent: !!contentEntry.content,
      hasDescription: !!contentEntry.description,
      usingFullContent: !!(contentEntry.content && contentEntry.content.length > contentEntry.description?.length)
    });

    // Publish to CMS using cmsIntegration
    console.log('📤 About to call cmsIntegration.publishContent');
    const publishResult = await cmsIntegration.publishContent(
      cmsCredentials.platform,
      cmsCredentials,
      contentToPublish
    );
    console.log('📥 Received publishResult from CMS integration');

    console.log('Publish result:', publishResult);
    console.log('Published URL from result:', publishResult.url);

    if (publishResult.success) {
      // Update the entry with published status and URL
      const updateData = {
        status: 'published',
        publishedAt: new Date(),
        lastPublished: new Date(),
        publishedUrl: publishResult.url, // Store the published URL
        cmsPlatform: cmsCredentials.platform
      };
      
      console.log('Updating content with data:', updateData);
      
      const updatedEntry = await ContentCalendar.findByIdAndUpdate(id, updateData, { new: true });
      console.log('Updated entry result:', {
        id: updatedEntry._id,
        status: updatedEntry.status,
        publishedUrl: updatedEntry.publishedUrl,
        cmsPlatform: updatedEntry.cmsPlatform
      });

      res.json({
        success: true,
        message: `Content published successfully to ${cmsCredentials.platform}`,
        data: publishResult
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to publish to ${cmsCredentials.platform}`,
        error: publishResult.error
      });
    }

  } catch (error) {
    console.error('Error publishing content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish content',
      error: error.message
    });
  }
});

// Manual trigger for auto-publishing (for testing)
router.post('/publish/trigger', async (req, res) => {
  try {
    await autoPublisher.triggerPublishing();
    res.json({ success: true, message: 'Auto-publishing triggered successfully' });
  } catch (error) {
    console.error('Error triggering auto-publishing:', error);
    res.status(500).json({ error: 'Failed to trigger auto-publishing' });
  }
});

// Trigger immediate publishing of specific content
router.post('/trigger-publish', async (req, res) => {
  try {
    const { contentId, companyName } = req.body;
    
    if (!contentId || !companyName) {
      return res.status(400).json({ error: 'Content ID and company name are required' });
    }

    // Trigger immediate publishing for this specific content
    const result = await autoPublisher.publishSpecificContent(contentId, companyName);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Content published successfully',
        data: result
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Error triggering immediate publishing:', error);
    res.status(500).json({ error: 'Failed to trigger immediate publishing' });
  }
});

// Get publishing statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await autoPublisher.getPublishingStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting publishing stats:', error);
    res.status(500).json({ error: 'Failed to get publishing stats' });
  }
});

// Retry failed publishing
router.post('/publish/retry', async (req, res) => {
  try {
    await autoPublisher.retryFailedPublishing();
    res.json({ success: true, message: 'Retry of failed publishing initiated' });
  } catch (error) {
    console.error('Error retrying failed publishing:', error);
    res.status(500).json({ error: 'Failed to retry failed publishing' });
  }
});

// Fix all content to use Shopify platform
router.post('/fix-platform', async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyName } = req.body;
    
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Update all content for this company to use Shopify
    const result = await ContentCalendar.updateMany(
      { userId, companyName },
      { cmsPlatform: 'shopify' }
    );

    console.log(`Updated ${result.modifiedCount} content items to use Shopify platform`);

    res.json({ 
      success: true, 
      message: `Updated ${result.modifiedCount} content items to use Shopify platform`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error fixing platform:', error);
    res.status(500).json({ error: 'Failed to fix platform' });
  }
});

module.exports = router;
