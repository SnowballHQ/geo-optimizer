const OpenAI = require('openai');
const ContentCalendar = require('../models/ContentCalendar');
const CMSCredentials = require('../models/CMSCredentials');
const cmsIntegration = require('../utils/cmsIntegration');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class ContentCalendarController {
  async generateCalendar(req, res) {
    try {
      const { companyName, brandProfile, brandCategories } = req.body;
      const userId = req.user.id;

      if (!companyName) {
        return res.status(400).json({ error: 'Company name is required' });
      }

      // Generate 30-day content plan using OpenAI with enhanced brand context
      const contentPlan = await this.generateContentPlan(companyName, userId, req, brandProfile, brandCategories);
      
      // Format dates for the next 30 days
      const formattedPlan = await this.formatContentPlan(contentPlan, companyName, userId);

      res.json({
        success: true,
        data: formattedPlan,
        message: 'Content calendar generated successfully with brand context'
      });

    } catch (error) {
      console.error('Error generating content calendar:', error);
      res.status(500).json({ 
        error: 'Failed to generate content calendar',
        details: error.message 
      });
    }
  }

  async approveCalendar(req, res) {
    try {
      const { companyName, contentPlan } = req.body;
      const userId = req.user.id;

      if (!companyName || !contentPlan || !Array.isArray(contentPlan)) {
        return res.status(400).json({ error: 'Invalid request data' });
      }

      // Check if entries already exist for this user and company to prevent duplicates
      const existingEntries = await ContentCalendar.find({ userId, companyName });
      
      if (existingEntries.length > 0) {
        console.log(`⚠️ Calendar entries already exist for user ${userId} and company ${companyName}: ${existingEntries.length} entries`);
        
        // Return existing entries instead of creating duplicates
        return res.json({
          success: true,
          data: existingEntries,
          message: `Content calendar already exists with ${existingEntries.length} entries - loaded existing calendar`,
          isExisting: true
        });
      }

      // Save approved content plan to database
      const savedEntries = [];
      for (const item of contentPlan) {
        // Additional check per entry to prevent race conditions
        const duplicateCheck = await ContentCalendar.findOne({
          userId,
          companyName,
          date: new Date(item.date),
          title: item.title
        });

        if (duplicateCheck) {
          console.log(`⚠️ Duplicate entry found for ${item.title} on ${item.date}, skipping`);
          savedEntries.push(duplicateCheck);
          continue;
        }

        const calendarEntry = new ContentCalendar({
          userId,
          companyName,
          date: new Date(item.date),
          title: item.title,
          description: item.description,
          keywords: item.keywords,
          targetAudience: item.targetAudience,
          status: item.status || 'draft',
          cmsPlatform: item.cmsPlatform || 'wordpress'
        });

        const savedEntry = await calendarEntry.save();
        savedEntries.push(savedEntry);
      }

      res.json({
        success: true,
        data: savedEntries,
        message: 'Content calendar approved and scheduled successfully'
      });

    } catch (error) {
      console.error('Error approving content calendar:', error);
      res.status(500).json({ 
        error: 'Failed to approve content calendar',
        details: error.message 
      });
    }
  }

  async getCalendar(req, res) {
    try {
      const userId = req.user.id;
      const { companyName } = req.query;

      const query = { userId };
      if (companyName) {
        query.companyName = companyName;
      }

      const calendarEntries = await ContentCalendar.find(query)
        .sort({ date: 1 })
        .limit(100);

      res.json({
        success: true,
        data: calendarEntries
      });

    } catch (error) {
      console.error('Error fetching content calendar:', error);
      res.status(500).json({ 
        error: 'Failed to fetch content calendar',
        details: error.message 
      });
    }
  }

  async updateEntry(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user.id;

      const entry = await ContentCalendar.findOneAndUpdate(
        { _id: id, userId },
        updates,
        { new: true, runValidators: true }
      );

      if (!entry) {
        return res.status(404).json({ error: 'Calendar entry not found' });
      }

      res.json({
        success: true,
        data: entry,
        message: 'Entry updated successfully'
      });

    } catch (error) {
      console.error('Error updating calendar entry:', error);
      res.status(500).json({ 
        error: 'Failed to update entry',
        details: error.message 
      });
    }
  }

  async deleteEntry(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const entry = await ContentCalendar.findOneAndDelete({ _id: id, userId });

      if (!entry) {
        return res.status(404).json({ error: 'Calendar entry not found' });
      }

      res.json({
        success: true,
        message: 'Entry deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting calendar entry:', error);
      res.status(500).json({ 
        error: 'Failed to delete entry',
        details: error.message 
      });
    }
  }

  async generateContentPlan(companyName, userId, req, brandProfile = null, brandCategories = []) {
    const startTime = Date.now();
    
    // Build enhanced brand context
    let brandContext = '';
    if (brandProfile) {
      brandContext += `
Brand Information:
- Company: ${companyName}
- Domain: ${brandProfile.domain || 'Not specified'}
- Brand Description: ${brandProfile.brandInformation || 'Not specified'}
- Brand Tone: ${brandProfile.brandTonality || 'Professional and engaging'}

`;
    }

    if (brandCategories && brandCategories.length > 0) {
      brandContext += `Brand Categories:
`;
      brandCategories.forEach(category => {
        brandContext += `- ${category.categoryName}
`;
      });
      brandContext += `
`;
    }

    const prompt = `You are an expert content strategist creating a personalized 30-day content calendar.

${brandContext}Company: ${companyName}

Create a 30-day content calendar that:
1. Aligns with the brand's tone and messaging style
2. Incorporates relevant industry topics based on brand categories
3. Targets the appropriate audience for this brand
4. Uses SEO-friendly titles and keywords
5. Provides diverse content types and topics
6. Maintains consistency with the brand's voice

Return the response as a JSON array with 30 objects, each containing:
{
  "title": "SEO-optimized blog post title",
  "description": "Detailed description that matches brand tone",
  "keywords": "keyword1, keyword2, keyword3",
  "targetAudience": "Specific target audience description"
}

Focus on creating content that would be valuable for ${companyName}'s audience and reflects their brand identity.`;

    // Prepare request payload for logging
    const requestPayload = {
      companyName,
      brandProfile: brandProfile ? 'Included' : 'Not provided',
      brandCategories: brandCategories.length,
      prompt,
      model: "gpt-3.5-turbo",
      temperature: 0.4,
      maxTokens: 3000,
      timestamp: new Date()
    };

    try {
      console.log(`🤖 OPENAI API CALL - Content Calendar Generation for ${companyName}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Model: ${requestPayload.model}`);
      console.log(`   Temperature: ${requestPayload.temperature}`);
      console.log(`   Max Tokens: ${requestPayload.maxTokens}`);
      console.log(`   Prompt Length: ${prompt.length} characters`);

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a content marketing expert. Generate engaging, SEO-friendly blog content ideas."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });

      const responseTime = Date.now() - startTime;
      const response = completion.choices[0].message.content;
      const usage = completion.usage;

      // Log OpenAI response
      console.log(`✅ OpenAI API response received`);
      console.log(`   Response Time: ${responseTime}ms`);
      console.log(`   Input Tokens: ${usage.prompt_tokens}`);
      console.log(`   Output Tokens: ${usage.completion_tokens}`);
      console.log(`   Total Tokens: ${usage.total_tokens}`);
      console.log(`   Cost: $${((usage.prompt_tokens * 0.00003) + (usage.completion_tokens * 0.00006)).toFixed(6)}`);



      let parsedResult;
      try {
        // Extract JSON from the response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
          
          // Log successful parsing
          console.log(`✅ Content plan parsed successfully`);
          console.log(`   Generated ${parsedResult.length} content ideas`);
          
          return parsedResult;
        }
        throw new Error('No valid JSON found in response');
      } catch (parseError) {
        console.error('❌ Error parsing OpenAI response:', parseError);
        
        // Fallback: generate a basic plan
        console.log(`🔄 Using fallback content plan`);
        return this.generateFallbackPlan(companyName, brandProfile);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ OpenAI API call failed:`, error);
      
      // Fallback: generate a basic plan
      console.log(`🔄 Using fallback content plan due to API error`);
      return this.generateFallbackPlan(companyName, brandProfile);
    }
  }

  generateFallbackPlan(companyName, brandProfile = null) {
    // Enhance fallback titles based on brand context if available
    const baseFallbackTitles = [
      "10 Ways to Improve Your Business Strategy",
      "The Future of Digital Marketing",
      "Building Strong Customer Relationships",
      "Innovation in the Modern Workplace",
      "Sustainable Business Practices",
      "Effective Team Communication",
      "Data-Driven Decision Making",
      "Customer Experience Optimization",
      "Strategic Planning for Growth",
      "Technology Trends in Business",
      "Leadership Development Strategies",
      "Market Analysis and Insights",
      "Product Development Best Practices",
      "Financial Planning for Success",
      "Employee Engagement Techniques",
      "Brand Building Strategies",
      "Sales Optimization Methods",
      "Quality Assurance Processes",
      "Supply Chain Management",
      "Risk Management Strategies",
      "Performance Metrics and KPIs",
      "Change Management Approaches",
      "Customer Retention Strategies",
      "Competitive Analysis Methods",
      "Business Process Optimization",
      "Talent Acquisition Strategies",
      "Market Expansion Planning",
      "Product Launch Strategies",
      "Customer Feedback Analysis",
      "Business Model Innovation"
    ];

    // Customize description and keywords based on brand context
    const brandTone = brandProfile?.brandTonality || 'Professional and informative';
    const brandDescription = brandProfile?.brandInformation || 'business operations';
    
    return baseFallbackTitles.map((title, index) => ({
      title,
      description: `This comprehensive guide explores ${title.toLowerCase()} and provides actionable insights for ${companyName}. Written in a ${brandTone.toLowerCase()} style, this content focuses on ${brandDescription} and delivers valuable information to help your business achieve sustainable growth.`,
      keywords: brandProfile?.domain ? 
        `${brandProfile.domain.split('.')[0]}, business strategy, growth, optimization, best practices` : 
        "business strategy, growth, optimization, best practices",
      targetAudience: brandProfile?.brandInformation ? 
        `${companyName} customers and prospects interested in ${brandDescription}` :
        "Business owners, managers, and professionals seeking to improve their business performance"
    }));
  }

  async formatContentPlan(contentPlan, companyName, userId) {
    const today = new Date();
    const formattedPlan = [];

    // Get user's CMS platform preference from credentials
    let userCmsPlatform = 'shopify'; // Default to Shopify
    try {
      const userCredentials = await CMSCredentials.findOne({ 
        userId, 
        isActive: true 
      });
      if (userCredentials) {
        userCmsPlatform = userCredentials.platform;
      }
    } catch (error) {
      console.log('Could not determine user CMS platform, defaulting to Shopify');
    }

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const content = contentPlan[i] || contentPlan[contentPlan.length - 1];
      
      formattedPlan.push({
        date: date.toISOString().split('T')[0],
        title: content.title,
        description: content.description,
        keywords: content.keywords,
        targetAudience: content.targetAudience,
        status: 'draft',
        cmsPlatform: userCmsPlatform
      });
    }

    return formattedPlan;
  }

  // Get specific calendar entry
  async getEntry(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const entry = await ContentCalendar.findOne({ _id: id, userId });
      
      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.json({
        success: true,
        data: entry
      });
    } catch (error) {
      console.error('Error getting entry:', error);
      res.status(500).json({ error: 'Failed to get entry' });
    }
  }

  // Create new calendar entry
  async createEntry(req, res) {
    try {
      const userId = req.user.id;
      const entryData = req.body;

      const newEntry = new ContentCalendar({
        ...entryData,
        userId,
        date: entryData.date ? new Date(entryData.date) : new Date(),
        status: entryData.status || 'draft'
      });

      const savedEntry = await newEntry.save();

      res.json({
        success: true,
        data: savedEntry,
        message: 'Entry created successfully'
      });
    } catch (error) {
      console.error('Error creating entry:', error);
      res.status(500).json({ error: 'Failed to create entry' });
    }
  }

  // Generate content outline using OpenAI
  async generateOutline(req, res) {
    try {
      const { id } = req.params;
      const { title, description, keywords, targetAudience } = req.body;
      const userId = req.user.id;

      console.log('generateOutline called with:', { id, title, description, keywords, targetAudience, userId });

      if (!title) {
        return res.status(400).json({ error: 'Title is required to generate outline' });
      }

      // Fetch user's brand settings to include brand tonality and information
      let brandContext = '';
      let brandSettings = null; // Declare outside the if block
      let userDomain = ''; // Add domain variable
      
      try {
        const UserBrandSettings = require('../models/UserBrandSettings');
        const BrandProfile = require('../models/BrandProfile'); // Add BrandProfile import
        
        brandSettings = await UserBrandSettings.findOne({ userId });
        
        // Fetch user's domain from brand profile
        try {
          const brandProfile = await BrandProfile.findOne({ ownerUserId: userId })
            .sort({ updatedAt: -1 });
          userDomain = brandProfile?.domain || 'your-website.com';
        } catch (domainError) {
          console.log('Could not fetch domain:', domainError.message);
          userDomain = 'your-website.com';
        }
        
        if (brandSettings) {
          brandContext = `
Brand Context:
- Brand Tonality: ${brandSettings.brandTonality || 'Professional and informative'}
- Brand Information: ${brandSettings.brandInformation || 'No specific brand information provided'}

`;
          console.log('Brand settings found:', {
            tonality: brandSettings.brandTonality,
            info: brandSettings.brandInformation
          });
        } else {
          console.log('No brand settings found for user:', userId);
          brandContext = `
Brand Context:
- Brand Tonality: Professional and engaging (default)
- Brand Information: No specific brand information provided

`;
        }
      } catch (brandError) {
        console.log('Error fetching brand settings:', brandError.message);
        // Continue without brand settings if there's an error
        brandContext = `
Brand Context:
- Brand Tonality: Professional and engaging (default)
- Brand Information: No specific brand information provided

`;
        userDomain = 'your-website.com';
      }

      // Create OpenAI prompt for outline generation with brand context
      // Create OpenAI prompt for outline generation with GEO + brand context
const prompt = `
You are a content strategist and SEO expert trained in Generative Engine Optimization (GEO).

I want you to create a skyscraper content outline for the blog topic: "${title}".
The content will be published on: ${userDomain}

Add links to authoritative sources wherever relevant. Cite recent, credible statistics with active URLs.

What the brand does: ${brandSettings?.brandInformation || '[No specific brand information provided]'}

Blog tone/style to match: ${brandSettings?.brandTonality || 'Professional and engaging (default)'}

Your task is to generate a GEO-optimized skyscraper content outline, engineered to achieve a high GEO score based on the 15-point framework below. Every header (H1, H2, H3) must be phrased as a question to maximize AI query match potential, with structure, depth, and formatting optimized to perform well for both AI search and human readers.

Ensure that:
- The outline reflects topical authority and depth
- Uses structured sections and clear headers for better AI parsing
- Anticipates zero-click answers and featured snippet formats
- Includes factual, high-authority references only (double-check links are active)
- Inserts contextually relevant CTAs linking to ${userDomain}
- Considers interlinking opportunities, metadata hints, and AI-prominent phrasing
- Optionally includes suggested intro format, multimodal elements (charts, visuals), and semantic clusters for related topics

Final output format:
H1 + section breakdowns (with H2/H3s as needed)
CTA and internal link placement notes
Credible source references (active URLs only)

✅ GEO 15-point framework for guidance:
1. Topical Authority & Depth
2. Structured Format for AI
3. Explicit, Fact-Based Answers
4. Zero-Click Optimization
5. Entity & Semantic Optimization
6. Format Diversity (lists, tables, Q&A)
7. Metadata & Titles
8. Search Intent Match
9. Authoritativeness
10. Originality & AI-Evasiveness
11. Multimodal Enhancements
12. Internal Linking
13. Machine Readability
14. AI-Query Phrasing
15. GEO Performance Strategy
`;

      // Validate prompt before sending to OpenAI
      if (!prompt || prompt.length < 100) {
        throw new Error('Generated prompt is invalid or too short');
      }

      console.log('OpenAI prompt with brand context:', prompt);
      console.log('Using domain for content generation:', userDomain);

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a professional content strategist and copywriter specializing in brand-aligned content. Create detailed, actionable content outlines that help writers structure their blog posts effectively while maintaining consistency with the brand's voice, tone, and messaging style.

When provided with brand context, ensure that:
- The outline reflects the brand's established tonality
- Content structure aligns with brand values and messaging
- The overall approach matches the brand's communication style
- Brand information is naturally integrated where relevant`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const outline = completion.choices[0].message.content;
      console.log('Generated outline with brand context:', outline);

      // Update the entry with the generated outline
      const updatedEntry = await ContentCalendar.findByIdAndUpdate(
        id, 
        { outline },
        { new: true, runValidators: true }
      );

      console.log('Updated entry:', updatedEntry);

      res.json({
        success: true,
        data: { outline },
        message: 'Content outline generated successfully with brand context',
        brandContext: brandContext ? 'Applied' : 'Not available'
      });

    } catch (error) {
      console.error('Error generating outline:', error);
      res.status(500).json({ 
        error: 'Failed to generate outline',
        details: error.message 
      });
    }
  }

  // Create blog content from outline using OpenAI
  async createBlogFromOutline(req, res) {
    try {
      const { id } = req.params;
      const { title, description, keywords, targetAudience, outline } = req.body;
      const userId = req.user.id;

      console.log('createBlogFromOutline called with:', { id, title, description, keywords, targetAudience, userId });

      if (!outline) {
        return res.status(400).json({ error: 'Outline is required to create blog content' });
      }

      if (!title) {
        return res.status(400).json({ error: 'Title is required to create blog content' });
      }

      // Fetch user's brand settings to include brand tonality and information
      let brandContext = '';
      let brandSettings = null; // Declare outside the if block
      let userDomain = ''; // Add domain variable
      
      try {
        const UserBrandSettings = require('../models/UserBrandSettings');
        const BrandProfile = require('../models/BrandProfile'); // Add BrandProfile import
        
        brandSettings = await UserBrandSettings.findOne({ userId });
        
        // Fetch user's domain from brand profile
        try {
          const brandProfile = await BrandProfile.findOne({ ownerUserId: userId })
            .sort({ updatedAt: -1 });
          userDomain = brandProfile?.domain || 'your-website.com';
        } catch (domainError) {
          console.log('Could not fetch domain:', domainError.message);
          userDomain = 'your-website.com';
        }
        
        if (brandSettings) {
          brandContext = `
Brand Context:
- Brand Tonality: ${brandSettings.brandTonality || 'Professional and informative'}
- Brand Information: ${brandSettings.brandInformation || 'No specific brand information provided'}
- Website: ${userDomain}

`;
          console.log('Brand settings found for blog creation:', {
            tonality: brandSettings.brandTonality,
            info: brandSettings.brandInformation,
            domain: userDomain
          });
        } else {
          console.log('No brand settings found for user during blog creation:', userId);
          brandContext = `
Brand Context:
- Brand Tonality: Professional and engaging (default)
- Brand Information: No specific brand information provided
- Website: ${userDomain}

`;
        }
      } catch (brandError) {
        console.log('Error fetching brand settings for blog creation:', brandError.message);
        // Continue without brand settings if there's an error
        brandContext = `
Brand Context:
- Brand Tonality: Professional and engaging (default)
- Brand Information: No specific brand information provided
- Website: ${userDomain}

`;
      }

      // Create OpenAI prompt for blog creation with brand context
      const prompt = `Create a comprehensive, engaging blog post based on this outline:

Title: ${title}
Description: ${description || 'Not specified'}
Keywords: ${keywords || 'Not specified'}
Target Audience: ${targetAudience || 'General audience'}

${brandContext}Outline:
${outline}

Requirements:
- Write in a tone that matches the brand's established voice and style
- Incorporate brand information naturally where relevant and appropriate
- Include proper headings (H1, H2, H3) based on the outline
- Use the keywords naturally throughout the content
- Target the specified audience
- Include practical examples and actionable insights
- Write 800-1200 words
- Format in HTML with proper tags
- Make it SEO-friendly and engaging
- Ensure the content flows logically from the outline structure
- Maintain consistency with the brand's messaging and values

Important: The writing style, tone, and approach should align with the brand's established voice and communication style.

Please provide the complete blog post in HTML format.`;

      console.log('OpenAI prompt for blog creation with brand context:', prompt);

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert content writer specializing in creating engaging, SEO-optimized blog posts that align with specific brand voices and messaging styles.

When provided with brand context, ensure that:
- The writing tone matches the brand's established voice
- Brand information is naturally integrated where relevant
- The overall style reflects the brand's communication approach
- Content maintains consistency with brand values and messaging
- The voice remains authentic to the brand's identity

Always respond with properly formatted HTML content that follows the provided outline structure.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const blogContent = completion.choices[0].message.content;
      console.log('Generated blog content with brand context, length:', blogContent.length);

      // Update the entry with the generated blog content
      const updatedEntry = await ContentCalendar.findByIdAndUpdate(
        id, 
        { content: blogContent },
        { new: true, runValidators: true }
      );

      console.log('Updated entry with blog content:', updatedEntry._id);

      res.json({
        success: true,
        data: { blogContent },
        message: 'Blog created successfully from outline with brand context',
        brandContext: brandContext ? 'Applied' : 'Not available'
      });

    } catch (error) {
      console.error('Error creating blog from outline:', error);
      res.status(500).json({ 
        error: 'Failed to create blog from outline',
        details: error.message 
      });
    }
  }
}

const controller = new ContentCalendarController();

// Bind all methods to preserve 'this' context
module.exports = {
  generateCalendar: controller.generateCalendar.bind(controller),
  approveCalendar: controller.approveCalendar.bind(controller),
  getCalendar: controller.getCalendar.bind(controller),
  updateEntry: controller.updateEntry.bind(controller),
  deleteEntry: controller.deleteEntry.bind(controller),
  getEntry: controller.getEntry.bind(controller),
  createEntry: controller.createEntry.bind(controller),
  generateOutline: controller.generateOutline.bind(controller),
  createBlogFromOutline: controller.createBlogFromOutline.bind(controller)
};
