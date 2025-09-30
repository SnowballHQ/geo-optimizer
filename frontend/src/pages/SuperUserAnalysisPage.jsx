import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
  Download,
  TrendingUp,
  Users,
  Target,
  Award
} from 'lucide-react';

import SuperUserDomainAnalysisFlow from '../components/SuperUserDomainAnalysisFlow';
import { apiService } from '../utils/api';
import { getUserName, isSuperuser } from '../utils/auth';

const SuperUserAnalysisPage = () => {
  const navigate = useNavigate();
  const { brandId, analysisId } = useParams(); // Get brandId or analysisId from URL if viewing specific analysis
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

    // If brandId is provided, load specific analysis (old route)
    if (brandId) {
      loadSpecificAnalysis(brandId);
    }
    
    // If analysisId is provided, load specific super user analysis (new isolated route)
    if (analysisId) {
      loadSpecificSuperUserAnalysis(analysisId);
    }
  }, [navigate, brandId, analysisId]);

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

  const loadSpecificSuperUserAnalysis = async (analysisId) => {
    try {
      console.log('🔍 Loading specific super user analysis for analysisId:', analysisId);
      const response = await apiService.get(`/api/v1/super-user/analysis/${analysisId}`);
      if (response.data.success) {
        setViewingAnalysis(response.data.analysis);
        console.log('✅ Loaded super user analysis:', response.data.analysis.domain);
      }
    } catch (error) {
      console.error('❌ Error loading specific super user analysis:', error);
      // If can't load specific analysis, redirect to main super user page
      navigate('/super-user-analysis');
    }
  };

  const handleLogout = () => {
    apiService.logout();
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
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f8f9ff] to-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-[#ffffff] flex flex-col">
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
        <header className="bg-gray-50 border-b border-[#ffffff] px-8 py-4 flex-shrink-0">
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
        <main className="flex-1 overflow-auto px-8 py-6 bg-white">
          {viewingAnalysis ? (
            <div className="space-y-6">
              {/* Header Card */}
              <Card className="border-0.3 border-[#b0b0d8] bg-gradient-to-r from-[#6658f4] to-[#8b7ff5] text-white shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-xl font-semibold">{viewingAnalysis.brand || viewingAnalysis.brandName}</h3>
                          <Badge className="bg-green-500 text-white border-0">
                            Completed
                          </Badge>
                        </div>
                        <p className="text-white/90 text-sm flex items-center space-x-2">
                          <Globe className="w-4 h-4" />
                          <span>{viewingAnalysis.domain}</span>
                        </p>
                        {viewingAnalysis.analysisId && (
                          <p className="text-white/70 text-xs mt-1">Analysis ID: {viewingAnalysis.analysisId}</p>
                        )}
                        {viewingAnalysis.createdAt && (
                          <p className="text-white/70 text-xs mt-1 flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(viewingAnalysis.createdAt)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setViewingAnalysis(null);
                        navigate('/super-user-analysis');
                      }}
                      className="bg-white text-[#6658f4] hover:bg-white/90 font-semibold shadow-md transition-all hover:scale-105"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* AI Visibility Card */}
                <Card className="border-0.3 border-[#b0b0d8] bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#6658f4] to-[#8b7ff5] rounded-lg flex items-center justify-center shadow-md">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#4a4a6a] mb-1">AI Visibility</p>
                        <div className="flex items-baseline space-x-2">
                          <p className="text-3xl font-bold text-[#6658f4]">
                            {Math.round(viewingAnalysis.analysisResults?.aiVisibilityScore || viewingAnalysis.aiVisibilityScore || 0)}%
                          </p>
                          <Badge className={
                            (viewingAnalysis.analysisResults?.aiVisibilityScore || viewingAnalysis.aiVisibilityScore || 0) >= 80
                              ? "bg-green-100 text-green-800 border-0"
                              : (viewingAnalysis.analysisResults?.aiVisibilityScore || viewingAnalysis.aiVisibilityScore || 0) >= 60
                              ? "bg-yellow-100 text-yellow-800 border-0"
                              : "bg-red-100 text-red-800 border-0"
                          }>
                            {(viewingAnalysis.analysisResults?.aiVisibilityScore || viewingAnalysis.aiVisibilityScore || 0) >= 80 ? "High" :
                             (viewingAnalysis.analysisResults?.aiVisibilityScore || viewingAnalysis.aiVisibilityScore || 0) >= 60 ? "Medium" : "Low"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Brand Share Card */}
                <Card className="border-0.3 border-[#b0b0d8] bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#34d399] to-[#10b981] rounded-lg flex items-center justify-center shadow-md">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#4a4a6a] mb-1">Brand Share</p>
                        <div className="flex items-baseline space-x-2">
                          <p className="text-3xl font-bold text-[#34d399]">
                            {Math.round(viewingAnalysis.analysisResults?.brandShare || viewingAnalysis.brandShare || 0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Mentions Card */}
                <Card className="border-0.3 border-[#b0b0d8] bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-lg flex items-center justify-center shadow-md">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#4a4a6a] mb-1">Total Mentions</p>
                        <p className="text-3xl font-bold text-[#f59e0b]">
                          {viewingAnalysis.analysisResults?.totalMentions || viewingAnalysis.totalMentions || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Competitors Card */}
                <Card className="border-0.3 border-[#b0b0d8] bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#ef4444] to-[#dc2626] rounded-lg flex items-center justify-center shadow-md">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#4a4a6a] mb-1">Competitors</p>
                        <p className="text-3xl font-bold text-[#ef4444]">
                          {viewingAnalysis.analysisResults?.competitors?.length || viewingAnalysis.competitors?.length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* PDF Download Card */}
              <Card className="border-0.3 border-[#b0b0d8] bg-white">
                <CardHeader>
                  <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
                    <Download className="w-5 h-5 text-[#6658f4]" />
                    <span>Export Report</span>
                  </CardTitle>
                  <CardDescription>Download the complete analysis report as PDF</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => {
                      const pdfBrandId = viewingAnalysis.analysisResults?.brandId || brandId;
                      if (pdfBrandId) {
                        window.open(`/api/v1/brand/${pdfBrandId}/download-pdf`, '_blank');
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
                    disabled={!viewingAnalysis.analysisResults?.brandId && !brandId}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <SuperUserDomainAnalysisFlow onAnalysisComplete={loadAnalysisHistory} />
          )}
        </main>
      </div>
    </div>
  );
};

export default SuperUserAnalysisPage;