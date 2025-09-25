require('dotenv').config();
const mongoose = require('mongoose');
const contentCalendarController = require('./controllers/contentCalendar');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for testing');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Test function
async function testContentCalendar() {
  console.log('🧪 Starting Content Calendar API Test...\n');

  // Mock request object
  const mockReq = {
    body: {
      companyName: "Test Company AI",
      brandProfile: {
        domain: "oneshot.ai",
        name: "Oneshot AI",
        description: "AI-powered solutions for businesses"
      },
      brandCategories: ["AI", "Technology", "SaaS", "Automation"]
    },
    user: { 
      id: "507f1f77bcf86cd799439011" // Test MongoDB ObjectId
    }
  };

  // Mock response object
  const mockRes = {
    json: (data) => {
      console.log('\n✅ SUCCESS RESPONSE:');
      console.log(JSON.stringify(data, null, 2));
      process.exit(0);
    },
    status: (code) => ({
      json: (data) => {
        console.log(`\n❌ ERROR RESPONSE (${code}):`);
        console.log(JSON.stringify(data, null, 2));
        process.exit(1);
      }
    })
  };

  console.log('📋 Test Parameters:');
  console.log('   Company:', mockReq.body.companyName);
  console.log('   Domain:', mockReq.body.brandProfile.domain);
  console.log('   Categories:', mockReq.body.brandCategories.join(', '));
  console.log('   User ID:', mockReq.user.id);
  console.log('\n🚀 Calling generateCalendar...\n');

  // Call the actual API method
  try {
    await contentCalendarController.generateCalendar(mockReq, mockRes);
  } catch (error) {
    console.error('\n💥 UNHANDLED ERROR:', error);
    process.exit(1);
  }
}

// Run the test
async function runTest() {
  await connectDB();
  await testContentCalendar();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  mongoose.connection.close();
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled Promise Rejection:', error);
  mongoose.connection.close();
  process.exit(1);
});

// Start the test
runTest().catch(console.error);