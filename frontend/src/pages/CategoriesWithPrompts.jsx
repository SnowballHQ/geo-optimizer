import React, { useState, useEffect } from "react";
import { apiService } from "../utils/api";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ChevronDown, ChevronRight, MessageSquare, Sparkles, Clock } from 'lucide-react';
import AddCustomPrompt from '../components/AddCustomPrompt';

const CategoriesWithPrompts = ({ 
  categories, 
  brandId, 
  onSOVUpdate, 
  onDataUpdate,
  isSuperUser = false, 
  analysisId = null 
}) => {
  const [categoryPrompts, setCategoryPrompts] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [promptResponses, setPromptResponses] = useState({});
  const [loadingResponses, setLoadingResponses] = useState({});

  // Helper function to get prompt text safely
  const getPromptText = (prompt) => {
    console.log('🔍 DEBUG: Full prompt object:', prompt);
    console.log('🔍 DEBUG: Prompt keys:', Object.keys(prompt || {}));
    
    const text = prompt.promptText || prompt.question || prompt.text || prompt.prompt || prompt.content;
    console.log('🔍 DEBUG: Extracted text:', text);
    console.log('🔍 DEBUG: Individual field values:', {
      promptText: prompt.promptText,
      question: prompt.question,
      text: prompt.text,
      prompt: prompt.prompt,
      content: prompt.content
    });
    
    if (text && typeof text === 'string' && text.trim()) {
      return text.length > 150 ? text.slice(0, 150) + '...' : text;
    }
    console.log('❌ DEBUG: No valid text found, using fallback');
    return 'Prompt (' + (prompt._id || 'No ID') + ')';
  };

  // Helper function to render response content
  const renderResponseContent = (hasResponse) => {
    if (!hasResponse) return React.createElement('span', {className: 'text-muted-foreground italic'}, 'No response content');
    
    if (typeof hasResponse === 'string') {
      if (hasResponse.startsWith('Error:')) {
        return React.createElement('span', {className: 'text-destructive'}, hasResponse);
      }
      if (hasResponse.trim() === '') {
        return React.createElement('span', {className: 'text-muted-foreground italic'}, 'Empty response');
      }
      return React.createElement('div', {className: 'whitespace-pre-wrap'}, hasResponse);
    }
    
    if (typeof hasResponse === 'object') {
      const content = hasResponse.responseText || hasResponse.content || hasResponse.text || hasResponse.message;
      if (content) {
        return React.createElement('div', {className: 'whitespace-pre-wrap'}, content);
      }
      return React.createElement('div', 
        {className: 'whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded'}, 
        JSON.stringify(hasResponse, null, 2)
      );
    }
    
    return React.createElement('span', {className: 'text-muted-foreground italic'}, 'No response content');
  };

  useEffect(() => {
    if (categories && categories.length > 0) {
      const hasPromptsData = categories.some(cat => cat.prompts && Array.isArray(cat.prompts));
      
      if (hasPromptsData) {
        processCategoriesWithPrompts();
      } else if (brandId) {
        fetchCategoryPrompts();
      }
    }
  }, [categories, brandId]);

  const processCategoriesWithPrompts = () => {
    const promptsMap = {};
    
    categories.forEach(category => {
      if (category.prompts && Array.isArray(category.prompts)) {
        const processedPrompts = category.prompts.map(prompt => {
          if (typeof prompt === 'string') {
            return {
              _id: 'prompt_' + Math.random().toString(36).substr(2, 9),
              promptText: prompt,
              text: prompt,
              question: prompt,
              categoryId: category._id,
              aiResponse: null
            };
          }
          
          return {
            ...prompt,
            _id: prompt._id || prompt.id || 'prompt_' + Math.random().toString(36).substr(2, 9),
            categoryId: category._id
          };
        });
        
        promptsMap[category._id] = processedPrompts;
      } else {
        promptsMap[category._id] = [];
      }
    });
    
    setCategoryPrompts(promptsMap);
    
    // Pre-populate responses that are already available in the backend data
    const initialResponses = {};
    categories.forEach(category => {
      if (category.prompts && Array.isArray(category.prompts)) {
        category.prompts.forEach(prompt => {
          const promptId = prompt._id || prompt.id;
          if (promptId && prompt.aiResponse) {
            const responseText = prompt.aiResponse.responseText || 
                               prompt.aiResponse.content || 
                               prompt.aiResponse.message || 
                               prompt.aiResponse;
            
            if (responseText && typeof responseText === 'string') {
              initialResponses[promptId] = responseText;
            }
          }
        });
      }
    });
    
    if (Object.keys(initialResponses).length > 0) {
      setPromptResponses(initialResponses);
    }
  };

  const fetchCategoryPrompts = async () => {
    setLoading(true);
    try {
      const promises = categories.map(async (category) => {
        try {
          const response = await apiService.getCategoryPrompts(category._id);
          
          let prompts = [];
          if (response.data && Array.isArray(response.data)) {
            prompts = response.data;
          } else if (response.data && Array.isArray(response.data.prompts)) {
            prompts = response.data.prompts;
          } else if (response.data && response.data.data && Array.isArray(response.data.data.prompts)) {
            prompts = response.data.data.prompts;
          }
          
          return { categoryId: category._id, prompts: prompts };
        } catch (error) {
          return { categoryId: category._id, prompts: [] };
        }
      });

      const results = await Promise.all(promises);
      const promptsMap = {};
      results.forEach(result => {
        promptsMap[result.categoryId] = result.prompts;
      });
      setCategoryPrompts(promptsMap);
    } catch (error) {
      console.error("Error fetching category prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handlePromptClick = async (promptId) => {
    console.log('🔍 DEBUG: handlePromptClick called for promptId:', promptId);
    
    // If response is already loaded, toggle it
    if (promptResponses[promptId]) {
      console.log('🔍 DEBUG: Response already loaded, hiding it');
      setPromptResponses(prev => {
        const newState = { ...prev };
        delete newState[promptId];
        return newState;
      });
      return;
    }

    // Check if we already have the response data from the backend
    let responseContent = '';
    let foundResponse = false;
    
    console.log('🔍 DEBUG: Searching for prompt in categories:', categories?.length);
    
    // Search through all categories to find the exact prompt with its response
    for (const category of categories) {
      if (category.prompts && Array.isArray(category.prompts)) {
        console.log(`🔍 DEBUG: Checking category ${category.categoryName} with ${category.prompts.length} prompts`);
        
        const prompt = category.prompts.find(p => {
          const match = (p._id && p._id.toString() === promptId.toString()) || 
                       (p.id && p.id.toString() === promptId.toString());
          console.log(`🔍 DEBUG: Checking prompt ${p._id} against ${promptId}: ${match}`);
          return match;
        });
        
        if (prompt) {
          console.log('🔍 DEBUG: Found matching prompt:', prompt);
          console.log('🔍 DEBUG: Prompt has aiResponse:', !!prompt.aiResponse);
          
          if (prompt.aiResponse) {
            if (prompt.aiResponse.responseText) {
              responseContent = prompt.aiResponse.responseText;
            } else if (prompt.aiResponse.content) {
              responseContent = prompt.aiResponse.content;
            } else if (prompt.aiResponse.message) {
              responseContent = prompt.aiResponse.message;
            } else if (typeof prompt.aiResponse === 'string') {
              responseContent = prompt.aiResponse;
            } else {
              responseContent = JSON.stringify(prompt.aiResponse, null, 2);
            }
            
            console.log('✅ DEBUG: Found response content:', responseContent?.substring(0, 100));
            foundResponse = true;
            break;
          }
        }
      }
    }
    
    if (foundResponse && responseContent) {
      console.log('✅ DEBUG: Using cached response content');
      setPromptResponses(prev => ({
        ...prev,
        [promptId]: responseContent
      }));
      return;
    }
    
    console.log('🔍 DEBUG: No cached response found');
    
    // For Super User analyses, we don't need to make API calls since all data should be preloaded
    if (isSuperUser) {
      console.log('❌ DEBUG: Super User analysis should have all responses preloaded, showing error');
      setPromptResponses(prev => ({
        ...prev,
        [promptId]: 'Response not available - this should be preloaded for Super User analyses'
      }));
      return;
    }
    
    // For regular brand analyses, fall back to API call
    setLoadingResponses(prev => ({ ...prev, [promptId]: true }));

    try {
      const response = await apiService.getPromptResponse(promptId);
      
      console.log('🔍 DEBUG: API response:', response.data);
      
      // Handle the simplified response structure
      if (response.data && response.data.success && response.data.responseText) {
        responseContent = response.data.responseText;
      } else if (response.data && response.data.message) {
        responseContent = response.data.message;
      } else {
        responseContent = 'No response content available';
      }
      
      // Ensure we always have a string
      if (typeof responseContent !== 'string') {
        responseContent = JSON.stringify(responseContent, null, 2);
      }
      
      console.log('✅ DEBUG: Final API response content:', responseContent?.substring(0, 100));
      
      setPromptResponses(prev => ({
        ...prev,
        [promptId]: responseContent
      }));
      
      // Auto-reload Brand Dashboard if user is on dashboard page (for new response generation)
      if (!foundResponse) {
        apiService.triggerBrandDashboardReload();
      }
    } catch (error) {
      console.error('❌ DEBUG: API call failed:', error);
      setPromptResponses(prev => ({
        ...prev,
        [promptId]: 'Error: ' + (error.response?.data?.message || error.message || 'Failed to load response')
      }));
    } finally {
      setLoadingResponses(prev => ({ ...prev, [promptId]: false }));
    }
  };

  const handleCustomPromptAdded = async (responseData) => {
    console.log('🔄 CategoriesWithPrompts - Custom prompt added, refreshing data:', responseData);
    
    // First, refresh local category prompts
    await fetchCategoryPrompts();
    
    // Call parent's data update function to refresh entire dashboard (primary callback)
    if (onDataUpdate && typeof onDataUpdate === 'function') {
      console.log('🔄 CategoriesWithPrompts - Calling onDataUpdate callback');
      await onDataUpdate();
    }
    
    // Keep SOV update for backward compatibility (secondary callback)
    if (onSOVUpdate && typeof onSOVUpdate === 'function') {
      console.log('🔄 CategoriesWithPrompts - Calling onSOVUpdate callback');
      await onSOVUpdate();
    }
    
    // Auto-reload Brand Dashboard if user is on dashboard page
    if (apiService.triggerBrandDashboardReload) {
      apiService.triggerBrandDashboardReload();
    }
    
    console.log('✅ CategoriesWithPrompts - All refresh callbacks completed');
  };

  if (!categories || categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI-Powered Prospect Research</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No categories available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">AI-Powered Prospect Research</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {categories.length} categories
            </Badge>
            <AddCustomPrompt 
              categories={categories}
              onPromptAdded={handleCustomPromptAdded}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading categories and prompts...</p>
          </div>
        ) : (
          categories.map((category) => {
            const prompts = categoryPrompts[category._id] || [];
            const isExpanded = expandedCategory === category._id;
            
            return (
              <Card key={category._id} className="border-0 bg-muted/50">
                <CardContent className="p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => handleCategoryClick(category._id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-foreground">
                          {typeof category.categoryName === 'string' 
                            ? category.categoryName 
                            : 'Category'
                          }
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {prompts.length} prompts available
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {prompts.length}
                      </Badge>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      {prompts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No prompts available for this category
                        </p>
                      ) : (
                        prompts.map((prompt) => {
                          const hasResponse = promptResponses[prompt._id];
                          const isLoading = loadingResponses[prompt._id];
                          
                          return (
                            <Card key={prompt._id} className="border-0 bg-background">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <MessageSquare className="w-4 h-4 text-primary" />
                                      <h4 className="text-sm font-medium text-foreground">
                                        {getPromptText(prompt)}
                                      </h4>
                                    </div>
                                    
                                    {hasResponse && (
                                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <Clock className="w-3 h-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">AI Response</span>
                                        </div>
                                        <div className="text-sm text-foreground">
                                          {renderResponseContent(hasResponse)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePromptClick(prompt._id || prompt.id)}
                                    disabled={isLoading}
                                    className="ml-3 text-xs"
                                  >
                                    {isLoading ? (
                                      <div className="flex items-center space-x-1">
                                        <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading...</span>
                                      </div>
                                    ) : hasResponse ? (
                                      'Hide'
                                    ) : (
                                      'View'
                                    )}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default CategoriesWithPrompts;