require('dotenv').config();
const contentfulManagement = require('contentful-management');

const client = contentfulManagement.createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN
});

const aiToolsData = [
  {
    internalName: 'ChatGPT',
    toolName: 'ChatGPT',
    slug: 'chatgpt',
    tagline: 'Advanced AI chatbot for conversations, content creation, and problem-solving',
    category: ['Content Writing', 'Code'],
    description: 'ChatGPT is an advanced language model developed by OpenAI that can understand and generate human-like text. It excels at creative writing, coding assistance, answering questions, and engaging in natural conversations across a wide range of topics.',
    keyFeatures: [
      'Natural and contextual conversations',
      'Code generation and debugging',
      'Content writing and editing',
      'Multiple language support',
      'Real-time responses',
      'Custom instructions'
    ],
    pros: [
      'Highly accurate and coherent responses',
      'Wide range of capabilities',
      'User-friendly interface',
      'Regular model updates'
    ],
    cons: [
      'Can occasionally provide incorrect information',
      'Limited to training data cutoff',
      'May refuse certain requests',
      'Internet access only in Plus version'
    ],
    useCases: [
      'Writing blog posts and articles',
      'Code debugging and development',
      'Learning and research assistance',
      'Brainstorming and ideation'
    ],
    pricingType: 'Freemium',
    pricingDetails: 'Free tier available with GPT-3.5. ChatGPT Plus ($20/month) includes GPT-4, faster responses, and priority access.',
    monthlyPrice: 20,
    websiteUrl: 'https://chat.openai.com',
    platforms: ['Web', 'iOS', 'Android'],
    rating: 4.8,
    reviewCount: 15420,
    verified: true,
    featured: true,
    aiModelsUsed: ['GPT-4', 'GPT-3.5']
  },
  {
    internalName: 'Midjourney',
    toolName: 'Midjourney',
    slug: 'midjourney',
    tagline: 'AI-powered art generator creating stunning images from text descriptions',
    category: ['Image Generation'],
    description: 'Midjourney is a powerful AI art generator that creates unique, high-quality images from text prompts. It\'s particularly known for producing artistic, stylized images that range from photorealistic to abstract, making it popular among designers, artists, and content creators.',
    keyFeatures: [
      'High-quality image generation',
      'Multiple artistic styles',
      'Upscaling and variations',
      'Community gallery',
      'Discord-based interface',
      'Fast generation times'
    ],
    pros: [
      'Exceptional image quality',
      'Highly artistic outputs',
      'Active community',
      'Regular model improvements'
    ],
    cons: [
      'Discord-only interface',
      'No free tier available',
      'Limited control over details',
      'Usage credits system'
    ],
    useCases: [
      'Creating concept art and illustrations',
      'Generating social media visuals',
      'Design inspiration and mockups',
      'Book covers and marketing materials'
    ],
    pricingType: 'Paid',
    pricingDetails: 'Basic Plan: $10/month (200 images), Standard: $30/month (unlimited in relaxed mode), Pro: $60/month (unlimited + stealth mode)',
    monthlyPrice: 10,
    websiteUrl: 'https://www.midjourney.com',
    platforms: ['Web', 'Discord'],
    rating: 4.7,
    reviewCount: 8930,
    verified: true,
    featured: true,
    aiModelsUsed: ['Midjourney v6', 'Custom Model']
  },
  {
    internalName: 'Jasper AI',
    toolName: 'Jasper AI',
    slug: 'jasper-ai',
    tagline: 'AI copilot for marketing teams to create on-brand content faster',
    category: ['Content Writing', 'Marketing'],
    description: 'Jasper AI is an enterprise-grade AI content platform designed for marketing teams. It helps create blog posts, social media content, ad copy, and more while maintaining brand voice and style consistency across all content.',
    keyFeatures: [
      'Brand voice customization',
      '50+ content templates',
      'SEO mode integration',
      'Team collaboration tools',
      'Multi-language support',
      'Chrome extension'
    ],
    pros: [
      'Excellent for long-form content',
      'Strong brand voice consistency',
      'Great template variety',
      'SEO optimization features'
    ],
    cons: [
      'Higher price point',
      'Learning curve for advanced features',
      'Credit-based pricing',
      'Occasional repetitive content'
    ],
    useCases: [
      'Blog post and article writing',
      'Marketing copy and ad campaigns',
      'Social media content creation',
      'Email marketing sequences'
    ],
    pricingType: 'Paid',
    pricingDetails: 'Creator: $49/month (50,000 words), Teams: $125/month (3 users, 150,000 words), Business: Custom pricing',
    monthlyPrice: 49,
    websiteUrl: 'https://www.jasper.ai',
    platforms: ['Web', 'Chrome Extension'],
    rating: 4.5,
    reviewCount: 5240,
    verified: true,
    featured: false,
    aiModelsUsed: ['GPT-4', 'Claude']
  },
  {
    internalName: 'Copy.ai',
    toolName: 'Copy.ai',
    slug: 'copy-ai',
    tagline: 'AI-powered copywriting tool for marketing and sales content',
    category: ['Content Writing', 'Marketing'],
    description: 'Copy.ai is an AI writing assistant focused on creating marketing copy, sales content, and social media posts. It offers a wide range of templates and tools designed to help marketers and entrepreneurs create compelling content quickly.',
    keyFeatures: [
      '90+ copywriting templates',
      'Multi-language support (25+ languages)',
      'Blog wizard for long-form content',
      'Tone and style controls',
      'Team collaboration',
      'API access'
    ],
    pros: [
      'Generous free plan',
      'Easy to use interface',
      'Great for short-form content',
      'Affordable pricing'
    ],
    cons: [
      'Less suitable for technical content',
      'Limited customization options',
      'Quality can vary',
      'Fewer advanced features than competitors'
    ],
    useCases: [
      'Social media posts and captions',
      'Email subject lines and copy',
      'Product descriptions',
      'Ad copy and landing pages'
    ],
    pricingType: 'Freemium',
    pricingDetails: 'Free: 2,000 words/month, Pro: $49/month (unlimited words), Team: $249/month (5 users)',
    monthlyPrice: 49,
    websiteUrl: 'https://www.copy.ai',
    platforms: ['Web', 'Chrome Extension'],
    rating: 4.4,
    reviewCount: 3820,
    verified: true,
    featured: false,
    aiModelsUsed: ['GPT-4', 'GPT-3.5']
  },
  {
    internalName: 'Surfer SEO',
    toolName: 'Surfer SEO',
    slug: 'surfer-seo',
    tagline: 'Content optimization tool for better search rankings',
    category: ['SEO'],
    description: 'Surfer SEO is a comprehensive SEO tool that analyzes top-ranking pages and provides data-driven recommendations to optimize your content for search engines. It helps writers and marketers create SEO-friendly content that ranks higher in search results.',
    keyFeatures: [
      'Content editor with real-time optimization',
      'SERP analyzer',
      'Keyword research tool',
      'Content audit',
      'AI outline generator',
      'Integration with Google Docs'
    ],
    pros: [
      'Excellent data-driven insights',
      'User-friendly interface',
      'Comprehensive SEO metrics',
      'Regular updates and improvements'
    ],
    cons: [
      'Can be expensive for individuals',
      'Steep learning curve initially',
      'Limited to Google search data',
      'Credit-based pricing'
    ],
    useCases: [
      'Optimizing blog posts for SEO',
      'Competitor content analysis',
      'Keyword research and planning',
      'Content audits and improvements'
    ],
    pricingType: 'Paid',
    pricingDetails: 'Essential: $89/month, Advanced: $179/month, Max: $299/month, Enterprise: Custom pricing',
    monthlyPrice: 89,
    websiteUrl: 'https://surferseo.com',
    platforms: ['Web', 'Chrome Extension'],
    rating: 4.6,
    reviewCount: 2150,
    verified: true,
    featured: true,
    aiModelsUsed: ['Custom Model', 'GPT-4']
  },
  {
    internalName: 'Grammarly',
    toolName: 'Grammarly',
    slug: 'grammarly',
    tagline: 'AI-powered writing assistant for grammar, spelling, and style',
    category: ['Content Writing'],
    description: 'Grammarly is a comprehensive writing assistant that helps improve your writing by checking grammar, spelling, punctuation, clarity, and tone. It works across multiple platforms and provides real-time suggestions to enhance your content.',
    keyFeatures: [
      'Real-time grammar and spelling checks',
      'Tone detection and suggestions',
      'Plagiarism checker (Premium)',
      'Style and clarity improvements',
      'Multi-platform support',
      'Browser extension'
    ],
    pros: [
      'Highly accurate corrections',
      'Works everywhere you write',
      'User-friendly interface',
      'Free version is very capable'
    ],
    cons: [
      'Premium features are expensive',
      'Can be overly prescriptive',
      'Occasional false positives',
      'Privacy concerns with data'
    ],
    useCases: [
      'Email and document proofreading',
      'Blog post and article editing',
      'Academic writing assistance',
      'Professional communication'
    ],
    pricingType: 'Freemium',
    pricingDetails: 'Free: Basic grammar and spelling. Premium: $12/month (billed annually) includes advanced features. Business: $15/user/month',
    monthlyPrice: 12,
    websiteUrl: 'https://www.grammarly.com',
    platforms: ['Web', 'Windows', 'Mac', 'iOS', 'Android', 'Chrome Extension'],
    rating: 4.7,
    reviewCount: 12500,
    verified: true,
    featured: false,
    aiModelsUsed: ['Custom Model', 'GPT-3']
  },
  {
    internalName: 'GitHub Copilot',
    toolName: 'GitHub Copilot',
    slug: 'github-copilot',
    tagline: 'AI pair programmer that helps you write code faster',
    category: ['Code'],
    description: 'GitHub Copilot is an AI-powered code completion tool developed by GitHub and OpenAI. It suggests whole lines or blocks of code as you type, helping developers write code faster and with fewer errors across dozens of programming languages.',
    keyFeatures: [
      'Intelligent code suggestions',
      'Multi-language support',
      'Context-aware completions',
      'Function generation from comments',
      'IDE integration',
      'Test generation'
    ],
    pros: [
      'Significant productivity boost',
      'Learns your coding style',
      'Great for boilerplate code',
      'Supports many languages and frameworks'
    ],
    cons: [
      'Subscription required',
      'Can suggest incorrect code',
      'Potential licensing concerns',
      'May hinder learning for beginners'
    ],
    useCases: [
      'Rapid prototyping',
      'Writing boilerplate code',
      'Learning new frameworks',
      'Code refactoring'
    ],
    pricingType: 'Paid',
    pricingDetails: 'Individual: $10/month or $100/year. Business: $19/user/month. Free for students and open-source maintainers.',
    monthlyPrice: 10,
    websiteUrl: 'https://github.com/features/copilot',
    platforms: ['VS Code', 'Visual Studio', 'JetBrains IDEs', 'Neovim'],
    rating: 4.5,
    reviewCount: 8740,
    verified: true,
    featured: false,
    aiModelsUsed: ['GPT-4', 'Codex']
  },
  {
    internalName: 'Synthesia',
    toolName: 'Synthesia',
    slug: 'synthesia',
    tagline: 'Create AI videos with human presenters from text',
    category: ['Video Editing'],
    description: 'Synthesia is an AI video creation platform that allows you to create professional videos with AI avatars without filming, using just text. It\'s perfect for creating training videos, presentations, and marketing content at scale.',
    keyFeatures: [
      '150+ AI avatars',
      '120+ languages and accents',
      'Custom avatar creation',
      'Video templates',
      'Screen recording',
      'No camera or studio needed'
    ],
    pros: [
      'No video production skills required',
      'Fast video creation',
      'Professional-looking results',
      'Multilingual support'
    ],
    cons: [
      'Expensive for individuals',
      'Limited avatar customization on lower tiers',
      'Can look artificial at times',
      'Watermark on free trial'
    ],
    useCases: [
      'Training and educational videos',
      'Product demonstrations',
      'Marketing and sales videos',
      'Internal communications'
    ],
    pricingType: 'Paid',
    pricingDetails: 'Starter: $29/month (10 videos), Creator: $89/month (30 videos), Enterprise: Custom pricing',
    monthlyPrice: 29,
    websiteUrl: 'https://www.synthesia.io',
    platforms: ['Web'],
    rating: 4.3,
    reviewCount: 1850,
    verified: true,
    featured: false,
    aiModelsUsed: ['Custom Model']
  },
  {
    internalName: 'Notion AI',
    toolName: 'Notion AI',
    slug: 'notion-ai',
    tagline: 'AI-powered workspace for notes, docs, and project management',
    category: ['Productivity'],
    description: 'Notion AI integrates artificial intelligence directly into the Notion workspace, helping you write better, think bigger, and work faster. It can generate content, summarize notes, translate text, and help organize information efficiently.',
    keyFeatures: [
      'AI writing assistant',
      'Content summarization',
      'Action items extraction',
      'Translation (multiple languages)',
      'Tone and style adjustments',
      'Integrated with Notion workspace'
    ],
    pros: [
      'Seamlessly integrated with Notion',
      'Versatile use cases',
      'Helps with organization and structure',
      'Affordable add-on pricing'
    ],
    cons: [
      'Requires Notion subscription',
      'Limited compared to standalone AI tools',
      'Can be slow at times',
      'Not as powerful for specialized tasks'
    ],
    useCases: [
      'Meeting notes and summaries',
      'Project documentation',
      'Content drafting and editing',
      'Knowledge base creation'
    ],
    pricingType: 'Freemium',
    pricingDetails: 'Notion AI: $10/user/month (add-on to any Notion plan). Notion Free plan available without AI.',
    monthlyPrice: 10,
    websiteUrl: 'https://www.notion.so/product/ai',
    platforms: ['Web', 'Windows', 'Mac', 'iOS', 'Android'],
    rating: 4.6,
    reviewCount: 6420,
    verified: true,
    featured: false,
    aiModelsUsed: ['GPT-4', 'Custom Model']
  },
  {
    internalName: 'Claude',
    toolName: 'Claude',
    slug: 'claude',
    tagline: 'Constitutional AI assistant for safe, helpful, and honest conversations',
    category: ['Content Writing', 'Code'],
    description: 'Claude is an AI assistant created by Anthropic with a focus on being helpful, harmless, and honest. It excels at tasks requiring nuanced understanding, analysis, and extended conversations, while maintaining strong safety guidelines.',
    keyFeatures: [
      'Extended context window (100K+ tokens)',
      'Document analysis and summarization',
      'Code generation and review',
      'Constitutional AI principles',
      'Nuanced reasoning',
      'Safe and ethical responses'
    ],
    pros: [
      'Excellent for long documents',
      'High-quality, thoughtful responses',
      'Strong ethical guidelines',
      'Great for analysis tasks'
    ],
    cons: [
      'More conservative in responses',
      'Limited availability in some regions',
      'Fewer integrations than competitors',
      'Pro version can be expensive'
    ],
    useCases: [
      'Document analysis and research',
      'Content creation and editing',
      'Code review and debugging',
      'Complex problem solving'
    ],
    pricingType: 'Freemium',
    pricingDetails: 'Free tier available. Claude Pro: $20/month for priority access and extended usage.',
    monthlyPrice: 20,
    websiteUrl: 'https://claude.ai',
    platforms: ['Web', 'API'],
    rating: 4.8,
    reviewCount: 7230,
    verified: true,
    featured: true,
    aiModelsUsed: ['Claude 3 Opus', 'Claude 3 Sonnet']
  },
  {
    internalName: 'Perplexity AI',
    toolName: 'Perplexity AI',
    slug: 'perplexity-ai',
    tagline: 'AI-powered answer engine with real-time web search',
    category: ['Research'],
    description: 'Perplexity AI is an AI-powered search and answer engine that provides accurate, sourced answers to your questions by searching the web in real-time. It combines the power of large language models with up-to-date information from the internet.',
    keyFeatures: [
      'Real-time web search',
      'Source citations',
      'Follow-up questions',
      'Multi-turn conversations',
      'Collections for research',
      'Mobile apps'
    ],
    pros: [
      'Always up-to-date information',
      'Provides source citations',
      'Clean, focused interface',
      'Good free tier'
    ],
    cons: [
      'Limited customization',
      'Can be slower than traditional search',
      'Pro features behind paywall',
      'Occasional source accuracy issues'
    ],
    useCases: [
      'Research and fact-checking',
      'Quick information lookup',
      'Exploring complex topics',
      'News and current events'
    ],
    pricingType: 'Freemium',
    pricingDetails: 'Free: 5 Pro searches/day. Pro: $20/month for unlimited Pro searches and GPT-4 access.',
    monthlyPrice: 20,
    websiteUrl: 'https://www.perplexity.ai',
    platforms: ['Web', 'iOS', 'Android'],
    rating: 4.5,
    reviewCount: 4180,
    verified: true,
    featured: false,
    aiModelsUsed: ['GPT-4', 'Claude', 'Custom Model']
  },
  {
    internalName: 'Canva AI',
    toolName: 'Canva AI',
    slug: 'canva-ai',
    tagline: 'Design platform with AI-powered image generation and editing',
    category: ['Image Generation', 'Marketing'],
    description: 'Canva AI brings artificial intelligence to the popular design platform, offering features like text-to-image generation, Magic Edit, background removal, and AI writing assistance. It makes professional design accessible to everyone.',
    keyFeatures: [
      'Text-to-image generation',
      'Magic Edit and Magic Eraser',
      'Background removal',
      'AI writing assistant',
      'Brand Kit with AI',
      'Template customization'
    ],
    pros: [
      'User-friendly interface',
      'All-in-one design solution',
      'Extensive template library',
      'Great for non-designers'
    ],
    cons: [
      'AI features require Pro subscription',
      'Image quality varies',
      'Limited compared to specialized AI tools',
      'Can be slow with complex projects'
    ],
    useCases: [
      'Social media graphics',
      'Presentations and documents',
      'Marketing materials',
      'Quick design mockups'
    ],
    pricingType: 'Freemium',
    pricingDetails: 'Free: Basic features. Pro: $15/month (1 user) includes AI features. Teams: $30/month (5 users)',
    monthlyPrice: 15,
    websiteUrl: 'https://www.canva.com',
    platforms: ['Web', 'Windows', 'Mac', 'iOS', 'Android'],
    rating: 4.6,
    reviewCount: 18950,
    verified: true,
    featured: false,
    aiModelsUsed: ['DALL-E', 'Custom Model']
  },
  {
    internalName: 'SEMrush',
    toolName: 'SEMrush',
    slug: 'semrush',
    tagline: 'All-in-one SEO and digital marketing platform with AI insights',
    category: ['SEO', 'Analytics'],
    description: 'SEMrush is a comprehensive SEO and digital marketing platform that provides tools for keyword research, competitor analysis, site audits, and content optimization. Its AI-powered features help marketers make data-driven decisions.',
    keyFeatures: [
      'Keyword research and tracking',
      'Competitor analysis',
      'Site audit and technical SEO',
      'Content marketing toolkit',
      'Backlink analysis',
      'AI-powered insights'
    ],
    pros: [
      'Comprehensive feature set',
      'Accurate data and insights',
      'Excellent competitor research',
      'Regular updates and improvements'
    ],
    cons: [
      'Expensive for small businesses',
      'Steep learning curve',
      'Can be overwhelming for beginners',
      'Some features require higher tiers'
    ],
    useCases: [
      'SEO strategy and planning',
      'Competitor analysis',
      'Content optimization',
      'PPC campaign management'
    ],
    pricingType: 'Paid',
    pricingDetails: 'Pro: $139.95/month, Guru: $249.95/month, Business: $499.95/month. Free trial available.',
    monthlyPrice: 140,
    websiteUrl: 'https://www.semrush.com',
    platforms: ['Web', 'Chrome Extension'],
    rating: 4.7,
    reviewCount: 5840,
    verified: true,
    featured: true,
    aiModelsUsed: ['Custom Model']
  },
  {
    internalName: 'Descript',
    toolName: 'Descript',
    slug: 'descript',
    tagline: 'All-in-one audio and video editor with AI transcription',
    category: ['Audio Processing', 'Video Editing'],
    description: 'Descript is a collaborative audio and video editor that uses AI to transcribe, edit, and enhance your content. You can edit audio and video by editing text, making it incredibly intuitive for podcasters, video creators, and content teams.',
    keyFeatures: [
      'Transcription-based editing',
      'Overdub (AI voice cloning)',
      'Studio sound enhancement',
      'Filler word removal',
      'Screen recording',
      'Collaborative editing'
    ],
    pros: [
      'Revolutionary text-based editing',
      'Excellent transcription accuracy',
      'All-in-one solution',
      'Great for podcasts and videos'
    ],
    cons: [
      'Learning curve for advanced features',
      'Export times can be long',
      'Resource intensive',
      'Overdub quality varies'
    ],
    useCases: [
      'Podcast editing and production',
      'Video content creation',
      'Interview transcription',
      'Screen recording and tutorials'
    ],
    pricingType: 'Freemium',
    pricingDetails: 'Free: 1 hour transcription/month. Creator: $24/month, Pro: $50/month, Enterprise: Custom pricing',
    monthlyPrice: 24,
    websiteUrl: 'https://www.descript.com',
    platforms: ['Web', 'Windows', 'Mac'],
    rating: 4.4,
    reviewCount: 3290,
    verified: true,
    featured: false,
    aiModelsUsed: ['Custom Model', 'Whisper']
  },
  {
    internalName: 'Runway ML',
    toolName: 'Runway ML',
    slug: 'runway-ml',
    tagline: 'Next-generation AI tools for content creation',
    category: ['Image Generation', 'Video Editing'],
    description: 'Runway ML is an advanced AI platform offering cutting-edge tools for image and video generation, editing, and manipulation. It\'s popular among creators, filmmakers, and designers for its innovative AI-powered features.',
    keyFeatures: [
      'Text and image to video',
      'AI video editing tools',
      'Background removal',
      'Motion tracking',
      'Green screen replacement',
      '30+ AI Magic Tools'
    ],
    pros: [
      'Cutting-edge AI features',
      'High-quality outputs',
      'Great for creative professionals',
      'Regular new features'
    ],
    cons: [
      'Credit-based pricing',
      'Can be expensive for heavy use',
      'Processing can be slow',
      'Learning curve for advanced features'
    ],
    useCases: [
      'Video content creation',
      'Visual effects and editing',
      'AI-generated animations',
      'Creative experimentation'
    ],
    pricingType: 'Freemium',
    pricingDetails: 'Free: 125 credits. Standard: $15/month (625 credits), Pro: $35/month (2250 credits), Unlimited: $95/month',
    monthlyPrice: 15,
    websiteUrl: 'https://runwayml.com',
    platforms: ['Web'],
    rating: 4.5,
    reviewCount: 2640,
    verified: true,
    featured: false,
    aiModelsUsed: ['Gen-2', 'Custom Model']
  }
];

async function createAIToolEntry(environment, toolData) {
  try {
    console.log(`Creating entry for: ${toolData.toolName}...`);

    // Create the entry
    const entry = await environment.createEntry('aiTool', {
      fields: {
        internalName: { 'en-US': toolData.internalName },
        toolName: { 'en-US': toolData.toolName },
        slug: { 'en-US': toolData.slug },
        tagline: { 'en-US': toolData.tagline },
        category: { 'en-US': toolData.category },
        description: { 'en-US': toolData.description },
        keyFeatures: { 'en-US': toolData.keyFeatures },
        pros: { 'en-US': toolData.pros },
        cons: { 'en-US': toolData.cons },
        useCases: { 'en-US': toolData.useCases },
        pricingType: { 'en-US': toolData.pricingType },
        pricingDetails: { 'en-US': toolData.pricingDetails },
        monthlyPrice: { 'en-US': toolData.monthlyPrice },
        websiteUrl: { 'en-US': toolData.websiteUrl },
        platforms: { 'en-US': toolData.platforms },
        rating: { 'en-US': toolData.rating },
        reviewCount: { 'en-US': toolData.reviewCount },
        verified: { 'en-US': toolData.verified },
        featured: { 'en-US': toolData.featured },
        aiModelsUsed: { 'en-US': toolData.aiModelsUsed }
      }
    });

    // Publish the entry
    await entry.publish();
    console.log(`✓ ${toolData.toolName} created and published successfully!`);

    return entry;
  } catch (error) {
    console.error(`✗ Error creating ${toolData.toolName}:`, error.message);
    throw error;
  }
}

async function seedAITools() {
  try {
    console.log('Starting AI Tools seed script...\n');

    // Get space
    const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
    console.log(`Connected to space: ${space.name}\n`);

    // Get environment
    const environment = await space.getEnvironment(process.env.CONTENTFUL_ENVIRONMENT);
    console.log(`Using environment: ${process.env.CONTENTFUL_ENVIRONMENT}\n`);

    // Create entries
    console.log(`Creating ${aiToolsData.length} AI tool entries...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const toolData of aiToolsData) {
      try {
        await createAIToolEntry(environment, toolData);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to create ${toolData.toolName}`);
      }
    }

    console.log('\n==============================================');
    console.log('Seed script completed!');
    console.log(`✓ Successfully created: ${successCount} entries`);
    if (errorCount > 0) {
      console.log(`✗ Failed: ${errorCount} entries`);
    }
    console.log('==============================================\n');
    console.log('Visit http://localhost:5174/ai-tools to see your AI tools!');

  } catch (error) {
    console.error('Error in seed script:', error);
    process.exit(1);
  }
}

// Run the script
seedAITools();
