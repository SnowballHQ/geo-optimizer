import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
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
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showAnalyzeLink, setShowAnalyzeLink] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // 'domain' | 'blog' | null
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

    // Default message for other sections
    return {
      title: `Welcome back, ${userName}!`,
      subtitle: "Ready to analyze your next project?"
    };
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

  // Handle navigation state from blog editor
  useEffect(() => {
    if (location.state?.showContentCalendar) {
      setIsLoadingContentCalendar(true);
      setActiveTool('content-calendar');
      setActiveSection('dashboard');
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
    const section = urlParams.get('section');
    const focus = urlParams.get('focus');
    
    if (section === 'settings') {
      setActiveSection('settings');
      if (focus === 'cms') {
        setShowCMSSelector(true);
      }
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (section === 'analytics') {
      setActiveSection('dashboard');
      setActiveTool('analytics');
      // Delay URL cleanup to ensure state is set properly
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 100);
    } else if (section === 'content-calendar') {
      setActiveSection('dashboard');
      setActiveTool('content-calendar');
      // Delay URL cleanup to ensure state is set properly
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 100);
    }

    // Handle brand-dashboard redirect from login
    const redirectParam = urlParams.get('redirect');
    if (redirectParam === 'brand-dashboard') {
      setActiveSection('brand-dashboard');
      setActiveTool(null);
      // Clean up the URL parameter
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 100);
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
    setActiveTool('content-calendar');
  };

  const handleLogout = () => {
    apiService.logout();
  };

  const handleDomainAnalysisSubmit = (e) => {
    e.preventDefault();
    if (domainToAnalyze.trim()) {
      setActiveTool('domain');
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
            <Button variant="outline" onClick={() => setActiveTool(null)} className="inline-flex items-center border-[#b0b0d8] text-[#4a4a6a] hover:bg-white hover:border-[#6658f4]">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </div>
          <DomainAnalysis onClose={() => setActiveTool(null)} />
        </div>
      );
    }
    if (activeTool === 'blog') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#4a4a6a]">Blog Analysis</h2>
              <p className="text-[#4a4a6a]">Analyze blog content quality and optimization</p>
            </div>
            <Button variant="outline" onClick={() => setActiveTool(null)} className="inline-flex items-center border-[#b0b0d8] text-[#4a4a6a] hover:bg-white hover:border-[#6658f4]">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </div>
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
            <Card className="border border-[#b0b0d8] bg-white">
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
              onClick={() => { setActiveSection('dashboard'); setActiveTool(null); }}
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
              onClick={() => { setActiveSection('dashboard'); setActiveTool('domain'); }}
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
               onClick={() => { setActiveSection('brand-dashboard'); setActiveTool(null); }}
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
            onClick={() => { setActiveSection('dashboard'); setActiveTool('content-calendar'); }}
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
            onClick={() => { setActiveSection('dashboard'); setActiveTool('published-blogs'); }}
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
            onClick={() => { setActiveSection('dashboard'); setActiveTool('analytics'); }}
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
            onClick={() => { setActiveSection('dashboard'); setActiveTool('blog'); }}
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
            onClick={() => { setActiveSection('settings'); setActiveTool(null); }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeSection === 'settings'
                ? 'nav-active'
                : 'text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>



          {/* Super User Domain Analysis - Only visible to super users */}
          {isUserSuperuser && (
            <button
              onClick={() => navigate('/super-user-analysis')}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
            >
              <Globe className="w-4 h-4" />
              <span>Super User Domain Analysis</span>
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
                        className="cursor-pointer card-hover border border-[#b0b0d8] bg-white animate-in slide-in-from-bottom-2 duration-500 ease-out"
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
                      className="cursor-pointer card-hover border border-[#b0b0d8] bg-white animate-in slide-in-from-bottom-2 duration-500 ease-out delay-100"
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
                       className="cursor-pointer card-hover border border-[#b0b0d8] bg-white animate-in slide-in-from-bottom-2 duration-500 ease-out delay-200"
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
                       className="cursor-pointer card-hover border border-[#b0b0d8] bg-white animate-in slide-in-from-bottom-2 duration-500 ease-out delay-300"
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
                         className="cursor-pointer card-hover border border-[#b0b0d8] bg-white animate-in slide-in-from-bottom-2 duration-500 ease-out delay-300"
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
                         className="cursor-pointer card-hover border border-[#b0b0d8] bg-white animate-in slide-in-from-bottom-2 duration-500 ease-out delay-400"
                         onClick={() => { setActiveSection('brand-dashboard'); setActiveTool(null); }}
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
                    <Card className="border border-[#b0b0d8] bg-white">
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
              
               
               {/* Direct Domain Analysis Integration */}
               <DomainAnalysis
                 initialDomain={userBrands.length > 0 ? userBrands[0].domain : ""}
                 onClose={() => setActiveSection('dashboard')}
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
            

              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveSettingsTab('account')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeSettingsTab === 'account'
                        ? 'border-[#6658f4] text-[#6658f4]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Account</span>
                  </button>
                  <button
                    onClick={() => setActiveSettingsTab('brand')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeSettingsTab === 'brand'
                        ? 'border-[#6658f4] text-[#6658f4]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Palette className="w-4 h-4" />
                    <span>Brand & Content</span>
                  </button>
                  <button
                    onClick={() => setActiveSettingsTab('integrations')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeSettingsTab === 'integrations'
                        ? 'border-[#6658f4] text-[#6658f4]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Integrations</span>
                  </button>
                  <button
                    onClick={() => setActiveSettingsTab('payment')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeSettingsTab === 'payment'
                        ? 'border-[#6658f4] text-[#6658f4]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Payment</span>
                  </button>
                </nav>
              </div>
              
              {/* Account Tab */}
              {activeSettingsTab === 'account' && (
                <div className="space-y-6">
                  {/* Profile Settings */}
                  <Card className="border border-[#b0b0d8] bg-white">
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
                        <div>
                          <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Full Name</label>
                          <Input
                            placeholder="Enter your full name"
                            className="border-[#b0b0d8] focus:border-[#6658f4]"
                            defaultValue={userName}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Email</label>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            className="border-[#b0b0d8] focus:border-[#6658f4]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Company</label>
                          <Input
                            placeholder="Your company name"
                            className="border-[#b0b0d8] focus:border-[#6658f4]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Role</label>
                          <Input
                            placeholder="Your job title"
                            className="border-[#b0b0d8] focus:border-[#6658f4]"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button className="gradient-primary">Save Profile</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notification Settings */}
                  <Card className="border border-[#b0b0d8] bg-white">
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
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <label className="text-sm font-medium text-[#4a4a6a]">Analysis Completion</label>
                            <p className="text-xs text-gray-500">Get notified when analysis is ready</p>
                          </div>
                          <input type="checkbox" className="w-4 h-4 text-[#6658f4] border-[#b0b0d8] rounded focus:ring-[#6658f4]" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <label className="text-sm font-medium text-[#4a4a6a]">Weekly Reports</label>
                            <p className="text-xs text-gray-500">Receive weekly analysis summaries</p>
                          </div>
                          <input type="checkbox" className="w-4 h-4 text-[#6658f4] border-[#b0b0d8] rounded focus:ring-[#6658f4]" />
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <label className="text-sm font-medium text-[#4a4a6a]">Content Calendar Reminders</label>
                            <p className="text-xs text-gray-500">Get reminded about content deadlines</p>
                          </div>
                          <input type="checkbox" className="w-4 h-4 text-[#6658f4] border-[#b0b0d8] rounded focus:ring-[#6658f4]" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <label className="text-sm font-medium text-[#4a4a6a]">Competitor Alerts</label>
                            <p className="text-xs text-gray-500">Notify when competitors make changes</p>
                          </div>
                          <input type="checkbox" className="w-4 h-4 text-[#6658f4] border-[#b0b0d8] rounded focus:ring-[#6658f4]" />
                        </div>
                      </div>
                      <div className="flex justify-end pt-4">
                        <Button className="gradient-primary">Save Notifications</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Brand & Content Tab */}
              {activeSettingsTab === 'brand' && (
                <div className="space-y-6">
                  {/* Brand Settings */}
                  <Card className="border border-[#b0b0d8] bg-white">
                    <CardHeader>
                      <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
                        <Palette className="w-5 h-5 text-[#6658f4]" />
                        <span>Brand Settings</span>
                      </CardTitle>
                      <CardDescription className="text-[#4a4a6a]">
                        Customize your brand's voice and information for personalized AI responses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BrandSettings />
                    </CardContent>
                  </Card>

                  {/* Analysis Preferences */}
                  <Card className="border border-[#b0b0d8] bg-white">
                    <CardHeader>
                      <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
                        <Sliders className="w-5 h-5 text-[#6658f4]" />
                        <span>Analysis Preferences</span>
                      </CardTitle>
                      <CardDescription className="text-[#4a4a6a]">
                        Configure default settings for your analysis tools
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Default Analysis Depth</label>
                          <select className="w-full px-3 py-2 border border-[#b0b0d8] rounded-md focus:border-[#6658f4] focus:outline-none">
                            <option>Basic Analysis</option>
                            <option>Standard Analysis</option>
                            <option>Comprehensive Analysis</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Blog Scoring Threshold</label>
                          <select className="w-full px-3 py-2 border border-[#b0b0d8] rounded-md focus:border-[#6658f4] focus:outline-none">
                            <option>70% (Strict)</option>
                            <option>60% (Standard)</option>
                            <option>50% (Lenient)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Content Calendar Planning</label>
                          <select className="w-full px-3 py-2 border border-[#b0b0d8] rounded-md focus:border-[#6658f4] focus:outline-none">
                            <option>30 Days</option>
                            <option>60 Days</option>
                            <option>90 Days</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Data Retention</label>
                          <select className="w-full px-3 py-2 border border-[#b0b0d8] rounded-md focus:border-[#6658f4] focus:outline-none">
                            <option>3 Months</option>
                            <option>6 Months</option>
                            <option>1 Year</option>
                            <option>Forever</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button className="gradient-primary">Save Preferences</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Integrations Tab */}
              {activeSettingsTab === 'integrations' && (
                <div className="space-y-6">
                  {showCMSSelector ? (
                    <CMSConnectionSelector
                      onClose={() => setShowCMSSelector(false)}
                      focus={cmsFocus}
                    />
                  ) : (
                    <>
                      {/* CMS Integration Hub */}
                      <Card className="border border-[#b0b0d8] bg-white">
                        <CardHeader>
                          <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
                            <Building2 className="w-5 h-5 text-[#6658f4]" />
                            <span>CMS Integrations</span>
                          </CardTitle>
                          <CardDescription className="text-[#4a4a6a]">
                            Connect and configure your content management platforms
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="flex flex-wrap gap-3">
                            <Button
                              onClick={() => {
                                setCmsFocus('shopify');
                                setShowCMSSelector(true);
                              }}
                              variant="outline"
                              className="border-[#b0b0d8] hover:border-[#6658f4] text-[#4a4a6a]"
                            >
                              <Building2 className="w-4 h-4 mr-2" />
                              Connect Shopify
                            </Button>
                            <Button
                              onClick={() => {
                                setCmsFocus('webflow');
                                setShowCMSSelector(true);
                              }}
                              variant="outline"
                              className="border-[#b0b0d8] hover:border-[#6658f4] text-[#4a4a6a]"
                            >
                              <Globe className="w-4 h-4 mr-2" />
                              Connect Webflow
                            </Button>
                            <Button
                              onClick={() => {
                                setCmsFocus('wordpress');
                                setShowCMSSelector(true);
                              }}
                              variant="outline"
                              className="border-[#b0b0d8] hover:border-[#6658f4] text-[#4a4a6a]"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Connect WordPress
                            </Button>
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
                                  <ShopifySettings />
                                </div>

                                {/* Webflow Integration */}
                                <div className="border-t border-gray-200 pt-6">
                                  <h4 className="text-md font-semibold text-[#4a4a6a] mb-3 flex items-center space-x-2">
                                    <Globe className="w-4 h-4 text-blue-600" />
                                    <span>Webflow Settings</span>
                                  </h4>
                                  <WebflowSettings />
                                </div>

                                {/* WordPress Integration */}
                                <div className="border-t border-gray-200 pt-6">
                                  <h4 className="text-md font-semibold text-[#4a4a6a] mb-3 flex items-center space-x-2">
                                    <FileText className="w-4 h-4 text-purple-600" />
                                    <span>WordPress Settings</span>
                                  </h4>
                                  <WordPressSettings />
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              )}



              {/* Payment Tab */}
              {activeSettingsTab === 'payment' && (
                <div className="space-y-6">
                  {/* Payment & Billing */}
                  <Card className="border border-[#b0b0d8] bg-white">
                    <CardHeader>
                      <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
                        <CreditCard className="w-5 h-5 text-[#6658f4]" />
                        <span>Payment & Billing</span>
                      </CardTitle>
                      <CardDescription className="text-[#4a4a6a]">
                        Manage your subscription and billing information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StripePaymentSettings />
                    </CardContent>
                  </Card>
                </div>
              )}

            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Dashboard;