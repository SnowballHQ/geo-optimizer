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
  isSuperUser = false, 
  analysisId = null 
}) => {
  const [categoryPrompts, setCategoryPrompts] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [promptResponses, setPromptResponses] = useState({});
  const [loadingResponses, setLoadingResponses] = useState({});

  // Debug logging
  console.log("CategoriesWithPrompts received props:", {
    categories,
    brandId,
    isSuperUser,
    analysisId,
    categoriesLength: categories?.length,
    categoriesType: typeof categories,
    categoriesIsArray: Array.isArray(categories),
    firstCategory: categories?.[0] || null,
    firstCategoryKeys: categories?.[0] ? Object.keys(categories[0]) : null
  });

  useEffect(() => {
    if (categories && categories.length > 0) {
      // Check if categories already have prompts data (from backend)
      const hasPromptsData = categories.some(cat => cat.prompts && Array.isArray(cat.prompts));
      
      console.log("🔍 Categories data check:", {
        hasPromptsData,
        categoriesWithPrompts: categories.filter(cat => cat.prompts && Array.isArray(cat.prompts)).length,
        totalCategories: categories.length
      });
      
      if (hasPromptsData) {
        console.log("✅ Categories already have prompts data from backend, using directly");
        processCategoriesWithPrompts();
      } else if (brandId) {
        console.log("⚠️ Categories don't have prompts data, fetching from API");
        fetchCategoryPrompts();
      }
    } else {
      console.log("❌ No categories data received");
    }
  }, [categories, brandId]);

  const processCategoriesWithPrompts = () => {
    console.log("Processing categories with existing prompts data");
    console.log("Raw categories data:", categories);
    
    const promptsMap = {};
    
    categories.forEach(category => {
      console.log(`Processing category:`, {
        id: category._id,
        name: category.categoryName,
        hasPrompts: !!category.prompts,
        promptsLength: category.prompts?.length || 0,
        promptsData: category.prompts
      });
      
      if (category.prompts && Array.isArray(category.prompts)) {
        promptsMap[category._id] = category.prompts;
        console.log(`Category ${category.categoryName || category._id}: ${category.prompts.length} prompts`);
        
        // Log the first prompt structure for debugging
        if (category.prompts.length > 0) {
          console.log(`First prompt structure:`, category.prompts[0]);
        }
      } else {
        promptsMap[category._id] = [];
        console.log(`Category ${category.categoryName || category._id}: No prompts data`);
      }
    });
    
    console.log('Final prompts map:', promptsMap);
    setCategoryPrompts(promptsMap);
  };

  const fetchCategoryPrompts = async () => {
    setLoading(true);
    try {
      // Make a single API call for all categories instead of multiple calls
      console.log(`Fetching prompts for ${categories.length} categories in a single request`);
      
      // Create a batch request for all categories
      const categoryIds = categories.map(cat => cat._id);
      console.log('Category IDs to fetch:', categoryIds);
      
      // For now, we'll make individual calls but with better error handling
      // TODO: Create a batch endpoint in the backend
      const promises = categories.map(async (category) => {
        try {
          console.log(`Fetching prompts for category: ${category._id} (${category.categoryName})`);
          const response = await apiService.getCategoryPrompts(category._id);
          console.log(`Response for category ${category._id}:`, response.data);
          
          // Handle different response structures
          let prompts = [];
          if (response.data && Array.isArray(response.data)) {
            // Direct array response
            prompts = response.data;
          } else if (response.data && Array.isArray(response.data.prompts)) {
            // Object with prompts property
            prompts = response.data.prompts;
          } else if (response.data && response.data.data && Array.isArray(response.data.data.prompts)) {
            // Nested data structure
            prompts = response.data.data.prompts;
          }
          
          console.log(`Extracted ${prompts.length} prompts for category ${category._id}`);
          return { categoryId: category._id, prompts: prompts };
        } catch (error) {
          console.error(`Error fetching prompts for category ${category._id}:`, error);
          return { categoryId: category._id, prompts: [] };
        }
      });

      const results = await Promise.all(promises);
      const promptsMap = {};
      results.forEach(result => {
        promptsMap[result.categoryId] = result.prompts;
        console.log(`Category ${result.categoryId}: ${result.prompts.length} prompts`);
      });
      console.log('Final prompts map:', promptsMap);
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
    // If response is already loaded, toggle it
    if (promptResponses[promptId]) {
      setPromptResponses(prev => {
        const newState = { ...prev };
        delete newState[promptId];
        return newState;
      });
      return;
    }

    // Check if we already have the response data from the backend
    let responseContent = '';
    
    // Search through all categories to find the prompt with its response
    for (const category of categories) {
      if (category.prompts && Array.isArray(category.prompts)) {
        const prompt = category.prompts.find(p => p._id === promptId);
        if (prompt && prompt.aiResponse) {
          console.log(`✅ Found AI response in backend data for prompt: ${promptId}`);
          
          // Use the response data that's already available
          if (prompt.aiResponse.responseText) {
            responseContent = prompt.aiResponse.responseText;
          } else if (prompt.aiResponse.message) {
            responseContent = prompt.aiResponse.message;
          } else {
            responseContent = JSON.stringify(prompt.aiResponse, null, 2);
          }
          
          setPromptResponses(prev => ({
            ...prev,
            [promptId]: responseContent
          }));
          return; // Exit early since we found the data
        }
      }
    }
    
    // If we don't have the response data, fall back to API call
    console.log(`⚠️ AI response not found in backend data, fetching from API for prompt: ${promptId}`);
    setLoadingResponses(prev => ({ ...prev, [promptId]: true }));

    try {
      console.log(`🔍 Fetching response for prompt: ${promptId}`);
      const response = await apiService.getPromptResponse(promptId);
      console.log(`✅ Response received for prompt ${promptId}:`, response.data);
      console.log(`🔍 Response structure:`, {
        hasData: !!response.data,
        dataType: typeof response.data,
        hasSuccess: response.data?.success,
        hasResponseText: !!response.data?.responseText,
        responseTextLength: response.data?.responseText?.length || 0,
        fullResponseData: response.data
      });
      
      // Handle the simplified response structure
      if (response.data && response.data.success && response.data.responseText) {
        // Backend now returns clean structure with responseText
        responseContent = response.data.responseText;
        console.log(`✅ Using responseText: ${responseContent.substring(0, 100)}...`);
      } else if (response.data && response.data.message) {
        // No response available
        responseContent = response.data.message;
        console.log(`⚠️ Using message: ${responseContent}`);
      } else {
        // Fallback for unexpected response format
        responseContent = 'No response content available';
        console.log(`❌ No valid response structure found, using fallback`);
      }
      
      console.log(`🔍 Final responseContent:`, {
        content: responseContent,
        type: typeof responseContent,
        length: responseContent.length
      });
      
      // Ensure we always have a string
      if (typeof responseContent !== 'string') {
        responseContent = JSON.stringify(responseContent, null, 2);
      }
      
      setPromptResponses(prev => {
        const newState = {
          ...prev,
          [promptId]: responseContent
        };
        console.log(`🔍 Updating promptResponses state:`, {
          promptId,
          responseContent,
          newState,
          prevState: prev
        });
        return newState;
      });
    } catch (error) {
      console.error(`❌ Error fetching response for prompt ${promptId}:`, error);
      setPromptResponses(prev => ({
        ...prev,
        [promptId]: `Error: ${error.response?.data?.message || error.message || 'Failed to load response'}`
      }));
    } finally {
      setLoadingResponses(prev => ({ ...prev, [promptId]: false }));
    }
  };

  const handleDebugClick = async () => {
    console.log('🔧 Debug: Current state:', {
      categories,
      categoryPrompts,
      expandedCategory,
      promptResponses,
      loadingResponses
    });
  };

  const handleCustomPromptAdded = (responseData) => {
    console.log('🎉 Custom prompt added successfully:', responseData);
    
    // Refresh the category prompts data
    fetchCategoryPrompts();
    
    // Trigger SOV data refresh if callback provided
    if (onSOVUpdate && typeof onSOVUpdate === 'function') {
      console.log('🔄 Triggering SOV data refresh after custom prompt...');
      onSOVUpdate();
    }
    
    // Optionally show a success message
    console.log('✅ Data refreshed after custom prompt addition');
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDebugClick}
              className="text-xs"
            >
              Debug
            </Button>
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
                          
                          console.log(`🔍 Rendering prompt ${prompt._id}:`, {
                            hasResponse,
                            responseType: typeof hasResponse,
                            responseLength: hasResponse?.length || 0,
                            isLoading
                          });
                          
                          return (
                            <Card key={prompt._id} className="border-0 bg-background">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <MessageSquare className="w-4 h-4 text-primary" />
                                      <h4 className="text-sm font-medium text-foreground">
                                        {typeof (prompt.promptText || prompt.question) === 'string' 
                                          ? (prompt.promptText || prompt.question) 
                                          : 'Prompt'
                                        }
                                      </h4>
                                    </div>
                                    
                                    {hasResponse && (
                                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <Clock className="w-3 h-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">AI Response</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {typeof hasResponse === 'string' && hasResponse.startsWith('Error:') ? (
                                            <span className="text-destructive">{hasResponse}</span>
                                          ) : typeof hasResponse === 'string' ? (
                                            <div className="whitespace-pre-wrap">{hasResponse}</div>
                                          ) : (
                                            <div className="whitespace-pre-wrap">
                                              {JSON.stringify(hasResponse, null, 2)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePromptClick(prompt._id)}
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