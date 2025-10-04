import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../utils/api';
import SuperUserAnalysisResults from '../components/SuperUserAnalysisResults';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const SuperUserAnalysisViewPage = () => {
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (analysisId) {
      fetchAnalysisData();
    }
  }, [analysisId]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Fetching analysis data for ID: ${analysisId}`);
      
      const response = await apiService.get(`/api/v1/super-user/analysis/${analysisId}`);
      
      if (response.data.success) {
        setAnalysisData(response.data.analysis);
        console.log('✅ Analysis data loaded:', response.data.analysis);
      } else {
        setError('Analysis not found or access denied');
      }
    } catch (error) {
      console.error('❌ Error fetching analysis data:', error);
      if (error.response?.status === 404) {
        setError('Analysis not found');
      } else if (error.response?.status === 403) {
        setError('Access denied. Super user permissions required.');
      } else {
        setError('Failed to load analysis data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/playground/history');
  };

  const handleStartNewAnalysis = () => {
    navigate('/playground');
  };

  const handleDownloadPDF = async () => {
    if (!analysisData?.analysisId) {
      toast.error('No analysis data available for PDF download');
      return;
    }

    // Use apiService to ensure correct base URL handling
    const pdfEndpoint = `/api/v1/super-user/analysis/${analysisData.analysisId}/download-pdf`;
    
    try {
      setDownloadingPdf(true);
      console.log('📄 Downloading Super User PDF for analysis:', analysisData.analysisId);
      
      // const token = localStorage.getItem('auth') || localStorage.getItem('token');
      console.log('📄 PDF Endpoint:', pdfEndpoint);
      console.log('📄 Analysis ID:', analysisData.analysisId);
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
      let filename = `${analysisData.brandName?.replace(/[^a-zA-Z0-9]/g, '_')}_Analysis.pdf`;
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
      
      toast.success(`PDF report downloaded successfully! (${filename})`);
      console.log('✅ Super User PDF downloaded successfully:', filename);
      
    } catch (error) {
      console.error('❌ Super User PDF download error:', error);
      
      // Additional debugging for 404 errors
      if (error.response?.status === 404) {
        console.error('❌ 404 Error Details:');
        console.error('   - Endpoint:', pdfEndpoint);
        console.error('   - Analysis ID:', analysisData.analysisId);
        console.error('   - Full URL would be: [BASE_URL]' + pdfEndpoint);
        
        // Try to test if the analysis exists
        try {
          console.log('🔍 Testing if analysis exists...');
          const testResponse = await apiService.get(`/api/v1/super-user/analysis/${analysisData.analysisId}`);
          console.log('✅ Analysis exists:', testResponse.status === 200);
        } catch (testError) {
          console.error('❌ Analysis does not exist:', testError.response?.status);
        }
      }
      
      toast.error(`Failed to download PDF report: ${error.message} (${error.response?.status || 'Network Error'})`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-lg text-[#4a4a6a] mt-4">Loading analysis details...</p>
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
                Error Loading Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-3">
                <Button onClick={handleBack} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to History
                </Button>
                <Button onClick={fetchAnalysisData}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">The requested analysis could not be found.</p>
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <SuperUserAnalysisResults
        analysisData={analysisData}
        onBack={handleBack}
        onStartNewAnalysis={handleStartNewAnalysis}
        downloadingPdf={downloadingPdf}
        onDownloadPDF={handleDownloadPDF}
      />
    </div>
  );
};

export default SuperUserAnalysisViewPage;