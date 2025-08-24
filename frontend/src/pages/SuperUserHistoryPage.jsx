import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Download, Eye, Calendar, TrendingUp, Users, Crown, AlertCircle } from 'lucide-react';

const SuperUserHistoryPage = () => {
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingPdfs, setDownloadingPdfs] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalysisHistory();
  }, []);

  const fetchAnalysisHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth');
      
      const response = await fetch('/api/v1/brand/super-user/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis history');
      }

      const data = await response.json();
      console.log('📚 Super User Analysis History:', data);
      
      if (data.success) {
        setAnalysisHistory(data.history);
      } else {
        throw new Error(data.error || 'Failed to fetch analysis history');
      }
    } catch (err) {
      console.error('❌ Error fetching analysis history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (brandId, brandName) => {
    try {
      setDownloadingPdfs(prev => new Set([...prev, brandId]));
      console.log(`📄 Downloading PDF for brand: ${brandName} (${brandId})`);

      const token = localStorage.getItem('auth');
      
      const response = await fetch(`/api/v1/brand/${brandId}/download-pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download PDF');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or create one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${brandName.replace(/[^a-zA-Z0-9]/g, '_')}_Analysis.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ PDF downloaded: ${filename}`);
    } catch (err) {
      console.error('❌ PDF download error:', err);
      alert(`Failed to download PDF: ${err.message}`);
    } finally {
      setDownloadingPdfs(prev => {
        const newSet = new Set(prev);
        newSet.delete(brandId);
        return newSet;
      });
    }
  };

  const viewAnalysis = (brandId) => {
    // Navigate to super user analysis page with specific brand ID
    navigate(`/super-user-analysis/${brandId}`);
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


  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#6658f4] mx-auto mb-4"></div>
          <p className="text-lg text-[#4a4a6a]">Loading super user analysis history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Card className="border border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Access Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-red-600 mb-4">
                {error}
              </CardDescription>
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      {/* Header */}
      <div className="bg-white border-b border-[#ffffff] px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#4a4a6a] flex items-center">
                <Users className="w-6 h-6 mr-3" />
                Super User Analysis History
              </h1>
              <p className="text-sm text-[#4a4a6a]">View and download all your domain analysis reports</p>
            </div>
          </div>
          <div className="bg-[#6658f4] text-white px-4 py-2 rounded-lg">
            {analysisHistory.length} Total Analyses
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {analysisHistory.length === 0 ? (
          <Card className="border border-[#b0b0d8] bg-white">
            <CardContent className="text-center py-12">
              <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
              <CardTitle className="text-xl text-[#4a4a6a] mb-2">No Analysis History</CardTitle>
              <CardDescription className="text-[#4a4a6a] mb-6">
                You haven't performed any super user analyses yet.
              </CardDescription>
              <Button 
                onClick={() => navigate('/super-user-analysis')}
                className="gradient-primary"
              >
                Start New Analysis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Analysis Table */}
            <Card className="border border-[#b0b0d8] bg-white">
              <CardHeader>
                <CardTitle className="text-[#4a4a6a]">Analysis History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#b0b0d8]">
                        <th className="text-left py-3 px-4 font-semibold text-[#4a4a6a]">Brand Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-[#4a4a6a]">Domain</th>
                        <th className="text-left py-3 px-4 font-semibold text-[#4a4a6a]">Analysis Date</th>
                        <th className="text-center py-3 px-4 font-semibold text-[#4a4a6a]">AI Visibility</th>
                        <th className="text-center py-3 px-4 font-semibold text-[#4a4a6a]">Brand Share</th>
                        <th className="text-center py-3 px-4 font-semibold text-[#4a4a6a]">Mentions</th>
                        <th className="text-center py-3 px-4 font-semibold text-[#4a4a6a]">Competitors</th>
                        <th className="text-center py-3 px-4 font-semibold text-[#4a4a6a]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisHistory.map((analysis) => (
                        <tr key={analysis.brandId} className="border-b border-gray-100 hover:bg-[#f8f9ff]">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#4a4a6a]">{analysis.brandName}</div>
                          </td>
                          <td className="py-3 px-4">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{analysis.domain}</code>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-[#4a4a6a] flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(analysis.analysisDate)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              analysis.aiVisibilityScore >= 80 ? 'bg-green-100 text-green-800' :
                              analysis.aiVisibilityScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              analysis.aiVisibilityScore >= 40 ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {Math.round(analysis.aiVisibilityScore || 0)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-[#6658f4] text-white px-2 py-1 rounded-full text-xs font-medium">
                              {Math.round(analysis.brandShare || 0)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                              {analysis.totalMentions}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                              {analysis.competitorCount}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewAnalysis(analysis.brandId)}
                                className="border-[#b0b0d8] text-[#4a4a6a] hover:bg-[#d5d6eb]"
                                title="View Analysis"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => downloadPDF(analysis.brandId, analysis.brandName)}
                                disabled={downloadingPdfs.has(analysis.brandId)}
                                className="bg-green-600 hover:bg-green-700 text-white border-0"
                                title="Download PDF Report"
                              >
                                {downloadingPdfs.has(analysis.brandId) ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border border-[#b0b0d8] bg-white text-center">
                <CardContent className="pt-6">
                  <TrendingUp size={32} className="text-[#6658f4] mx-auto mb-2" />
                  <CardDescription className="text-sm text-[#4a4a6a]">Average Visibility</CardDescription>
                  <div className="text-2xl font-bold text-[#4a4a6a]">
                    {analysisHistory.length > 0 
                      ? Math.round(
                          analysisHistory.reduce((sum, a) => sum + (a.aiVisibilityScore || 0), 0) / 
                          analysisHistory.length
                        )
                      : 0}%
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-[#b0b0d8] bg-white text-center">
                <CardContent className="pt-6">
                  <Users size={32} className="text-green-600 mx-auto mb-2" />
                  <CardDescription className="text-sm text-[#4a4a6a]">Total Mentions</CardDescription>
                  <div className="text-2xl font-bold text-[#4a4a6a]">
                    {analysisHistory.reduce((sum, a) => sum + (a.totalMentions || 0), 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-[#b0b0d8] bg-white text-center">
                <CardContent className="pt-6">
                  <Calendar size={32} className="text-blue-600 mx-auto mb-2" />
                  <CardDescription className="text-sm text-[#4a4a6a]">Latest Analysis</CardDescription>
                  <div className="text-sm font-medium text-[#4a4a6a]">
                    {analysisHistory.length > 0 
                      ? formatDate(analysisHistory[0].analysisDate)
                      : 'None'
                    }
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-[#b0b0d8] bg-white text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-2">🏢</div>
                  <CardDescription className="text-sm text-[#4a4a6a]">Avg Competitors</CardDescription>
                  <div className="text-2xl font-bold text-[#4a4a6a]">
                    {analysisHistory.length > 0 
                      ? Math.round(
                          analysisHistory.reduce((sum, a) => sum + (a.competitorCount || 0), 0) / 
                          analysisHistory.length
                        )
                      : 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperUserHistoryPage;