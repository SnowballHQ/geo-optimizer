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
  Sparkles,
  ArrowLeft,
  History,
  Download,
  TrendingUp,
  Users,
  Target,
  Award,
  Plus,
  Clock,
  Zap,
  Brain,
  ChevronRight
} from 'lucide-react';

import SuperUserDomainAnalysisFlow from '../components/SuperUserDomainAnalysisFlow';
import { apiService } from '../utils/api';
import { getUserName, isSuperuser } from '../utils/auth';

const SuperUserAnalysisPage = () => {
  const navigate = useNavigate();
  const { brandId, analysisId } = useParams();
  const [userName, setUserName] = useState(getUserName());
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [viewingAnalysis, setViewingAnalysis] = useState(null);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);

  // Redirect non-super users
  useEffect(() => {
    if (!isSuperuser()) {
      console.log('❌ Access denied - redirecting non-super user');
      navigate('/dashboard');
      return;
    }

    loadAnalysisHistory();

    if (brandId) {
      loadSpecificAnalysis(brandId);
    }

    if (analysisId) {
      loadSpecificSuperUserAnalysis(analysisId);
    }
  }, [navigate, brandId, analysisId]);

  const loadAnalysisHistory = async () => {
    try {
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
      navigate('/playground');
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
      navigate('/playground');
    }
  };

  const handleLogout = () => {
    apiService.logout();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleStartNewAnalysis = () => {
    setShowAnalysisForm(true);
    setViewingAnalysis(null);
  };

  // Empty state component
  const EmptyState = () => (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center max-w-2xl px-6">
        {/* Hero Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-3xl"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome to Playground
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Analyze any brand with AI-powered insights and competitive intelligence
        </p>

        {/* Primary CTA */}
        <Button
          onClick={handleStartNewAnalysis}
          size="lg"
          className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Start New Analysis
        </Button>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <Card className="border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-600">
                Advanced AI analysis for deep brand insights
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Competitor Intel</h3>
              <p className="text-sm text-gray-600">
                Comprehensive competitive landscape analysis
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fast Results</h3>
              <p className="text-sm text-gray-600">
                Get actionable insights in minutes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Analyses Link */}
        {analysisHistory.length > 0 && (
          <div className="mt-8">
            <Button
              onClick={() => navigate('/playground/history')}
              variant="ghost"
              className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
            >
              View Recent Analyses ({analysisHistory.length})
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Logo & Nav */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Playground</span>
              </div>

              <div className="hidden md:flex items-center space-x-1">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/playground/history')}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                  {analysisHistory.length > 0 && (
                    <Badge className="ml-2 bg-primary-100 text-primary-700 border-0 text-xs">
                      {analysisHistory.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Right - User Menu */}
            <div className="flex items-center space-x-4">
              {!showAnalysisForm && !viewingAnalysis && (
                <Button
                  onClick={handleStartNewAnalysis}
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Analysis
                </Button>
              )}

              <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-50">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {userName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {userName}
                </span>
              </div>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {viewingAnalysis ? (
          // Viewing specific analysis results
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="space-y-6">
              {/* Header Card */}
              <Card className="border-gray-200 bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
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
                        {viewingAnalysis.createdAt && (
                          <p className="text-white/70 text-xs mt-1 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(viewingAnalysis.createdAt)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setViewingAnalysis(null);
                        navigate('/playground');
                      }}
                      className="bg-white text-primary-600 hover:bg-white/90 font-semibold"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-gray-200 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">AI Visibility</p>
                        <div className="flex items-baseline space-x-2">
                          <p className="text-3xl font-bold text-gray-900">
                            {Math.round(viewingAnalysis.analysisResults?.aiVisibilityScore || viewingAnalysis.aiVisibilityScore || 0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">Brand Share</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {Math.round(viewingAnalysis.analysisResults?.brandShare || viewingAnalysis.brandShare || 0)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">Total Mentions</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {viewingAnalysis.analysisResults?.totalMentions || viewingAnalysis.totalMentions || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">Competitors</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {viewingAnalysis.analysisResults?.competitors?.length || viewingAnalysis.competitors?.length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* PDF Download Card */}
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center space-x-2">
                    <Download className="w-5 h-5 text-primary-600" />
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
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={!viewingAnalysis.analysisResults?.brandId && !brandId}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : showAnalysisForm ? (
          // Show analysis form
          <SuperUserDomainAnalysisFlow
            onAnalysisComplete={() => {
              // Only refresh history, keep form visible to show results
              loadAnalysisHistory();
            }}
          />
        ) : (
          // Show empty state
          <EmptyState />
        )}
      </main>
    </div>
  );
};

export default SuperUserAnalysisPage;
