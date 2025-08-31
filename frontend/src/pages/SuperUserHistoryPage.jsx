import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Download, Eye, Calendar, TrendingUp, Users, Crown, AlertCircle } from 'lucide-react';
import { apiService } from '../utils/api';

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
      
      const response = await apiService.get('/api/v1/super-user/analysis/history');
      console.log('📚 Super User Analysis History:', response.data);
      
      if (response.data.success) {
        setAnalysisHistory(response.data.analyses);
      } else {
        throw new Error(response.data.error || 'Failed to fetch analysis history');
      }
    } catch (err) {
      console.error('❌ Error fetching analysis history:', err);
      setError(err.message || 'Failed to fetch analysis history');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (brandId, brandName) => {
    try {
      setDownloadingPdfs(prev => new Set([...prev, brandId]));
      console.log(`📄 Downloading PDF for brand: ${brandName} (${brandId})`);

      const token = localStorage.getItem('auth') || localStorage.getItem('token');
      
      // Use apiService to ensure correct base URL handling
      const pdfEndpoint = `/api/v1/brand/${brandId}/download-pdf`;
      console.log('📄 PDF Endpoint:', pdfEndpoint);
      console.log('📄 Brand ID:', brandId);
      console.log('📄 Using apiService base URL for PDF download');
      console.log('📄 Current window location:', window.location.origin);
      console.log('📄 Expected full URL would be: ' + ('https://geo-optimizer.onrender.com') + pdfEndpoint);
      
      const response = await apiService.get(pdfEndpoint, {
        responseType: 'blob', // Important: Tell axios to expect a blob response
        headers: {
          'Accept': 'application/pdf',
        },
        timeout: 120000 // 2 minute timeout for PDF generation
      });

      console.log('📄 PDF Response status:', response.status);
      console.log('📄 PDF Response headers:', response.headers);

      // Check if response is successful
      if (response.status !== 200) {
        console.error('PDF download failed with status:', response.status);
        throw new Error(`PDF download failed: HTTP ${response.status}`);
      }

      // Verify response is actually PDF
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('application/pdf')) {
        console.error('❌ Response is not a PDF, content-type:', contentType);
        throw new Error('Server response is not a PDF file');
      }

      // Get the PDF blob and download it
      const blob = response.data; // axios with responseType 'blob' puts data here
      console.log('📄 PDF blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from Content-Disposition header or create default
      let filename = `${brandName.replace(/[^a-zA-Z0-9]/g, '_')}_Analysis.pdf`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log(`✅ PDF downloaded successfully: ${filename}`);
    } catch (error) {
      console.error('❌ PDF download error:', error);
      
      // Additional debugging for 404 errors
      if (error.response?.status === 404) {
        console.error('❌ 404 Error Details:');
        console.error('   - Endpoint:', `/api/v1/brand/${brandId}/download-pdf`);
        console.error('   - Brand ID:', brandId);
        console.error('   - Full URL would be: [BASE_URL]' + `/api/v1/brand/${brandId}/download-pdf`);
      }
      
      alert(`Failed to download PDF: ${error.message} (${error.response?.status || 'Network Error'})`);
    } finally {
      setDownloadingPdfs(prev => {
        const newSet = new Set(prev);
        newSet.delete(brandId);
        return newSet;
      });
    }
  };

  const viewAnalysis = (analysisId) => {
    // Navigate to super user analysis page with specific analysis ID
    navigate(`/super-user-analysis/view/${analysisId}`);
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
                        <tr key={analysis.analysisId} className="border-b border-gray-100 hover:bg-[#f8f9ff]">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#4a4a6a]">{analysis.brandName}</div>
                            <div className="text-xs text-gray-500">{analysis.analysisId}</div>
                          </td>
                          <td className="py-3 px-4">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{analysis.domain}</code>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-[#4a4a6a] flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(analysis.createdAt)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Status: <span className={`font-medium ${
                                analysis.status === 'completed' ? 'text-green-600' : 
                                analysis.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                                {analysis.status}
                              </span>
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
                              {analysis.totalMentions || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                              {analysis.competitorsCount || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewAnalysis(analysis.analysisId)}
                                className="border-[#b0b0d8] text-[#4a4a6a] hover:bg-[#d5d6eb]"
                                title="View Analysis"
                                disabled={analysis.status !== 'completed'}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {analysis.brandId && (
                                <Button
                                  size="sm"
                                  onClick={() => downloadPDF(analysis.brandId, analysis.brandName)}
                                  disabled={downloadingPdfs.has(analysis.brandId) || analysis.status !== 'completed'}
                                  className="bg-green-600 hover:bg-green-700 text-white border-0"
                                  title="Download PDF Report"
                                >
                                  {downloadingPdfs.has(analysis.brandId) ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
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
                      ? formatDate(analysisHistory[0].createdAt)
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
                          analysisHistory.reduce((sum, a) => sum + (a.competitorsCount || 0), 0) / 
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