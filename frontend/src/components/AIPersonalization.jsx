import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users } from 'lucide-react';

const AIPersonalization = ({ children }) => {
  const [userContext, setUserContext] = useState({
    location: '',
    timeOfDay: '',
    deviceType: '',
    referrer: '',
    isNewVisitor: true
  });

  useEffect(() => {
    // Detect user context for personalization
    const detectUserContext = () => {
      // Get time of day
      const hour = new Date().getHours();
      let timeOfDay = 'day';
      if (hour < 12) timeOfDay = 'morning';
      else if (hour < 17) timeOfDay = 'afternoon';
      else timeOfDay = 'evening';

      // Get device type
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const deviceType = isMobile ? 'mobile' : 'desktop';

      // Get referrer
      const referrer = document.referrer;
      let referrerSource = 'direct';
      if (referrer.includes('google')) referrerSource = 'google';
      else if (referrer.includes('facebook')) referrerSource = 'facebook';
      else if (referrer.includes('twitter')) referrerSource = 'twitter';
      else if (referrer.includes('linkedin')) referrerSource = 'linkedin';

      // Check if new visitor
      const isNewVisitor = !localStorage.getItem('snowball_visited');
      if (isNewVisitor) {
        localStorage.setItem('snowball_visited', 'true');
      }

      // Get approximate location (using timezone as proxy)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const location = timezone.split('/')[1] || 'Unknown';

      setUserContext({
        location,
        timeOfDay,
        deviceType,
        referrer: referrerSource,
        isNewVisitor
      });
    };

    detectUserContext();
  }, []);

  // Generate personalized greeting
  const getPersonalizedGreeting = () => {
    const greetings = {
      morning: "Good morning! Ready to supercharge your content?",
      afternoon: "Good afternoon! Let's optimize your content strategy",
      evening: "Good evening! Perfect time to analyze your content"
    };

    return greetings[userContext.timeOfDay] || "Welcome! Let's improve your content together";
  };

  // Generate personalized CTA based on referrer
  const getPersonalizedCTA = () => {
    const ctaMap = {
      google: "Improve Your Search Rankings",
      facebook: "Boost Your Social Content",
      twitter: "Optimize Your Posts",
      linkedin: "Enhance Professional Content",
      direct: "Start Your Content Analysis"
    };

    return ctaMap[userContext.referrer] || "Analyze Your Content";
  };

  // Live user activity simulation
  const [liveActivity, setLiveActivity] = useState({
    recentSignup: '',
    activeUsers: Math.floor(Math.random() * 500) + 1200
  });

  useEffect(() => {
    const names = ['Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'James', 'Anna', 'Robert'];
    const companies = ['TechCorp', 'StartupHub', 'ContentPro', 'BlogMaster', 'WriteCo', 'MediaFlow'];

    const updateActivity = () => {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomCompany = companies[Math.floor(Math.random() * companies.length)];

      setLiveActivity(prev => ({
        recentSignup: `${randomName} from ${randomCompany} just signed up`,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1
      }));
    };

    const interval = setInterval(updateActivity, 8000);
    updateActivity(); // Initial update

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {children({ userContext, getPersonalizedGreeting, getPersonalizedCTA })}

      {/* Live Activity Feed */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2 }}
        className="fixed top-1/2 right-4 transform -translate-y-1/2 z-40 max-w-xs"
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-4 space-y-3">
          {/* Active Users */}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-700 font-medium">
              {liveActivity.activeUsers.toLocaleString()} active users
            </span>
          </div>

          {/* Recent Signup */}
          {liveActivity.recentSignup && (
            <motion.div
              key={liveActivity.recentSignup}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-xs text-gray-600 bg-green-50 rounded-md p-2"
            >
              🎉 {liveActivity.recentSignup}
            </motion.div>
          )}

          {/* Location indicator */}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span>Visitors from {userContext.location}</span>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default AIPersonalization;