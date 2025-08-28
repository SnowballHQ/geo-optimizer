import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, MessageSquare, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const ResponsesStep = ({ 
  brandId, 
  analysisId, 
  onNext, 
  loading = false,
  isSuperUser = false 
}) => {
  const [responses, setResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [error, setError] = useState('');
  const [expandedResponses, setExpandedResponses] = useState(new Set());

  useEffect(() => {
    loadResponses();
  }, [brandId, analysisId]);

  const loadResponses = async () => {
    try {
      setLoadingResponses(true);
      setError('');
      
      let data;
      if (isSuperUser && analysisId) {
        // Super User endpoint - import apiService for consistency
        const { apiService } = await import('../../utils/api');
        const response = await apiService.get(`/api/v1/super-user/analysis/${analysisId}/responses`);
        data = response.data;
      } else {
        // Regular user endpoint
        const response = await fetch(`/api/v1/brand/${brandId}/responses`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load responses');
        }
        
        data = await response.json();
      }
      
      setResponses(data.responses || []);
    } catch (error) {
      console.error('Error loading responses:', error);
      setError('Failed to load AI responses');
    } finally {
      setLoadingResponses(false);
    }
  };

  const toggleExpanded = (responseId) => {
    const newExpanded = new Set(expandedResponses);
    if (newExpanded.has(responseId)) {
      newExpanded.delete(responseId);
    } else {
      newExpanded.add(responseId);
    }
    setExpandedResponses(newExpanded);
  };

  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loadingResponses) {
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
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Responses Generated</h1>
          <p className="text-lg text-gray-600">
            Our AI analyzed {responses.length} prompts and generated comprehensive responses
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{responses.length}</div>
              <div className="text-sm text-gray-600">Total Responses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {new Set(responses.map(r => r.categoryName)).size}
              </div>
              <div className="text-sm text-gray-600">Categories Covered</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {responses.reduce((sum, r) => sum + (r.responseText?.length || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Characters</div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Responses List */}
        <div className="space-y-4 mb-8">
          {responses.map((response, index) => (
            <Card key={response._id || index} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="text-xs">
                      {response.categoryName || 'Unknown Category'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Response {index + 1}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(response._id)}
                    className="p-1"
                  >
                    {expandedResponses.has(response._id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Prompt */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Prompt</span>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {response.promptText || 'Prompt not available'}
                  </p>
                </div>

                {/* AI Response */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">AI Response</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {expandedResponses.has(response._id) 
                        ? response.responseText 
                        : truncateText(response.responseText || 'Response not available')
                      }
                    </p>
                    {(response.responseText?.length || 0) > 200 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleExpanded(response._id)}
                        className="p-0 h-auto mt-2 text-blue-600"
                      >
                        {expandedResponses.has(response._id) ? 'Show Less' : 'Show More'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No responses state */}
        {responses.length === 0 && !loadingResponses && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No responses available</p>
              <p className="text-sm text-gray-500">
                AI responses will appear here once they are generated.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Next Button */}
        <div className="flex justify-center">
          <Button 
            onClick={onNext} 
            disabled={loading || responses.length === 0}
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
                Continue to Mentions
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResponsesStep;