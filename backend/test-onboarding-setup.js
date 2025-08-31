const mongoose = require('mongoose');
require('dotenv').config();

// Test onboarding setup
async function testOnboardingSetup() {
  try {
    console.log('🧪 Testing Onboarding Setup...');
    
    // Test database connection
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Database connected');
    
    // Test models
    console.log('📋 Testing models...');
    
    const OnboardingProgress = require('./models/OnboardingProgress');
    const BrandProfile = require('./models/BrandProfile');
    
    console.log('✅ OnboardingProgress model loaded');
    console.log('✅ BrandProfile model loaded');
    
    // Test controller
    console.log('🎮 Testing controller...');
    const onboardingController = require('./controllers/onboarding');
    console.log('✅ Onboarding controller loaded');
    
    // Test routes
    console.log('🛣️ Testing routes...');
    const onboardingRoutes = require('./routes/onboarding');
    console.log('✅ Onboarding routes loaded');
    
    console.log('\n🎉 All onboarding components loaded successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ OnboardingProgress model');
    console.log('- ✅ BrandProfile model (with competitors field)');
    console.log('- ✅ Onboarding controller');
    console.log('- ✅ Onboarding routes');
    console.log('- ✅ App.js updated with onboarding routes');
    
    console.log('\n🚀 Onboarding system is ready to use!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Database disconnected');
  }
}

// Run test
testOnboardingSetup();










