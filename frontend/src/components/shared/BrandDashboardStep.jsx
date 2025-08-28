import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  CheckCircle, 
  Download, 
  RefreshCw, 
  Share, 
  Archive, 
  Crown,
  Building2,
  BarChart3,
  FileText,
  TrendingUp
} from 'lucide-react';
import BrandSummary from '../../pages/BrandSummary';
import ShareOfVoiceTable from '../../pages/ShareOfVoiceTable';
import CompetitorsAnalysis from '../../pages/CompetitorsAnalysis';
import CategoriesWithPrompts from '../../pages/CategoriesWithPrompts';
import LoadingSpinner from '../LoadingSpinner';

const BrandDashboardStep = ({ 
  brandId, 
  analysisId, 
  brandName,
  onStartNewAnalysis,
  onDownloadPDF,
  downloadingPdf = false,
  isSuperUser = false 
}) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [savingToHistory, setSavingToHistory] = useState(false);

  useEffect(() => {
    loadDashboardData();
    if (isSuperUser && analysisId) {
      // Auto-save super user analysis to history
      saveAnalysisToHistory();
    }
  }, [brandId, analysisId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      let data;
      if (isSuperUser && analysisId) {
        // Super User endpoint - get complete analysis
        const { apiService } = await import('../../utils/api');
        const response = await apiService.get(`/api/v1/super-user/analysis/${analysisId}`);
        data = response.data;
      } else {
        // Regular user endpoint - get brand analysis
        const response = await fetch(`/api/v1/brand/${brandId}/analysis`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load dashboard data');
        }
        
        data = await response.json();
      }
        
      if (isSuperUser) {
        // Format super user data for dashboard components
        const analysis = data.analysis;
        setDashboardData({
          // Brand summary data
          brand: {
            id: analysis.analysisResults?.brandId,
            brandName: analysis.brandName,
            domain: analysis.domain,
            brandInformation: analysis.brandInformation
          },
          // SOV data
          shareOfVoice: analysis.analysisResults?.shareOfVoice || {},
          mentionCounts: analysis.analysisResults?.mentionCounts || {},
          totalMentions: analysis.analysisResults?.totalMentions || 0,
          brandShare: analysis.analysisResults?.brandShare || 0,
          aiVisibilityScore: analysis.analysisResults?.aiVisibilityScore || 0,
          // Categories and competitors
          categories: analysis.step2Data?.categories?.map(cat => ({
            categoryName: cat,
            prompts: [] // Will be loaded by CategoriesWithPrompts component
          })) || [],
          competitors: analysis.step3Data?.competitors || [],
          // Analysis metadata
          analysisId: analysis.analysisId,
          createdAt: analysis.createdAt,
          completedAt: analysis.completedAt
        });
      } else {
        // Regular user data structure
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load brand dashboard');
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysisToHistory = async () => {
    if (!isSuperUser || !analysisId || savedToHistory) return;

    try {
      setSavingToHistory(true);
      
      // Save super user analysis to history
      const response = await fetch(`/api/v1/super-user/analysis/save-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: analysisId,
          analysisData: dashboardData
        })
      });

      if (response.ok) {
        setSavedToHistory(true);
        console.log('✅ Super User analysis saved to history');
      }
    } catch (error) {
      console.error('Error saving to history:', error);
    } finally {
      setSavingToHistory(false);
    }
  };

  const handleDataUpdate = () => {
    // Reload dashboard data when changes are made
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">
              <Building2 className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadDashboardData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Actions */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analysis Complete!</h1>
                <p className="text-gray-600">
                  {isSuperUser ? 'Super User Domain Analysis' : 'Brand Analysis'} for {brandName}
                </p>
              </div>
              {isSuperUser && (
                <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
                  <Crown className="w-3 h-3 mr-1" />
                  Super User
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Save to History Status */}
              {isSuperUser && (
                <div className="flex items-center space-x-2 text-sm">
                  {savingToHistory ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-600">Saving...</span>
                    </>
                  ) : savedToHistory ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Saved to History</span>
                    </>
                  ) : null}
                </div>
              )}

              {/* Action Buttons */}
              {isSuperUser && onDownloadPDF && (
                <Button
                  onClick={onDownloadPDF}
                  disabled={downloadingPdf}
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  {downloadingPdf ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              )}

              {isSuperUser && onStartNewAnalysis && (
                <Button
                  onClick={onStartNewAnalysis}
                  className="bg-primary hover:bg-primary/90"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Analysis
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="space-y-8">
          {/* Brand Summary */}
          {dashboardData?.brand && (
            <BrandSummary 
              brand={dashboardData.brand}
              isSuperUser={isSuperUser}
            />
          )}

          {/* Share of Voice */}
          {dashboardData && (
            <ShareOfVoiceTable
              shareOfVoice={dashboardData.shareOfVoice}
              mentionCounts={dashboardData.mentionCounts}
              totalMentions={dashboardData.totalMentions}
              brandShare={dashboardData.brandShare}
              aiVisibilityScore={dashboardData.aiVisibilityScore}
              brandId={dashboardData.brand?.id || brandId}
              brandName={dashboardData.brand?.brandName || brandName}
              calculationMethod={dashboardData.calculationMethod}
              onDataUpdate={handleDataUpdate}
              isSuperUser={isSuperUser}
              analysisId={analysisId}
            />
          )}

          {/* Competitors Analysis */}
          {dashboardData?.competitors && dashboardData.competitors.length > 0 && (
            <CompetitorsAnalysis 
              competitors={dashboardData.competitors}
              brandId={dashboardData.brand?.id || brandId}
              isSuperUser={isSuperUser}
              analysisId={analysisId}
            />
          )}

          {/* Categories with Prompts */}
          {dashboardData?.categories && dashboardData.categories.length > 0 && (
            <CategoriesWithPrompts 
              categories={dashboardData.categories}
              brandId={dashboardData.brand?.id || brandId}
              isSuperUser={isSuperUser}
              analysisId={analysisId}
            />
          )}

          {/* Analysis Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Analysis Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">
                    {dashboardData?.brandShare?.toFixed(1) || 0}%
                  </div>
                  <div className="text-sm text-blue-700">Brand Share</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">
                    {dashboardData?.aiVisibilityScore?.toFixed(1) || 0}%
                  </div>
                  <div className="text-sm text-green-700">AI Visibility</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900">
                    {dashboardData?.totalMentions || 0}
                  </div>
                  <div className="text-sm text-purple-700">Total Mentions</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Building2 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-900">
                    {(dashboardData?.competitors?.length || 0) + 1}
                  </div>
                  <div className="text-sm text-orange-700">Brands Analyzed</div>
                </div>
              </div>

              {dashboardData?.analysisId && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Analysis ID:</span> {dashboardData.analysisId}
                    </div>
                    <div>
                      <span className="font-medium">Completed:</span>{' '}
                      {dashboardData.completedAt ? 
                        new Date(dashboardData.completedAt).toLocaleDateString() : 
                        new Date().toLocaleDateString()
                      }
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BrandDashboardStep;