import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { BarChart3, ArrowRight, Trophy, TrendingUp } from 'lucide-react';
import ShareOfVoiceTable from '../../pages/ShareOfVoiceTable';
import LoadingSpinner from '../LoadingSpinner';

const SOVStep = ({ 
  brandId, 
  analysisId, 
  brandName,
  onNext, 
  loading = false,
  isSuperUser = false 
}) => {
  const [sovData, setSovData] = useState(null);
  const [loadingSov, setLoadingSov] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSOVData();
  }, [brandId, analysisId]);

  const loadSOVData = async () => {
    try {
      setLoadingSov(true);
      setError('');
      
      let data;
      if (isSuperUser && analysisId) {
        // Super User endpoint - get analysis details
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
          throw new Error('Failed to load Share of Voice data');
        }
        
        data = await response.json();
      }
        
      if (isSuperUser) {
        // Extract SOV data from super user analysis
        const analysis = data.analysis;
        setSovData({
          shareOfVoice: analysis.analysisResults?.shareOfVoice || {},
          mentionCounts: analysis.analysisResults?.mentionCounts || {},
          totalMentions: analysis.analysisResults?.totalMentions || 0,
          brandShare: analysis.analysisResults?.brandShare || 0,
          aiVisibilityScore: analysis.analysisResults?.aiVisibilityScore || 0,
          brandId: analysis.analysisResults?.brandId,
          brandName: analysis.brandName,
          calculationMethod: 'super_user_analysis'
        });
      } else {
        // Regular user data structure
        setSovData(data);
      }
    } catch (error) {
      console.error('Error loading SOV data:', error);
      setError('Failed to load Share of Voice analysis');
    } finally {
      setLoadingSov(false);
    }
  };

  const handleDataUpdate = () => {
    // Reload SOV data when competitors are added/removed
    loadSOVData();
  };

  if (loadingSov) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Share of Voice Analysis</h1>
          <p className="text-lg text-gray-600">
            See how your brand performs compared to competitors in AI responses
          </p>
        </div>

        {/* Key Insights Cards */}
        {sovData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {sovData.brandShare?.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-purple-700 font-medium">Your Brand Share</div>
                <div className="text-xs text-purple-600 mt-1">Market visibility score</div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {sovData.aiVisibilityScore?.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-blue-700 font-medium">AI Visibility Score</div>
                <div className="text-xs text-blue-600 mt-1">Overall presence in AI</div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {sovData.totalMentions || 0}
                </div>
                <div className="text-sm text-green-700 font-medium">Total Mentions</div>
                <div className="text-xs text-green-600 mt-1">Across all brands</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Share of Voice Table */}
        {sovData ? (
          <div className="mb-8">
            <ShareOfVoiceTable
              shareOfVoice={sovData.shareOfVoice}
              mentionCounts={sovData.mentionCounts}
              totalMentions={sovData.totalMentions}
              brandShare={sovData.brandShare}
              aiVisibilityScore={sovData.aiVisibilityScore}
              brandId={sovData.brandId || brandId}
              brandName={sovData.brandName || brandName}
              calculationMethod={sovData.calculationMethod}
              onDataUpdate={handleDataUpdate}
              isSuperUser={isSuperUser}
              analysisId={analysisId}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No Share of Voice data available</p>
              <p className="text-sm text-gray-500">
                Share of Voice analysis will appear here once the data is processed.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Performance Insights */}
        {sovData && sovData.brandShare !== undefined && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Performance Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Market Position</p>
                    <p className="text-sm text-gray-600">
                      {sovData.brandShare > 20 ? 'Strong market leader' : 
                       sovData.brandShare > 10 ? 'Competitive player' : 
                       sovData.brandShare > 5 ? 'Growing presence' : 
                       'Opportunity for growth'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {sovData.brandShare?.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">AI Recommendation Rate</p>
                    <p className="text-sm text-blue-600">
                      {sovData.aiVisibilityScore > 15 ? 'Frequently recommended' : 
                       sovData.aiVisibilityScore > 8 ? 'Regularly mentioned' : 
                       sovData.aiVisibilityScore > 3 ? 'Occasionally suggested' : 
                       'Rare mentions'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-900">
                      {sovData.aiVisibilityScore?.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-900">Mention Volume</p>
                    <p className="text-sm text-green-600">
                      {sovData.totalMentions > 100 ? 'High activity' : 
                       sovData.totalMentions > 50 ? 'Moderate activity' : 
                       sovData.totalMentions > 20 ? 'Low activity' : 
                       'Limited data available'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-900">
                      {sovData.totalMentions}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Button */}
        <div className="flex justify-center">
          <Button 
            onClick={onNext} 
            disabled={loading || !sovData}
            size="lg"
            className="px-8"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SOVStep;