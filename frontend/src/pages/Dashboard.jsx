import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import DomainAnalysis from './DomainAnalysis';
import BlogAnalysis from './BlogAnalysis';
import ContentCalendarView from './ContentCalendarView';
import PublishedBlogsView from './PublishedBlogsView';
import BrandSettings from '../components/BrandSettings';
import ShopifySettings from '../components/ShopifySettings';
import WebflowSettings from '../components/WebflowSettings';
import WordPressSettings from '../components/WordPressSettings';
import SuperUserDomainAnalysis from '../components/SuperUserDomainAnalysis';
import Analytics from '../components/Analytics';
import StripePaymentSettings from '../components/StripePaymentSettings';
import CMSConnectionSelector from '../components/CMSConnectionSelector';
import { toast } from 'react-toastify';

import { apiService } from '../utils/api';
import { getUserName, isSuperuser } from '../utils/auth';
import {
  BarChart3,
  Globe,
  FileText,
  Settings,
  LogOut,
  Link as LinkIcon,
  Activity,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Building2,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Brain,
  Zap,
  User,
  Palette,
  CreditCard,
  Bell,
  Sliders,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Read initial section and tool from URL
  const urlParams = new URLSearchParams(location.search);
  const initialSection = urlParams.get('section') || 'dashboard';
  const initialTool = urlParams.get('tool') || null;
  const initialRedirect = urlParams.get('redirect');

  const [activeSection, setActiveSection] = useState(initialRedirect === 'brand-dashboard' ? 'brand-dashboard' : initialSection);
  const [showAnalyzeLink, setShowAnalyzeLink] = useState(false);
  const [activeTool, setActiveTool] = useState(initialTool); // 'domain' | 'blog' | null
  const [domainToAnalyze, setDomainToAnalyze] = useState('');
  const [userName, setUserName] = useState(getUserName());
  const [isLoadingContentCalendar, setIsLoadingContentCalendar] = useState(false);
  const [shouldAutoLoadContent, setShouldAutoLoadContent] = useState(false);
  const [userBrands, setUserBrands] = useState([]);
  const [isUserSuperuser, setIsUserSuperuser] = useState(isSuperuser());
  const [showCMSSelector, setShowCMSSelector] = useState(false);
  const [cmsFocus, setCmsFocus] = useState(null);
  const [isInContentEditor, setIsInContentEditor] = useState(false);
  const [contentCalendarData, setContentCalendarData] = useState(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState('account');
  const [showCMSAdvanced, setShowCMSAdvanced] = useState(false);
  const [cmsConnectionStatus, setCmsConnectionStatus] = useState({
    shopify: 'checking',
    webflow: 'checking',
    wordpress: 'checking'
  });

  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    fullName: '',
    email: '',
    company: '',
    role: '',
    notifications: {
      analysisCompletion: true,
      weeklyReports: false,
      contentCalendarReminders: true,
      competitorAlerts: false
    }
  });
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Analysis preferences state
  const [analysisPreferences, setAnalysisPreferences] = useState({
    analysisDepth: 'standard',
    blogScoringThreshold: '60',
    contentCalendarPlanning: '30',
    dataRetention: '6-months'
  });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Helper function to update section and URL simultaneously
  const navigateToSection = (section, tool = null) => {
    setActiveSection(section);
    setActiveTool(tool);

    // Build query params
    const params = new URLSearchParams();
    if (section !== 'dashboard') {
      params.set('section', section);
    }
    if (tool) {
      params.set('tool', tool);
    }

    // Update URL and add to browser history
    const newUrl = params.toString() ? `/dashboard?${params.toString()}` : '/dashboard';
    navigate(newUrl);
  };

  // Function to get dynamic welcome message based on content calendar state
  const getWelcomeMessage = () => {
    if (activeSection === 'brand-dashboard') {
      return {
        title: `Welcome back, ${userName}!`,
        subtitle: (
          <div className="space-y-1">
            <span className="flex items-center space-x-1">
              <Globe className="w-4 h-4 text-[#6658f4]" />
              <span><strong>Brand Dashboard</strong></span>
            </span>
          </div>
        )
      };
    }

    if (activeSection === 'settings') {
      return {
        title: `Welcome back, ${userName}!`,
        subtitle: (
          <div className="space-y-1">
            <span className="flex items-center space-x-1">
              <Settings className="w-4 h-4 text-[#6658f4]" />
              <span><strong>Settings</strong></span>
            </span>
          </div>
        )
      };
    }

    if (activeTool === 'analytics') {
      return {
        title: `Welcome back, ${userName}!`,
        subtitle: (
          <div className="space-y-1">
            <span className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4 text-[#6658f4]" />
              <span><strong>Analytics Dashboard</strong></span>
            </span>
          </div>
        )
      };
    }

    if (activeTool === 'content-calendar' || activeSection === 'content-calendar') {
      let dynamicSubtitle = (
        <span className="flex items-center space-x-1">


        </span>
      );

      if (contentCalendarData && contentCalendarData.length > 0) {
        const draftCount = contentCalendarData.filter(item => item.status === 'draft').length;
        const approvedCount = contentCalendarData.filter(item => item.status === 'approved').length;

        if (approvedCount > 0) {
          dynamicSubtitle = (
            <span className="flex items-center space-x-1">
              <Sparkles className="w-4 h-4 text-[#6658f4]" />
              <span>Your <strong>AI content pipeline</strong> has {approvedCount} ready to publish!</span>
            </span>
          );
        } else if (draftCount > 0) {
          dynamicSubtitle = (
            <span className="flex items-center space-x-1">
              <Brain className="w-4 h-4 text-[#6658f4]" />
              <span>Your <strong>AI calendar</strong> has {draftCount} drafts ready for review</span>
            </span>
          );
        }
      }

      return {
        title: `Welcome back, ${userName}!`,
        subtitle: (
          <div className="space-y-1">
            {dynamicSubtitle}
            <div className="mt-3">
              <h2 className="text-lg font-semibold text-[#4a4a6a] flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#6658f4]" />
                <span>Content Calendar</span>
              </h2>
            </div>
          </div>
        )
      };
    }

    if (activeTool === 'published-blogs') {
      return {
        title: `Welcome back, ${userName}!`,
        subtitle: "Published Blogs"
      };
    }

    // Default message for other sections
    return {
      title: `Welcome back, ${userName}!`,
      subtitle: "Ready to analyze your next project?"
    };
  };

  // Check CMS connection status
  const checkCmsConnections = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const auth = localStorage.getItem('auth');

    const platforms = ['shopify', 'webflow', 'wordpress'];
    const statuses = {};

    for (const platform of platforms) {
      try {
        const response = await fetch(`${API_URL}/api/v1/${platform}/status`, {
          headers: { 'Authorization': `Bearer ${auth}` }
        });
        const data = await response.json();
        statuses[platform] = response.ok && data.status === 'connected' ? 'connected' : 'disconnected';
      } catch (error) {
        statuses[platform] = 'disconnected';
      }
    }

    setCmsConnectionStatus(statuses);
  };

  // Direct CMS connection handler
  const handleDirectCmsConnect = async (platform) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const auth = localStorage.getItem('auth');

    try {
      const response = await fetch(`${API_URL}/api/v1/${platform}/connect?shop=testingsnowball.myshopify.com`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${auth}` }
      });

      if (response.redirected) {
        window.location.href = response.url;
      } else if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      }
    } catch (error) {
      console.error(`Error connecting to ${platform}:`, error);
    }
  };

  // Handle connection status changes from integration components
  const handleConnectionChange = (platform, status) => {
    setCmsConnectionStatus(prev => ({
      ...prev,
      [platform]: status
    }));
  };

  // Load content calendar data for dynamic messaging
  useEffect(() => {
    const loadContentCalendarData = async () => {
      try {
        const storedCompanyName = localStorage.getItem('companyName') || getUserName()?.companyName;
        if (storedCompanyName) {
          const response = await apiService.getContentCalendar({ companyName: storedCompanyName });
          if (response.data.data && response.data.data.length > 0) {
            setContentCalendarData(response.data.data);
          }
        }
      } catch (error) {
        console.log('Could not load content calendar data for welcome message:', error);
      }
    };

    loadContentCalendarData();
  }, [activeTool, activeSection]);

  // Check CMS connections when integrations tab is active
  useEffect(() => {
    if (activeSection === 'settings' && activeSettingsTab === 'integrations') {
      checkCmsConnections();
    }
  }, [activeSection, activeSettingsTab]);

  // Fetch user profile data when settings section is active
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (activeSection === 'settings' && activeSettingsTab === 'account') {
        try {
          const response = await apiService.getUserProfile();
          const userData = response.data.user;

          setAccountSettings(prev => ({
            ...prev,
            fullName: userData.name || '',
            email: userData.email || '',
            company: userData.company || '',
            role: userData.jobTitle || ''
          }));
        } catch (error) {
          console.error('Error fetching user profile:', error);
          toast.error('Failed to load profile data');
        }
      }
    };

    fetchUserProfile();
  }, [activeSection, activeSettingsTab]);

  // Handle navigation state from blog editor
  useEffect(() => {
    if (location.state?.showContentCalendar) {
      setIsLoadingContentCalendar(true);
      navigateToSection('dashboard', 'content-calendar');
      setShouldAutoLoadContent(true); // Only auto-load when coming from blog editor

      // Simulate loading time for better UX
      setTimeout(() => {
        setIsLoadingContentCalendar(false);
      }, 800);
    }
  }, [location.state]);

  // Handle URL parameters for direct navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const focus = urlParams.get('focus');
    const redirectParam = urlParams.get('redirect');

    // Handle focus parameter for CMS selector
    if (focus === 'cms') {
      setShowCMSSelector(true);
    }

    // Handle brand-dashboard redirect from login (one-time parameter)
    if (redirectParam === 'brand-dashboard') {
      navigateToSection('brand-dashboard', null);
    }
  }, [location.search]);

  // Sync component state with URL when back/forward buttons are used
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const section = urlParams.get('section') || 'dashboard';
    const tool = urlParams.get('tool') || null;

    // Only update if different from current state to avoid infinite loops
    if (section !== activeSection || tool !== activeTool) {
      setActiveSection(section);
      setActiveTool(tool);
    }
  }, [location.search]);

  // Check onboarding status and fetch user's brands
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Check if user has completed onboarding
        const onboardingResponse = await apiService.getOnboardingStatus();
        
        if (!onboardingResponse.data.isCompleted) {
          // Redirect to onboarding if not completed
          navigate('/onboarding');
          return;
        }
        
        // Don't auto-redirect to domain analysis from Dashboard
        // Users should be able to access the regular Dashboard
        // Login.jsx handles the initial redirect after login/onboarding
        
        // All users can check their domain analysis status (from their completed onboarding)
        // This is just viewing existing data, not creating new analyses
        try {
          const analysisResponse = await apiService.get('/api/v1/domain-analysis/sov-status');
          
          if (!analysisResponse.data.status.isComplete) {
            // Show loading state while analysis runs
            console.log('Domain analysis in progress...');
          }
        } catch (analysisError) {
          console.log('No existing domain analysis data found, which is normal for some users');
          // Continue without domain analysis status - this is normal for users without onboarding data
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Only redirect to onboarding if it's specifically an onboarding-related error
        // Don't redirect for domain analysis access errors (403 forbidden)
        if (error.response?.status !== 403) {
          navigate('/onboarding');
          return;
        }
      }
    };

    const fetchUserBrands = async () => {
      try {
        const response = await apiService.getUserBrands();
        setUserBrands(response.data.brands || []);
      } catch (error) {
        console.error('Error fetching user brands:', error);
      }
    };
    
    checkOnboardingStatus();
    fetchUserBrands();
  }, [navigate]);

  // Reset auto-load flag when manually clicking content calendar
  const handleContentCalendarClick = () => {
    setShouldAutoLoadContent(false);
    navigateToSection('dashboard', 'content-calendar');
  };

  const handleLogout = () => {
    apiService.logout();
  };

  const handleSaveAccountSettings = async () => {
    setIsSavingAccount(true);
    try {
      // Prepare data to send to backend
      const profileData = {
        name: accountSettings.fullName,
        email: accountSettings.email,
        company: accountSettings.company,
        jobTitle: accountSettings.role
      };

      const response = await apiService.updateUserProfile(profileData);

      // Update local user name if it changed
      if (response.data.user.name) {
        setUserName(response.data.user.name);
      }

      toast.success('Profile updated successfully!');
      console.log('Profile updated:', response.data.user);
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save profile settings';
      toast.error(errorMessage);
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleSaveAnalysisPreferences = async () => {
    setIsSavingPreferences(true);
    try {
      // TODO: Implement actual API call when backend endpoint is ready
      // const response = await apiService.updateAnalysisPreferences(analysisPreferences);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // toast.success('Analysis preferences saved successfully!');
      console.log('Analysis preferences saved:', analysisPreferences);
    } catch (error) {
      console.error('Error saving analysis preferences:', error);
      // toast.error('Failed to save analysis preferences');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleDomainAnalysisSubmit = (e) => {
    e.preventDefault();
    if (domainToAnalyze.trim()) {
      navigateToSection('dashboard', 'domain');
    }
  };

  const renderInlineTool = () => {
    if (activeTool === 'domain') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#4a4a6a]">Domain Analysis</h2>
              <p className="text-[#4a4a6a]">Comprehensive brand insights and competitive intelligence</p>
            </div>
            <Button variant="outline" onClick={() => navigateToSection('dashboard', null)} className="inline-flex items-center border-[#b0b0d8] text-[#4a4a6a] hover:bg-white hover:border-[#6658f4]">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </div>
          <DomainAnalysis onClose={() => navigateToSection('dashboard', null)} />
        </div>
      );
    }
    if (activeTool === 'blog') {
      return (
        <div className="space-y-6">
          {/* Content Calendar CTA */}
          <Card className="border-0 bg-gradient-to-r from-[#6658f4] to-[#8b7ff5] text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center space-x-2">
                      <span>✨ Found What Works?</span>
                    </h3>
                    <p className="text-white/90 text-sm">
                      Use these insights to generate better, SEO-optimized content automatically
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setActiveTool('content-calendar')}
                  className="bg-white text-[#6658f4] hover:bg-white/90 font-semibold shadow-md transition-all hover:scale-105"
                >
                  Go to Content Calendar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <BlogAnalysis inline onClose={() => setActiveTool(null)} />
        </div>
      );
    }
    if (activeTool === 'link') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#4a4a6a]">Link Analysis</h2>
              <p className="text-[#4a4a6a]">Quick URL analysis for instant SEO insights</p>
            </div>
            <Button variant="outline" onClick={() => setActiveTool(null)} className="inline-flex items-center border-[#b0b0d8] text-[#4a4a6a] hover:bg-white hover:border-[#6658f4]">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </div>
          <div className="space-y-4">
            <Card className="border-0.3 border-[#b0b0d8] bg-white">
              <CardHeader>
                <CardTitle className="text-[#4a4a6a]">Quick Link Analysis</CardTitle>
                <CardDescription className="text-[#4a4a6a]">
                  Enter a URL to get instant SEO insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDomainAnalysisSubmit} className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={domainToAnalyze}
                      onChange={(e) => setDomainToAnalyze(e.target.value)}
                      className="flex-1 border-[#b0b0d8] focus:border-[#6658f4]"
                    />
                    <Button type="submit" className="gradient-primary">Analyze</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
    if (activeTool === 'content-calendar') {
      return (
        <div className="space-y-6">

          {isLoadingContentCalendar ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#7765e3] mx-auto mb-4"></div>
                <p className="text-lg font-medium text-[#4a4a6a]">Loading Content Calendar...</p>
                <p className="text-sm text-[#6b7280] mt-2">Retrieving your content and settings</p>
              </div>
            </div>
          ) : (
            <ContentCalendarView
              inline
              onClose={() => setActiveTool(null)}
              shouldAutoLoad={shouldAutoLoadContent}
              onEditorStateChange={setIsInContentEditor}
            />
          )}
        </div>
      );
    }
    if (activeTool === 'published-blogs') {
      return <PublishedBlogsView inline onClose={() => setActiveTool(null)} />;
    }

    if (activeTool === 'analytics') {
      return <Analytics onClose={() => setActiveTool(null)} />;
    }

    return null;
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-[#ffffff] flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-[#ffffff]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="text-lg font-semibold text-[#4a4a6a]">Snowball</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {/* Show Dashboard only for superusers
          {isUserSuperuser && (
            <button
              onClick={() => navigateToSection('dashboard', null)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeSection === 'dashboard' && !activeTool
                  ? 'nav-active'
                  : 'text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          )} */}


          {/* Domain Analysis - only for superusers
          {isUserSuperuser && (
            <button
              onClick={() => navigateToSection('dashboard', 'domain')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeSection === 'domain-analysis' || activeTool === 'domain'
                  ? 'nav-active'
                  : 'text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Domain Analysis</span>
            </button>
          )} */}

                     {/* Brand Dashboard - visible to all users with brands except superusers */}
           {userBrands.length > 0 && !isSuperuser() && (
             <button
               onClick={() => navigateToSection('brand-dashboard', null)}
               className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                 activeSection === 'brand-dashboard'
                   ? 'nav-active'
                   : 'text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20'
               }`}
             >
               <BarChart3 className="w-4 h-4" />
               <span>Brand Dashboard</span>
             </button>
           )}

          {/* Content Calendar - visible to all users */}
          <button
            onClick={() => navigateToSection('dashboard', 'content-calendar')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeSection === 'content-calendar' || activeTool === 'content-calendar'
                ? 'nav-active'
                : 'text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Content Calendar</span>
          </button>

          {/* Published Blogs - visible to all users */}
          <button
            onClick={() => navigateToSection('dashboard', 'published-blogs')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeSection === 'published-blogs' || activeTool === 'published-blogs'
                ? 'nav-active'
                : 'text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Published Blogs</span>
          </button>

          {/* Analytics - visible to all users */}
          <button
            onClick={() => navigateToSection('dashboard', 'analytics')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeSection === 'analytics' || activeTool === 'analytics'
                ? 'nav-active'
                : 'text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          {/* Blog Analysis - visible to all users */}
          <button
            onClick={() => navigateToSection('dashboard', 'blog')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeSection === 'blog-analysis' || activeTool === 'blog'
                ? 'nav-active'
                : 'text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Blog Analysis</span>
          </button>

          {/* Shopify Integration - only for superusers
          {isUserSuperuser && (
            <button
              onClick={() => navigate('/shopify-integration')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
            >
              <Building2 className="w-4 h-4" />
              <span>Shopify Integration</span>
            </button>
          )} */}

          {/* History - only for superusers
          {isUserSuperuser && (
            <button
              onClick={() => navigate('/history')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
            >
              <Activity className="w-4 h-4" />
              <span>History</span>
            </button>
          )} */}

          {/* Settings - now available for all users */}
          <button
            onClick={() => navigateToSection('settings', null)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeSection === 'settings'
                ? 'nav-active'
                : 'text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>



          {/* Playground - Only visible to super users */}
          {isUserSuperuser && (
            <button
              onClick={() => navigate('/playground')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
            >
              <Globe className="w-4 h-4" />
              <span>Playground</span>
            </button>
          )}
        </nav>

        {/* Logout - visible to all users */}
        <div className="p-4 border-t border-[#ffffff]">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="bg-gray-50 border-b border-[#ffffff] px-8 py-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-[#000000]">
                {getWelcomeMessage().title}
              </h1>
              <div className="text-[#000000] mt-1">
                {getWelcomeMessage().subtitle}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-white">
          {activeSection === 'dashboard' && (
            <div className="space-y-8">
              {!activeTool && (
                <>
                  {/* Action Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Domain Analysis Card - Only for superusers
                    {isUserSuperuser && (
                      <Card
                        className="cursor-pointer card-hover border-0.3 border-[#b0b0d8] bg-white animate-in slide-in-from-bottom-2 duration-500 ease-out"
                        onClick={() => setActiveTool('domain')}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-[#7c77ff] rounded-lg flex items-center justify-center">
                              <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-[#000000]">
                                Domain Analysis
                              </h3>
                              <p className="text-sm text-[#4a4a6a]">
                                Comprehensive brand insights
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-[#4a4a6a]">
                            Analyze entire domains for competitive intelligence, brand positioning, and market opportunities.
                          </p>
                        </CardContent>
                      </Card>
                    )} */}

                    {/* Blog Analysis Card */}
                    <Card
                      className="cursor-pointer card-hover border-0.3 border-[#b0b0d8] bg-white animate-in slide-in-from-bottom-2 duration-500 ease-out delay-100"
                      onClick={() => setActiveTool('blog')}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-[#7c77ff] rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-[#000000]">
                              Blog Analysis
                            </h3>
                            <p className="text-sm text-[#4a4a6a]">
                              Content quality optimization
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-[#4a4a6a]">
                          Analyze blog content using our GEO framework for content optimization and scoring.
                        </p>
                      </CardContent>
                    </Card>

                                         {/* Content Calendar Card - Available for all users */}
                     <Card
                       className="cursor-pointer card-hover border-0.3 border-[#b0b0d8] bg-white animate-in slide-in-from-bottom-2 duration-500 ease-out delay-200"
                       onClick={() => setActiveTool('content-calendar')}
                     >
                       <CardContent className="p-6">
                         <div className="flex items-center space-x-4 mb-4">
                           <div className="w-12 h-12 bg-gradient-to-r from-[#7c77ff] to-[#6658f4] rounded-lg flex items-center justify-center">
                             <Sparkles className="w-6 h-6 text-white" />
                           </div>
                           <div>
                             <h3 className="text-lg font-semibold text-[#000000] flex items-center space-x-2">
                               <span>🚀 AI Content Calendar</span>
                             </h3>
                             <p className="text-sm text-[#4a4a6a] flex items-center space-x-1">
                               <Brain className="w-4 h-4 text-[#6658f4]" />
                               <span><strong>AI-powered</strong> content planning</span>
                             </p>
                           </div>
                         </div>
                         <p className="text-sm text-[#4a4a6a]">
                           Generate <span className="font-semibold text-[#6658f4]">AI-powered 30-day</span> content plans and auto-publish to your CMS platforms.
                         </p>
                       </CardContent>
                     </Card>

                     {/* Analytics Card - Available for all users */}
                     <Card
                       className="cursor-pointer card-hover border-0.3 border-[#b0b0d8] bg-white animate-in slide-in-from-bottom-2 duration-500 ease-out delay-300"
                       onClick={() => setActiveTool('analytics')}
                     >
                       <CardContent className="p-6">
                         <div className="flex items-center space-x-4 mb-4">
                           <div className="w-12 h-12 bg-[#34d399] rounded-lg flex items-center justify-center">
                             <TrendingUp className="w-6 h-6 text-white" />
                           </div>
                           <div>
                             <h3 className="text-lg font-semibold text-[#000000]">
                               Analytics
                             </h3>
                             <p className="text-sm text-[#4a4a6a]">
                               Google Analytics & Search Console
                             </p>
                           </div>
                         </div>
                         <p className="text-sm text-[#4a4a6a]">
                           Track website performance and published blog analytics from your dashboard.
                         </p>
                       </CardContent>
                     </Card>

                     {/* Shopify Integration Card - Only for superusers
                     {isUserSuperuser && (
                       <Card
                         className="cursor-pointer card-hover border-0.3 border-[#b0b0d8] bg-white animate-in slide-in-from-bottom-2 duration-500 ease-out delay-300"
                         onClick={() => window.location.href = '/shopify-integration'}
                       >
                         <CardContent className="p-6">
                           <div className="flex items-center space-x-4 mb-4">
                             <div className="w-12 h-12 bg-[#7c77ff] rounded-lg flex items-center justify-center">
                               <Building2 className="w-6 h-6 text-white" />
                             </div>
                             <div>
                               <h3 className="text-lg font-semibold text-[#000000]">
                                 Shopify Integration
                               </h3>
                               <p className="text-sm text-[#4a4a6a]">
                                 OAuth & content publishing
                               </p>
                             </div>
                           </div>
                           <p className="text-sm text-[#4a4a6a]">
                             Connect to Shopify stores and publish content directly via OAuth integration.
                           </p>
                         </CardContent>
                       </Card>
                     )} */}

                                         {/* Brand Dashboard Card - Available for all users with brands except superusers */}
                     {userBrands.length > 0 && !isSuperuser() && (
                       <Card
                         className="cursor-pointer card-hover border-0.3 border-[#b0b0d8] bg-white animate-in slide-in-from-bottom-2 duration-500 ease-out delay-400"
                         onClick={() => navigateToSection('brand-dashboard', null)}
                       >
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-[#7765e3] rounded-lg flex items-center justify-center">
                              <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-[#000000]">
                                Brand Dashboard
                              </h3>
                              <p className="text-sm text-[#4a4a6a]">
                                Brand analysis & insights
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-[#4a4a6a]">
                            View your complete brand analysis, AI responses, and Share of Voice metrics.
                          </p>
                        </CardContent>
                      </Card>
                    )}


                  </div>

                  {/* Analyze Link Form - Only for superusers */}
                  {isUserSuperuser && showAnalyzeLink && (
                    <Card className="border-0.3 border-[#b0b0d8] bg-white">
                      <CardHeader>
                        <CardTitle className="text-[#4a4a6a]">Quick Link Analysis</CardTitle>
                        <CardDescription className="text-[#4a4a6a]">
                          Enter a URL to get instant SEO insights
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleDomainAnalysisSubmit} className="space-y-4">
                          <div className="flex space-x-2">
                            <Input
                              type="url"
                              placeholder="https://example.com"
                              value={domainToAnalyze}
                              onChange={(e) => setDomainToAnalyze(e.target.value)}
                              className="flex-1 border-[#b0b0d8] focus:border-[#6658f4]"
                            />
                            <Button type="submit" className="gradient-primary">Analyze</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  <div className="flex space-x-4">
                    {isUserSuperuser && (
                      <Button
                        variant="outline"
                        onClick={() => setShowAnalyzeLink(!showAnalyzeLink)}
                        className="flex items-center space-x-2 border-[#b0b0d8] text-[#4a4a6a] hover:bg-white hover:border-[#6658f4]"
                      >
                        <LinkIcon className="w-4 h-4" />
                        <span>Quick Link Analysis</span>
                      </Button>
                    )}
                  </div>
                </>
              )}

                             {activeTool && renderInlineTool()}
             </div>
           )}

           {activeSection === 'brand-dashboard' && (
             <div className="space-y-6">

               {/* Content Calendar CTA */}
               <Card className="border-0 bg-gradient-to-r from-[#6658f4] to-[#8b7ff5] text-white shadow-lg overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                 <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
                 <CardContent className="p-6 relative z-10">
                   <div className="flex items-center justify-between flex-wrap gap-4">
                     <div className="flex items-start space-x-4">
                       <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                         <Calendar className="w-6 h-6 text-white" />
                       </div>
                       <div>
                         <h3 className="text-xl font-semibold mb-2 flex items-center space-x-2">
                           <span>🚀 Ready to Publish?</span>
                         </h3>
                         <p className="text-white/90 text-sm mb-1">
                           {contentCalendarData && contentCalendarData.length > 0 ? (
                             <>
                               Your AI-generated content is waiting!
                               <strong className="ml-1">
                                 {contentCalendarData.filter(item => item.status === 'approved').length > 0
                                   ? `${contentCalendarData.filter(item => item.status === 'approved').length} pieces ready to publish`
                                   : `${contentCalendarData.filter(item => item.status === 'draft').length} drafts ready for review`
                                 }
                               </strong>
                             </>
                           ) : (
                             'Get AI-powered content created and published from your content calendar'
                           )}
                         </p>
                       </div>
                     </div>
                     <Button
                       onClick={() => navigateToSection('dashboard', 'content-calendar')}
                       className="bg-white text-[#6658f4] hover:bg-white/90 font-semibold shadow-md transition-all hover:scale-105"
                     >
                       Go to Content Calendar
                       <ArrowRight className="w-4 h-4 ml-2" />
                     </Button>
                   </div>
                 </CardContent>
               </Card>

               {/* Direct Domain Analysis Integration */}
               <DomainAnalysis
                 initialDomain={userBrands.length > 0 ? userBrands[0].domain : ""}
                 onClose={() => navigateToSection('dashboard', null)}
               />
             </div>
           )}

           

           {activeSection === 'history' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-[#4a4a6a] mb-2">Analysis History</h2>
                <p className="text-[#4a4a6a]">View your previous domain and blog analyses</p>
              </div>
              {/* History content would go here */}
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-6">
              <Tabs defaultValue="account" onValueChange={(value) => setActiveSettingsTab(value)}>
                <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent p-0 h-auto rounded-none">
                  <TabsTrigger
                    value="account"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6658f4] data-[state=active]:text-[#6658f4] data-[state=active]:bg-transparent px-4 py-3"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Account
                  </TabsTrigger>
                  <TabsTrigger
                    value="brand"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6658f4] data-[state=active]:text-[#6658f4] data-[state=active]:bg-transparent px-4 py-3"
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Brand & Content
                  </TabsTrigger>
                  <TabsTrigger
                    value="integrations"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6658f4] data-[state=active]:text-[#6658f4] data-[state=active]:bg-transparent px-4 py-3"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Integrations
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#6658f4] data-[state=active]:text-[#6658f4] data-[state=active]:bg-transparent px-4 py-3"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payment
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="mt-6 space-y-6">
                  {/* Profile Settings */}
                  <Card className="border-0.3 border-[#b0b0d8] bg-white">
                    <CardHeader>
                      <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
                        <User className="w-5 h-5 text-[#6658f4]" />
                        <span>Profile Settings</span>
                      </CardTitle>
                      <CardDescription className="text-[#4a4a6a]">
                        Update your personal information and account details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-[#4a4a6a]">Full Name</Label>
                          <Input
                            id="fullName"
                            placeholder="Enter your full name"
                            className="border-[#b0b0d8] focus:border-[#6658f4]"
                            value={accountSettings.fullName || userName}
                            onChange={(e) => setAccountSettings({ ...accountSettings, fullName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-[#4a4a6a]">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            className="border-[#b0b0d8] focus:border-[#6658f4]"
                            value={accountSettings.email}
                            onChange={(e) => setAccountSettings({ ...accountSettings, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company" className="text-[#4a4a6a]">Company</Label>
                          <Input
                            id="company"
                            placeholder="Your company name"
                            className="border-[#b0b0d8] focus:border-[#6658f4]"
                            value={accountSettings.company}
                            onChange={(e) => setAccountSettings({ ...accountSettings, company: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role" className="text-[#4a4a6a]">Role</Label>
                          <Input
                            id="role"
                            placeholder="Your job title"
                            className="border-[#b0b0d8] focus:border-[#6658f4]"
                            value={accountSettings.role}
                            onChange={(e) => setAccountSettings({ ...accountSettings, role: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-2 text-white">
                        <Button
                          onClick={handleSaveAccountSettings}
                          disabled={isSavingAccount}
                          className="gradient-primary"
                        >
                          {isSavingAccount ? 'Saving...' : 'Save Profile'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notification Settings */}
                  <Card className="border-0.3 border-[#b0b0d8] bg-white">
                    <CardHeader>
                      <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-[#6658f4]" />
                        <span>Notification Preferences</span>
                      </CardTitle>
                      <CardDescription className="text-[#4a4a6a]">
                        Choose how and when you want to be notified
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div className="flex-1">
                            <Label htmlFor="notif-analysis" className="text-sm font-medium text-[#4a4a6a]">
                              Analysis Completion
                            </Label>
                            <p className="text-xs text-gray-500 mt-1">Get notified when analysis is ready</p>
                          </div>
                          <Switch
                            id="notif-analysis"
                            checked={accountSettings.notifications.analysisCompletion}
                            onCheckedChange={(checked) =>
                              setAccountSettings({
                                ...accountSettings,
                                notifications: { ...accountSettings.notifications, analysisCompletion: checked }
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div className="flex-1">
                            <Label htmlFor="notif-weekly" className="text-sm font-medium text-[#4a4a6a]">
                              Weekly Reports
                            </Label>
                            <p className="text-xs text-gray-500 mt-1">Receive weekly analysis summaries</p>
                          </div>
                          <Switch
                            id="notif-weekly"
                            checked={accountSettings.notifications.weeklyReports}
                            onCheckedChange={(checked) =>
                              setAccountSettings({
                                ...accountSettings,
                                notifications: { ...accountSettings.notifications, weeklyReports: checked }
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div className="flex-1">
                            <Label htmlFor="notif-calendar" className="text-sm font-medium text-[#4a4a6a]">
                              Content Calendar Reminders
                            </Label>
                            <p className="text-xs text-gray-500 mt-1">Get reminded about content deadlines</p>
                          </div>
                          <Switch
                            id="notif-calendar"
                            checked={accountSettings.notifications.contentCalendarReminders}
                            onCheckedChange={(checked) =>
                              setAccountSettings({
                                ...accountSettings,
                                notifications: { ...accountSettings.notifications, contentCalendarReminders: checked }
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div className="flex-1">
                            <Label htmlFor="notif-competitor" className="text-sm font-medium text-[#4a4a6a]">
                              Competitor Alerts
                            </Label>
                            <p className="text-xs text-gray-500 mt-1">Notify when competitors make changes</p>
                          </div>
                          <Switch
                            id="notif-competitor"
                            checked={accountSettings.notifications.competitorAlerts}
                            onCheckedChange={(checked) =>
                              setAccountSettings({
                                ...accountSettings,
                                notifications: { ...accountSettings.notifications, competitorAlerts: checked }
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-4 text-white">
                        <Button
                          onClick={handleSaveAccountSettings}
                          disabled={isSavingAccount}
                          className="gradient-primary"
                        >
                          {isSavingAccount ? 'Saving...' : 'Save Notifications'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="brand" className="mt-6 space-y-6">
                  {/* Brand Settings */}
                  <Card className="border-0.3 border-[#b0b0d8] bg-white">
                    <CardHeader>
                      <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
                        <Palette className="w-5 h-5 text-[#6658f4]" />
                        <span>Brand Settings</span>
                      </CardTitle>
                     
                    </CardHeader>
                    <CardContent>
                      <BrandSettings />
                    </CardContent>
                  </Card>

                  {/* Analysis Preferences */}
                  <Card className="border-0.3 border-[#b0b0d8] bg-white">
                    <CardHeader>
                      <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
                        <Sliders className="w-5 h-5 text-[#6658f4]" />
                        <span>Analysis Preferences</span>
                      </CardTitle>
                      
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="analysis-depth" className="text-[#4a4a6a]">
                            Default Analysis Depth
                          </Label>
                          <Select
                            id="analysis-depth"
                            value={analysisPreferences.analysisDepth}
                            onChange={(e) =>
                              setAnalysisPreferences({ ...analysisPreferences, analysisDepth: e.target.value })
                            }
                            className="border-[#b0b0d8] focus:border-[#6658f4]"
                          >
                            <option value="basic">Basic Analysis</option>
                            <option value="standard">Standard Analysis</option>
                            <option value="comprehensive">Comprehensive Analysis</option>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="blog-scoring" className="text-[#4a4a6a]">
                            Blog Scoring Threshold
                          </Label>
                          <Select
                            id="blog-scoring"
                            value={analysisPreferences.blogScoringThreshold}
                            onChange={(e) =>
                              setAnalysisPreferences({ ...analysisPreferences, blogScoringThreshold: e.target.value })
                            }
                            className="border-[#b0b0d8] focus:border-[#6658f4]"
                          >
                            <option value="70">70% (Strict)</option>
                            <option value="60">60% (Standard)</option>
                            <option value="50">50% (Lenient)</option>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="calendar-planning" className="text-[#4a4a6a]">
                            Content Calendar Planning
                          </Label>
                          <Select
                            id="calendar-planning"
                            value={analysisPreferences.contentCalendarPlanning}
                            onChange={(e) =>
                              setAnalysisPreferences({ ...analysisPreferences, contentCalendarPlanning: e.target.value })
                            }
                            className="border-[#b0b0d8] focus:border-[#6658f4]"
                          >
                            <option value="30">30 Days</option>
                            <option value="60">60 Days</option>
                            <option value="90">90 Days</option>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="data-retention" className="text-[#4a4a6a]">
                            Data Retention
                          </Label>
                          <Select
                            id="data-retention"
                            value={analysisPreferences.dataRetention}
                            onChange={(e) =>
                              setAnalysisPreferences({ ...analysisPreferences, dataRetention: e.target.value })
                            }
                            className="border-[#b0b0d8] focus:border-[#6658f4]"
                          >
                            <option value="3-months">3 Months</option>
                            <option value="6-months">6 Months</option>
                            <option value="1-year">1 Year</option>
                            <option value="forever">Forever</option>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2 text-white">
                        <Button
                          onClick={handleSaveAnalysisPreferences}
                          disabled={isSavingPreferences}
                          className="gradient-primary"
                        >
                          {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="integrations" className="mt-6 space-y-6">
                  {/* CMS Integration Hub */}
                  <Card className="border-0.3 border-[#b0b0d8] bg-white">
                    <CardHeader>
                      <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
                        <Building2 className="w-5 h-5 text-[#6658f4]" />
                        <span>CMS Integrations</span>
                      </CardTitle>
                   
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-wrap gap-3">
                        {cmsConnectionStatus.shopify === 'connected' ? (
                          <Button
                            variant="outline"
                            className="border-green-300 bg-green-50 text-green-700 cursor-default"
                            disabled
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Shopify Connected
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleDirectCmsConnect('shopify')}
                            variant="outline"
                            className="border-[#b0b0d8] hover:border-[#6658f4] text-[#4a4a6a]"
                          >
                            <Building2 className="w-4 h-4 mr-2" />
                            Connect Shopify
                          </Button>
                        )}

                        {cmsConnectionStatus.webflow === 'connected' ? (
                          <Button
                            variant="outline"
                            className="border-green-300 bg-green-50 text-green-700 cursor-default"
                            disabled
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Webflow Connected
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleDirectCmsConnect('webflow')}
                            variant="outline"
                            className="border-[#b0b0d8] hover:border-[#6658f4] text-[#4a4a6a]"
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            Connect Webflow
                          </Button>
                        )}

                        {cmsConnectionStatus.wordpress === 'connected' ? (
                          <Button
                            variant="outline"
                            className="border-green-300 bg-green-50 text-green-700 cursor-default"
                            disabled
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            WordPress Connected
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleDirectCmsConnect('wordpress')}
                            variant="outline"
                            className="border-[#b0b0d8] hover:border-[#6658f4] text-[#4a4a6a]"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Connect WordPress
                          </Button>
                        )}
                      </div>

                          {/* Advanced CMS Configuration - Collapsible */}
                          <div className="pt-4">
                            <button
                              onClick={() => setShowCMSAdvanced(!showCMSAdvanced)}
                              className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center space-x-2">
                                <Sliders className="w-4 h-4 text-[#6658f4]" />
                                <span className="font-medium text-[#4a4a6a]">Advanced CMS Configuration</span>
                              </div>
                              {showCMSAdvanced ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                            </button>

                            {showCMSAdvanced && (
                              <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white space-y-6">
                                {/* Shopify Integration */}
                                <div>
                                  <h4 className="text-md font-semibold text-[#4a4a6a] mb-3 flex items-center space-x-2">
                                    <Building2 className="w-4 h-4 text-green-600" />
                                    <span>Shopify Settings</span>
                                  </h4>
                                  <ShopifySettings onConnectionChange={handleConnectionChange} />
                                </div>

                                {/* Webflow Integration */}
                                <div className="border-t border-gray-200 pt-6">
                                  <h4 className="text-md font-semibold text-[#4a4a6a] mb-3 flex items-center space-x-2">
                                    <Globe className="w-4 h-4 text-blue-600" />
                                    <span>Webflow Settings</span>
                                  </h4>
                                  <WebflowSettings onConnectionChange={handleConnectionChange} />
                                </div>

                                {/* WordPress Integration */}
                                <div className="border-t border-gray-200 pt-6">
                                  <h4 className="text-md font-semibold text-[#4a4a6a] mb-3 flex items-center space-x-2">
                                    <FileText className="w-4 h-4 text-purple-600" />
                                    <span>WordPress Settings</span>
                                  </h4>
                                  <WordPressSettings onConnectionChange={handleConnectionChange} />
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                </TabsContent>

                <TabsContent value="payment" className="mt-6 space-y-6">
                  {/* Payment & Billing */}
                  <Card className="border-0.3 border-[#b0b0d8] bg-white">
                    <CardHeader>
                      <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
                        <CreditCard className="w-5 h-5 text-[#6658f4]" />
                        <span>Payment & Billing</span>
                      </CardTitle>
                     
                    </CardHeader>
                    <CardContent>
                      <StripePaymentSettings />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Dashboard;