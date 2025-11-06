import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Users, ChevronRight, Building2, MessageSquare, FileText, X } from 'lucide-react';
import { apiService } from '../utils/api';

const CompetitorsAnalysis = ({ competitors, brandId }) => {
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  const [mentionData, setMentionData] = useState(null);
  const [loadingMentions, setLoadingMentions] = useState(false);

  // Validate and format data
  if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Competitors Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No competitor data available</p>
        </CardContent>
      </Card>
    );
  }

  // Handle both string array and object array formats
  const formatCompetitor = (competitor, index) => {
    if (typeof competitor === 'string') {
      return {
        name: competitor,
        domain: null,
        strength: 'Competitor',
        description: `Identified as a competitor`,
        industry: null
      };
    } else if (typeof competitor === 'object') {
      return {
        name: competitor.name || competitor.domain || `Competitor ${index + 1}`,
        domain: competitor.domain || null,
        strength: competitor.strength || 'Competitor',
        description: competitor.description || `Identified as a competitor`,
        industry: competitor.industry || null
      };
    } else {
      return {
        name: `Competitor ${index + 1}`,
        domain: null,
        strength: 'Competitor',
        description: `Identified as a competitor`,
        industry: null
      };
    }
  };

  const formattedCompetitors = competitors.map((competitor, index) => 
    formatCompetitor(competitor, index)
  );

  // Function to fetch mention data for a competitor
  const handleCompetitorClick = async (competitor) => {
    if (!brandId) {
      console.log("❌ No brandId available");
      return;
    }
    
    console.log("🔍 Clicked competitor:", competitor.name);
    console.log("🏢 Brand ID:", brandId);

    setSelectedCompetitor(competitor);
    setLoadingMentions(true);

    try {
      const apiUrl = `/api/v1/brand/mentions/company/${encodeURIComponent(competitor.name)}?brandId=${brandId}`;
      console.log("📡 API URL:", apiUrl);

      const response = await apiService.get(apiUrl);

      console.log("📡 Response status:", response.status);
      console.log("📡 Response data:", response.data);

      setMentionData(response.data.mentions || []);
    } catch (error) {
      console.error('❌ Error fetching mention data:', error);
      console.error('❌ Error response:', error.response?.data);
      setMentionData([]);
    } finally {
      setLoadingMentions(false);
    }
  };

  // Function to close mention details
  const closeMentionDetails = () => {
    setSelectedCompetitor(null);
    setMentionData(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Competitors Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Summary */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{formattedCompetitors.length} competitors</span> identified in your market space
            </p>
          </div>

          {/* Vertical List of Competitors */}
          <div className="space-y-3">
            {formattedCompetitors.map((competitor, index) => (
              <Card 
                key={index} 
                className="border-0 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => handleCompetitorClick(competitor)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Left Side: Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        {/* Competitor Name */}
                        <h3 className="text-base font-semibold text-foreground">
                          {competitor.name}
                        </h3>
                        
                        {/* Domain (if available) */}
                        {competitor.domain && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {competitor.domain}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Right Side: Chevron Icon */}
                    <div className="flex items-center ml-4">
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Market Insights Footer */}
          <div className="mt-6 pt-4 border-t border-muted/50">
            <div className="flex items-center space-x-2 mb-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Market Overview</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Analysis based on brand mentions, market positioning, and competitive overlap across multiple data sources.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mention Details Modal */}
      {selectedCompetitor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-8 h-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCompetitor.name}</h2>
                    <p className="text-gray-600">Mention Analysis & Prompt Traceability</p>
                  </div>
                </div>
                <Button variant="outline" onClick={closeMentionDetails} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Loading State */}
              {loadingMentions && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading mention data...</span>
                </div>
              )}

              {/* Mention Data */}
              {!loadingMentions && mentionData && (
                <div className="space-y-4">
                  {mentionData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-gray-500 mb-2">No mentions found</div>
                      <div className="text-sm text-gray-600">
                        This competitor hasn't been mentioned in any AI responses yet.
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Summary Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{mentionData.length}</div>
                          <div className="text-sm text-blue-600">Total Mentions</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {new Set(mentionData.map(m => m.categoryId?.categoryName)).size}
                          </div>
                          <div className="text-sm text-green-600">Categories</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {new Set(mentionData.map(m => m.promptId?._id)).size}
                          </div>
                          <div className="text-sm text-purple-600">Unique Prompts</div>
                        </div>
                      </div>

                      {/* Mentions List */}
                      <div className="space-y-4">
                        {mentionData.map((mention, index) => (
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
    </>
  );
};

// Removed fake data helper functions - now using clean, simple competitor data

export default CompetitorsAnalysis; 