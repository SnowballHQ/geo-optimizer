import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, Building2, ArrowRight, MessageSquare, FileText } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const MentionsStep = ({ 
  brandId, 
  analysisId, 
  brandName,
  competitors = [],
  onNext, 
  loading = false,
  isSuperUser = false 
}) => {
  const [mentionStats, setMentionStats] = useState({});
  const [loadingMentions, setLoadingMentions] = useState(true);
  const [error, setError] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandMentions, setBrandMentions] = useState([]);
  const [loadingBrandMentions, setLoadingBrandMentions] = useState(false);

  useEffect(() => {
    loadMentionStats();
  }, [brandId, analysisId]);

  const loadMentionStats = async () => {
    try {
      setLoadingMentions(true);
      setError('');
      
      // Get mention stats for all brands (brand + competitors)
      const allBrands = [brandName, ...competitors].filter(Boolean);
      const stats = {};
      let totalMentions = 0;

      for (const brand of allBrands) {
        try {
          let data;
          if (isSuperUser && analysisId) {
            // Super User endpoint
            const { apiService } = await import('../../utils/api');
            const response = await apiService.get(`/api/v1/super-user/analysis/${analysisId}/mentions/${encodeURIComponent(brand)}`);
            data = response.data;
          } else {
            // Regular user endpoint
            const response = await fetch(`/api/v1/brand/mentions/company/${encodeURIComponent(brand)}?brandId=${brandId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              data = await response.json();
            } else {
              data = { mentions: [] };
            }
          }
          
          const mentionCount = data.mentions?.length || data.totalMentions || 0;
          stats[brand] = mentionCount;
          totalMentions += mentionCount;
        } catch (error) {
          console.error(`Error loading mentions for ${brand}:`, error);
          stats[brand] = 0;
        }
      }

      stats._total = totalMentions;
      setMentionStats(stats);
    } catch (error) {
      console.error('Error loading mention stats:', error);
      setError('Failed to load mention statistics');
    } finally {
      setLoadingMentions(false);
    }
  };

  const loadBrandMentions = async (brand) => {
    try {
      setLoadingBrandMentions(true);
      setSelectedBrand(brand);
      
      let data;
      if (isSuperUser && analysisId) {
        // Super User endpoint
        const { apiService } = await import('../../utils/api');
        const response = await apiService.get(`/api/v1/super-user/analysis/${analysisId}/mentions/${encodeURIComponent(brand)}`);
        data = response.data;
      } else {
        // Regular user endpoint
        const response = await fetch(`/api/v1/brand/mentions/company/${encodeURIComponent(brand)}?brandId=${brandId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          data = await response.json();
        } else {
          data = { mentions: [] };
        }
      }
      
      setBrandMentions(data.mentions || []);
    } catch (error) {
      console.error(`Error loading mentions for ${brand}:`, error);
      setBrandMentions([]);
    } finally {
      setLoadingBrandMentions(false);
    }
  };

  const closeMentionDetails = () => {
    setSelectedBrand(null);
    setBrandMentions([]);
  };

  if (loadingMentions) {
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
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Brand Mentions Extracted</h1>
          <p className="text-lg text-gray-600">
            We found {mentionStats._total || 0} brand mentions across all AI responses
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{mentionStats._total || 0}</div>
              <div className="text-sm text-gray-600">Total Mentions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Object.keys(mentionStats).filter(k => k !== '_total' && mentionStats[k] > 0).length}
              </div>
              <div className="text-sm text-gray-600">Brands Mentioned</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {mentionStats[brandName] || 0}
              </div>
              <div className="text-sm text-gray-600">Your Brand</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {competitors.reduce((sum, comp) => sum + (mentionStats[comp] || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Competitors</div>
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

        {/* Brand Mentions List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>Brand Mention Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[brandName, ...competitors].filter(Boolean).map((brand) => {
                const mentions = mentionStats[brand] || 0;
                const percentage = mentionStats._total > 0 ? ((mentions / mentionStats._total) * 100).toFixed(1) : 0;
                
                return (
                  <div 
                    key={brand}
                    onClick={() => mentions > 0 && loadBrandMentions(brand)}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                      mentions > 0 
                        ? 'cursor-pointer hover:bg-gray-50 hover:border-blue-300' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        brand === brandName ? 'bg-purple-500' : 'bg-blue-500'
                      }`}></div>
                      <span className="font-medium text-gray-900">{brand}</span>
                      {brand === brandName && (
                        <Badge variant="outline" className="text-purple-600 border-purple-200">
                          Your Brand
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{mentions}</div>
                        <div className="text-sm text-gray-500">{percentage}%</div>
                      </div>
                      {mentions > 0 && (
                        <div className="text-blue-600 text-sm font-medium">
                          Click to view
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {Object.keys(mentionStats).filter(k => k !== '_total').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No mentions found</p>
                <p className="text-sm text-gray-500">
                  Brand mentions will appear here once they are extracted.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Button */}
        <div className="flex justify-center">
          <Button 
            onClick={onNext} 
            disabled={loading}
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
                Continue to Share of Voice
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Brand Mentions Modal */}
      {selectedBrand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-8 h-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedBrand}</h2>
                    <p className="text-gray-600">Mention Analysis & Prompt Traceability</p>
                  </div>
                </div>
                <Button variant="outline" onClick={closeMentionDetails} className="h-8 w-8 p-0">
                  ×
                </Button>
              </div>

              {/* Loading State */}
              {loadingBrandMentions && (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              )}

              {/* Mention Data */}
              {!loadingBrandMentions && (
                <div className="space-y-4">
                  {brandMentions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-gray-500 mb-2">No mentions found</div>
                      <div className="text-sm text-gray-600">
                        This brand hasn't been mentioned in any AI responses yet.
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Summary Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{brandMentions.length}</div>
                          <div className="text-sm text-blue-600">Total Mentions</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {new Set(brandMentions.map(m => m.categoryId?.categoryName)).size}
                          </div>
                          <div className="text-sm text-green-600">Categories</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {new Set(brandMentions.map(m => m.promptId?._id)).size}
                          </div>
                          <div className="text-sm text-purple-600">Unique Prompts</div>
                        </div>
                      </div>

                      {/* Mentions List */}
                      <div className="space-y-4">
                        {brandMentions.map((mention, index) => (
                          <Card key={mention._id || index} className="border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {mention.categoryId?.categoryName || 'Unknown Category'}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {new Date(mention.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Prompt */}
                              <div className="mb-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <MessageSquare className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm font-medium text-gray-700">Prompt</span>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                  {mention.promptId?.promptText || 'Prompt not available'}
                                </p>
                              </div>

                              {/* AI Response */}
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <FileText className="w-4 h-4 text-green-500" />
                                  <span className="text-sm font-medium text-gray-700">AI Response</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md">
                                  <p className="text-sm text-gray-600">
                                    {mention.responseId?.responseText?.substring(0, 300) || 'Response not available'}
                                    {(mention.responseId?.responseText?.length || 0) > 300 && '...'}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentionsStep;