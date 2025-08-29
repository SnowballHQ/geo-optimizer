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
    navigate('/super-user-history');
  };

  const handleStartNewAnalysis = () => {
    navigate('/super-user-analysis');
  };

  const handleDownloadPDF = async () => {
    if (!analysisData?.analysisId) {
      toast.error('No analysis data available for PDF download');
      return;
    }

    try {
      setDownloadingPdf(true);
      console.log('📄 Downloading Super User PDF for analysis:', analysisData.analysisId);
      
      const token = localStorage.getItem('auth') || localStorage.getItem('token');
      
      // Use apiService for proper base URL handling in deployment
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const fullUrl = `${API_BASE_URL}/api/v1/super-user/analysis/${analysisData.analysisId}/download-pdf`;
      
      console.log('📄 PDF Download URL:', fullUrl);
      console.log('📄 Using token:', token ? 'Token available' : 'No token');
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include credentials for CORS
      });

      console.log('📄 PDF Response status:', response.status);
      console.log('📄 PDF Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorText;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorText = errorData.error || errorData.message || `HTTP ${response.status}`;
          } else {
            errorText = await response.text();
          }
        } catch (e) {
          errorText = `HTTP ${response.status} - ${response.statusText}`;
        }
        
        console.error('PDF download error response:', errorText);
        throw new Error(`PDF download failed: ${errorText}`);
      }

      // Verify response is actually PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        console.error('❌ Response is not a PDF, content-type:', contentType);
        const responseText = await response.text();
        console.error('❌ Response body:', responseText);
        throw new Error('Server response is not a PDF file');
      }

      // Get the PDF blob and download it
      const blob = await response.blob();
      console.log('📄 PDF blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from Content-Disposition header or create default
      let filename = `SuperUser_${analysisData.domain?.replace(/[^a-zA-Z0-9]/g, '_')}_Analysis_${analysisData.analysisId}.pdf`;
      const contentDisposition = response.headers.get('content-disposition');
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
      toast.error(`Failed to download PDF report: ${error.message}`);
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