import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  BarChart3, 
  Globe, 
  FileText, 
  Settings, 
  LogOut, 
  Link as LinkIcon,
  Activity,
  Calendar,
  Building2,
  Crown,
  ArrowLeft,
  History,
  Download
} from 'lucide-react';

import SuperUserDomainAnalysis from '../components/SuperUserDomainAnalysis';
import { apiService } from '../utils/api';
import { getUserName, isSuperuser } from '../utils/auth';

const SuperUserAnalysisPage = () => {
  const navigate = useNavigate();
  const { brandId } = useParams(); // Get brandId from URL if viewing specific analysis
  const [userName, setUserName] = useState(getUserName());
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [viewingAnalysis, setViewingAnalysis] = useState(null);

  // Redirect non-super users
  useEffect(() => {
    if (!isSuperuser()) {
      console.log('❌ Access denied - redirecting non-super user');
      navigate('/dashboard');
      return;
    }
    
    // Load super user analysis history
    loadAnalysisHistory();

    // If brandId is provided, load specific analysis
    if (brandId) {
      loadSpecificAnalysis(brandId);
    }
  }, [navigate, brandId]);

  const loadAnalysisHistory = async () => {
    try {
      // Get super user analysis history from backend
      const response = await apiService.get('/api/v1/brand/super-user/history');
      setAnalysisHistory(response.data.analyses || []);
    } catch (error) {
      console.log('No analysis history found or error loading:', error);
      setAnalysisHistory([]);
    }
  };

  const loadSpecificAnalysis = async (brandId) => {
    try {
      console.log('🔍 Loading specific analysis for brandId:', brandId);
      const response = await apiService.get(`/api/v1/brand/analysis/${brandId}`);
      if (response.data.success) {
        setViewingAnalysis(response.data);
        console.log('✅ Loaded analysis:', response.data.brand);
      }
    } catch (error) {
      console.error('❌ Error loading specific analysis:', error);
      // If can't load specific analysis, redirect to main super user page
      navigate('/super-user-analysis');
    }
  };

  const handleLogout = () => {
    console.log('🚪 SuperUser Page: MINIMAL LOGOUT');
    localStorage.removeItem('auth');
    window.location.href = '/login';
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-[#ffffff] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#ffffff]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#4a4a6a]">Super User</h2>
              <p className="text-sm text-[#4a4a6a]">{userName}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={handleBack}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium bg-[#6658f4] text-white shadow-md">
            <Globe className="w-4 h-4" />
            <span>Domain Analysis</span>
          </div>

          <button
            onClick={() => navigate('/super-user-history')}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-[#4a4a6a] hover:text-[#6658f4] hover:bg-gray-100 hover:border-l-3 hover:border-l-[#6658f4]/20"
          >
            <History className="w-4 h-4" />
            <span>Analysis History</span>
            {analysisHistory.length > 0 && (
              <span className="ml-auto bg-[#6658f4] text-white text-xs px-2 py-0.5 rounded-full">
                {analysisHistory.length}
              </span>
            )}
          </button>
        </nav>

        {/* Logout */}
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
        <header className="bg-white border-b border-[#ffffff] px-8 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#4a4a6a]">Domain Analysis</h1>
                <p className="text-sm text-[#4a4a6a]">Analyze any domain and get comprehensive brand intelligence</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto px-8 py-6">
          {viewingAnalysis ? (
            <div className="space-y-6">
              {/* Back button */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-[#4a4a6a]">Viewing Analysis: {viewingAnalysis.brand}</h3>
                  <p className="text-sm text-[#4a4a6a]">Domain: {viewingAnalysis.domain}</p>
                </div>
                <Button
                  onClick={() => {
                    setViewingAnalysis(null);
                    navigate('/super-user-analysis');
                  }}
                  variant="outline"
                  className="border-[#b0b0d8] text-[#4a4a6a] hover:bg-[#d5d6eb]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Analysis
                </Button>
              </div>
              
              {/* Analysis results display */}
              <div className="bg-white border border-[#b0b0d8] rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">Analysis Results</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#6658f4]">{Math.round(viewingAnalysis.aiVisibilityScore || 0)}%</div>
                    <div className="text-sm text-[#4a4a6a]">AI Visibility</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#6658f4]">{Math.round(viewingAnalysis.brandShare || 0)}%</div>
                    <div className="text-sm text-[#4a4a6a]">Brand Share</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#6658f4]">{viewingAnalysis.totalMentions || 0}</div>
                    <div className="text-sm text-[#4a4a6a]">Total Mentions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#6658f4]">{viewingAnalysis.competitors?.length || 0}</div>
                    <div className="text-sm text-[#4a4a6a]">Competitors</div>
                  </div>
                </div>
                
                {/* PDF Download button */}
                <div className="mt-6 text-center">
                  <Button
                    onClick={() => window.open(`/api/v1/brand/${brandId}/download-pdf`, '_blank')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF Report
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <SuperUserDomainAnalysis onAnalysisComplete={loadAnalysisHistory} />
          )}
        </main>
      </div>
    </div>
  );
};

export default SuperUserAnalysisPage;