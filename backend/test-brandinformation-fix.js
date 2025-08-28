const mongoose = require('mongoose');
const BrandProfile = require('./models/BrandProfile');

// Test script to verify brandInformation field can handle longer text
async function testBrandInformationLength() {
  try {
    console.log('🧪 Testing brandInformation field length fix...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/snowball');
    console.log('✅ Connected to MongoDB');
    
    // Create a test brand profile with long brandInformation
    const longBrandInfo = `OVERVIEW: OneShot.ai is a technology company specializing in AI-powered sales enablement tools designed to enhance the efficiency and effectiveness of sales development representatives (SDRs) and sales teams. Their platform offers a comprehensive suite of services centered around **AI-driven prospect research, personalized outreach, and data enrichment**. Key offerings include:

- **AI-Generated Messaging:** Uses generative AI to craft highly personalized outreach emails and messages tailored to individual prospects, improving engagement and conversion rates.

- **Ideal Customer Profile (ICP) Lead Sourcing:** AI analyzes predefined criteria to identify and verify the most relevant prospects, enabling sales teams to focus on high-potential leads.

- **AI SDR Automation:** Automates outbound sales processes by enriching prospect data, optimizing email deliverability, automating responses based on prospect behavior, and providing robust analytics for campaign performance. It integrates seamlessly with popular sales platforms such as HubSpot, Apollo, Outreach, and Salesloft.

- **Autonomous Prospecting of Website Visitors:** Automatically identifies and engages potential leads visiting a company's website by analyzing visitor behavior, capturing opportunities that might otherwise be missed.

- **Data Enrichment:** Aggregates and enhances prospect profiles by compiling data from multiple sources, giving sales teams a fuller understanding of leads to tailor outreach effectively.

- **Insight and Personalization Agents:** The Insight Agent conducts deep research on prospects, gathering relevant details like job titles, company news, and pain points. The Personalization Agent uses these insights to generate customized messages across multiple channels (email, LinkedIn, cold calls).

- **Analytics and Dashboard:** Provides a user-friendly interface to track campaign success, prospect interactions, and overall outreach effectiveness, enabling continuous optimization.

Overall, OneShot.ai addresses common sales challenges such as research overload, low response rates, inefficient workflows, and time management by automating and enhancing the prospecting and outreach process with AI technology.

DESCRIPTION: OneShot.ai delivers AI-powered sales acceleration by automating prospect research and crafting personalized outreach, enabling sales teams to engage the right leads more efficiently and increase conversion rates through data-driven, multi-channel communication.`;

    console.log(`📏 Brand information length: ${longBrandInfo.length} characters`);
    
    // Create a test brand profile
    const testBrand = new BrandProfile({
      ownerUserId: new mongoose.Types.ObjectId(), // Generate a fake ObjectId
      brandName: 'Test Brand',
      domain: 'testbrand.com',
      brandInformation: longBrandInfo,
      isAdminAnalysis: true // Mark as super user analysis
    });
    
    // Try to save it
    await testBrand.save();
    console.log('✅ Successfully saved brand profile with long brandInformation');
    
    // Clean up - delete the test brand
    await BrandProfile.findByIdAndDelete(testBrand._id);
    console.log('🧹 Test brand cleaned up');
    
    console.log('🎉 Test passed! brandInformation field can now handle long text');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.errors && error.errors.brandInformation) {
      console.error('🔍 BrandInformation validation error:', error.errors.brandInformation.message);
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testBrandInformationLength();
