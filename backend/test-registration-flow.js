const axios = require('axios');

// Configuration
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';
const TEST_NAME = 'Test User';

console.log('🧪 Testing New Registration Flow with Auto-Login');
console.log('================================================');
console.log(`API Base: ${API_BASE}`);
console.log(`Test Email: ${TEST_EMAIL}`);
console.log('');

async function testRegistrationFlow() {
  try {
    console.log('📝 Step 1: Testing User Registration');
    console.log('-------------------------------------');
    
    const registrationData = {
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    };
    
    console.log('📤 Sending registration request...');
    const registrationResponse = await axios.post(`${API_BASE}/api/v1/register`, registrationData);
    
    if (registrationResponse.status === 201) {
      console.log('✅ Registration successful!');
      console.log('📊 Response data:', {
        hasPerson: !!registrationResponse.data.person,
        hasToken: !!registrationResponse.data.token,
        hasMessage: !!registrationResponse.data.message,
        personId: registrationResponse.data.person?._id,
        tokenLength: registrationResponse.data.token?.length || 0
      });
      
      if (registrationResponse.data.token) {
        console.log('🎉 JWT token received for automatic login!');
        
        // Test the token by making an authenticated request
        console.log('\n🔐 Step 2: Testing Auto-Login with Token');
        console.log('------------------------------------------');
        
        const token = registrationResponse.data.token;
        console.log('📤 Testing token by calling onboarding status...');
        
        try {
          const onboardingResponse = await axios.get(`${API_BASE}/api/v1/onboarding/status`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('✅ Token authentication successful!');
          console.log('📊 Onboarding status:', onboardingResponse.data);
          
        } catch (authError) {
          console.log('❌ Token authentication failed:', authError.response?.status, authError.response?.data?.msg);
        }
        
      } else {
        console.log('❌ No JWT token received in registration response');
      }
      
    } else {
      console.log('❌ Registration failed with status:', registrationResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.status, error.response?.data?.msg || error.message);
  }
}

// Run the test
testRegistrationFlow().then(() => {
  console.log('\n🎯 Registration Flow Test Complete!');
  console.log('');
  console.log('Expected Results:');
  console.log('✅ Registration returns 201 status');
  console.log('✅ Response includes person data');
  console.log('✅ Response includes JWT token');
  console.log('✅ Token can be used for authenticated requests');
  console.log('✅ User can be automatically logged in');
  console.log('');
  console.log('Next Steps:');
  console.log('1. Test frontend registration flow');
  console.log('2. Verify redirect to onboarding page');
  console.log('3. Confirm seamless user experience');
});
