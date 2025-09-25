import React, { useState, useEffect } from "react";
import { apiService } from "../utils/api";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ChevronDown, ChevronRight, MessageSquare, Sparkles, Clock } from 'lucide-react';
import AddCustomPrompt from '../components/AddCustomPrompt';
import DeletePromptModal from '../components/DeletePromptModal';
import { toast } from 'react-toastify';

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
  const [deletingPrompts, setDeletingPrompts] = useState({});

  // ✅ ENHANCED: Helper function to get prompt text safely with improved extraction
  const getPromptText = (prompt) => {
    console.log('🔍 DEBUG: Full prompt object:', prompt);
    console.log('🔍 DEBUG: Prompt keys:', Object.keys(prompt || {}));
    
    // ✅ FIX: Enhanced field extraction with more comprehensive fallbacks
    let text = null;
    
    // Primary fields (most common)
    if (!text) text = prompt.promptText;
    if (!text) text = prompt.question;
    if (!text) text = prompt.text;
    if (!text) text = prompt.prompt;
    if (!text) text = prompt.content;
    
    // ✅ FIX: Additional fields for Super User analyses
    if (!text) text = prompt.query;
    if (!text) text = prompt.description;
    if (!text) text = prompt.title;
    
    // ✅ FIX: Handle nested objects that might contain the text
    if (!text && prompt.promptData) {
      text = prompt.promptData.text || prompt.promptData.promptText || prompt.promptData.question;
    }
    
    // ✅ FIX: Handle array scenarios
    if (!text && Array.isArray(prompt.prompts) && prompt.prompts.length > 0) {
      text = prompt.prompts[0].text || prompt.prompts[0].promptText || prompt.prompts[0];
    }
    
    console.log('🔍 DEBUG: Extracted text:', text);
    console.log('🔍 DEBUG: Individual field values:', {
      promptText: prompt.promptText,
      question: prompt.question,
      text: prompt.text,
      prompt: prompt.prompt,
      content: prompt.content,
      query: prompt.query,
      description: prompt.description,
      title: prompt.title
    });
    
    // ✅ FIX: Validate text content more thoroughly
    if (text && typeof text === 'string' && text.trim()) {
      const cleanText = text.trim();
      // Don't show if it looks like an ID or is too short
      if (cleanText.length > 10 && !cleanText.match(/^[a-f0-9]{24}$/i) && !cleanText.startsWith('Prompt ')) {
        return cleanText.length > 150 ? cleanText.slice(0, 150) + '...' : cleanText;
      }
    }
    
    // ✅ FIX: Better fallback with more descriptive message
    console.log('❌ DEBUG: No valid text found, using enhanced fallback');
    if (prompt._id) {
      return `[Prompt ${prompt._id.slice(-6)}] - Click to view details`;
    }
    return '[Prompt Content] - Click to view details';
  };

  // ✅ ENHANCED: Helper function to render response content with improved extraction
  const renderResponseContent = (hasResponse) => {
    console.log('🔍 DEBUG: Response content received:', hasResponse);
    console.log('🔍 DEBUG: Response type:', typeof hasResponse);
    
    if (!hasResponse) {
      console.log('🔍 DEBUG: No response content available');
      return React.createElement('span', {className: 'text-muted-foreground italic'}, 'No response content');
    }
    
    if (typeof hasResponse === 'string') {
      if (hasResponse.startsWith('Error:')) {
        return React.createElement('span', {className: 'text-destructive'}, hasResponse);
      }
      if (hasResponse.trim() === '') {
        return React.createElement('span', {className: 'text-muted-foreground italic'}, 'Empty response');
      }
      // ✅ FIX: Check for the specific Super User error message  
      if (hasResponse.includes('Response not available - this should be preloaded')) {
        console.log('🔍 DEBUG: Found Super User preload error message - this indicates data extraction failed');
        return React.createElement('span', {className: 'text-orange-600 italic'}, 'Response data extraction failed - check console logs');
      }
      // ✅ FIX: Check for debug messages that indicate structural issues
      if (hasResponse.includes('[Response object available but no clear text content')) {
        return React.createElement('span', {className: 'text-orange-600 italic'}, 'Response structure unclear - see console for details');
      }
      return React.createElement('div', {className: 'whitespace-pre-wrap'}, hasResponse);
    }
    
    if (typeof hasResponse === 'object') {
      console.log('🔍 DEBUG: Response object keys:', Object.keys(hasResponse));
      
      // ✅ FIX: Use same field extraction logic as other functions for consistency
      let content = null;
      const possibleFields = [
        'responseText', 'content', 'text', 'message', 'response', 'data', 'aiResponseText'
      ];
      
      for (const field of possibleFields) {
        const fieldValue = hasResponse[field];
        if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
          content = fieldValue;
          console.log(`✅ DEBUG: Found content in field '${field}': ${content.substring(0, 100)}...`);
          break;
        }
      }
      
      // ✅ FIX: Check nested aiResponse structure
      if (!content && hasResponse.aiResponse) {
        const nestedResponse = hasResponse.aiResponse;
        if (typeof nestedResponse === 'string' && nestedResponse.trim()) {
          content = nestedResponse;
        } else if (nestedResponse && typeof nestedResponse === 'object') {
          for (const field of possibleFields) {
            const fieldValue = nestedResponse[field];
            if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
              content = fieldValue;
              break;
            }
          }
        }
      }
      
      if (content && typeof content === 'string' && content.trim()) {
        return React.createElement('div', {className: 'whitespace-pre-wrap'}, content);
      }
      
      // ✅ FIX: More informative fallback message
      console.log('🔍 DEBUG: No clear content found in object, available fields:', Object.keys(hasResponse));
      return React.createElement('div', 
        {className: 'whitespace-pre-wrap text-xs bg-yellow-50 p-2 rounded border'}, 
        `Response data structure found but content extraction failed. Available fields: ${Object.keys(hasResponse).join(', ')}. Check browser console for detailed debugging.`
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

  // ✅ CRITICAL DEBUG: Process categories with comprehensive response content logging
  const processCategoriesWithPrompts = () => {
    console.log('🔍 CRITICAL: Processing categories with prompts for response extraction');
    console.log('🔍 CRITICAL: Categories received:', categories);
    console.log('🔍 CRITICAL: Categories count:', categories?.length);
    console.log('🔍 CRITICAL: First category structure:', categories?.[0]);
    
    const promptsMap = {};
    
    categories.forEach((category, categoryIndex) => {
      console.log(`🔍 CRITICAL: Processing category ${categoryIndex}: ${category.categoryName || category.name}`);
      console.log(`🔍 CRITICAL: Category ${categoryIndex} full object:`, category);
      console.log(`🔍 CRITICAL: Category ${categoryIndex} prompts:`, category.prompts);
      console.log(`🔍 CRITICAL: Category ${categoryIndex} prompts count:`, category.prompts?.length || 0);
      
      if (category.prompts && Array.isArray(category.prompts)) {
        const processedPrompts = category.prompts.map((prompt, promptIndex) => {
          console.log(`🔍 CRITICAL: Processing prompt ${promptIndex} in category ${categoryIndex}`);
          console.log(`🔍 CRITICAL: Raw prompt object:`, prompt);
          console.log(`🔍 CRITICAL: Prompt ID: ${prompt._id}`);
          console.log(`🔍 CRITICAL: Prompt text: ${prompt.promptText}`);
          console.log(`🔍 CRITICAL: Prompt has aiResponse:`, !!prompt.aiResponse);
          
          if (prompt.aiResponse) {
            console.log(`🔍 CRITICAL: aiResponse structure:`, prompt.aiResponse);
            console.log(`🔍 CRITICAL: aiResponse keys:`, Object.keys(prompt.aiResponse));
            console.log(`🔍 CRITICAL: aiResponse.responseText:`, prompt.aiResponse.responseText?.substring(0, 100) + '...');
            console.log(`🔍 CRITICAL: aiResponse.content:`, prompt.aiResponse.content?.substring(0, 100) + '...');
            console.log(`🔍 CRITICAL: aiResponse.text:`, prompt.aiResponse.text?.substring(0, 100) + '...');
          }
          
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
          
          // ✅ CRITICAL FIX: Enhanced prompt processing for Super User data
          const processedPrompt = {
            ...prompt,
            _id: prompt._id || prompt.id || 'prompt_' + Math.random().toString(36).substr(2, 9),
            categoryId: category._id,
            // ✅ FIX: Ensure prompt text fields are populated
            promptText: prompt.promptText || prompt.text || prompt.question || prompt.prompt || prompt.content,
            text: prompt.text || prompt.promptText || prompt.question,
            question: prompt.question || prompt.promptText || prompt.text
          };
          
          console.log(`✅ CRITICAL: Processed prompt ${promptIndex}:`, {
            id: processedPrompt._id,
            promptText: processedPrompt.promptText?.substring(0, 50) + '...',
            hasAiResponse: !!processedPrompt.aiResponse,
            aiResponseKeys: processedPrompt.aiResponse ? Object.keys(processedPrompt.aiResponse) : []
          });
          return processedPrompt;
        });
        
        promptsMap[category._id] = processedPrompts;
        console.log(`✅ DEBUG: Mapped ${processedPrompts.length} prompts for category ${category.categoryName || category.name}`);
      } else {
        promptsMap[category._id] = [];
        console.log(`⚠️ DEBUG: No prompts found for category ${category.categoryName || category.name}`);
      }
    });
    
    setCategoryPrompts(promptsMap);
    console.log('✅ DEBUG: Category prompts set:', promptsMap);
    
    // ✅ CRITICAL DEBUG: Pre-populate responses with comprehensive extraction logic
    const initialResponses = {};
    console.log('🔍 CRITICAL: Starting response extraction from categories');
    console.log('🔍 CRITICAL: Categories for response extraction:', categories);
    
    categories.forEach((category, categoryIndex) => {
      console.log(`🔍 CRITICAL: Extracting responses from category ${categoryIndex}: ${category.categoryName || category.name}`);
      
      if (category.prompts && Array.isArray(category.prompts)) {
        console.log(`🔍 CRITICAL: Category ${categoryIndex} has ${category.prompts.length} prompts`);
        
        category.prompts.forEach((prompt, promptIndex) => {
          const promptId = prompt._id || prompt.id;
          console.log(`🔍 CRITICAL: Processing prompt ${promptIndex} (ID: ${promptId}) for response extraction`);
          console.log(`🔍 CRITICAL: Prompt ${promptIndex} aiResponse:`, prompt.aiResponse);
          
          if (promptId && prompt.aiResponse) {
            console.log(`🔍 CRITICAL: Prompt ${promptId} HAS aiResponse, attempting extraction`);
            console.log(`🔍 CRITICAL: aiResponse type:`, typeof prompt.aiResponse);
            console.log(`🔍 CRITICAL: aiResponse structure:`, prompt.aiResponse);
            console.log(`🔍 CRITICAL: aiResponse JSON:`, JSON.stringify(prompt.aiResponse, null, 2));
            console.log(`🔍 CRITICAL: aiResponse validation data:`, prompt.aiResponse._dataValidation);
            
            // ✅ CRITICAL FIX: Simplified and more robust response text extraction
            let responseText = null;
            
            if (typeof prompt.aiResponse === 'string' && prompt.aiResponse.trim()) {
              responseText = prompt.aiResponse;
              console.log(`✅ CRITICAL: Extracted response as string: ${responseText.substring(0, 100)}...`);
            } else if (prompt.aiResponse && typeof prompt.aiResponse === 'object') {
              console.log(`🔍 CRITICAL: aiResponse object keys:`, Object.keys(prompt.aiResponse));
              
              // ✅ CRITICAL FIX: Prioritize actual response fields and validate content
              const responseFields = [
                'responseText', 'aiResponseText', 'response'  // Primary: Most likely to contain actual AI response
              ];
              const genericFields = [
                'content', 'message', 'text', 'data'  // Secondary: Might contain prompt text
              ];
              
              // Get the original prompt text for validation
              const originalPromptText = prompt.promptText || prompt.text || prompt.question || prompt.prompt || '';
              console.log(`🔍 CRITICAL: Original prompt text for validation: ${originalPromptText.substring(0, 100)}...`);
              
              // ✅ SMART EXTRACTION: Use backend _dataValidation data for better decisions
              const backendValidation = prompt.aiResponse._dataValidation || {};
              console.log(`🔍 CRITICAL: Backend validation data:`, backendValidation);
              
              // Try response-specific fields first with smart validation
              for (const field of responseFields) {
                const fieldValue = prompt.aiResponse[field];
                if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
                  console.log(`🔍 CRITICAL: Testing field '${field}' - length: ${fieldValue.length}, prompt length: ${originalPromptText.length}`);
                  console.log(`🔍 CRITICAL: Field '${field}' content preview: ${fieldValue.substring(0, 100)}...`);
                  console.log(`🔍 CRITICAL: Original prompt preview: ${originalPromptText.substring(0, 100)}...`);
                  
                  // ✅ SMART VALIDATION: Multiple validation approaches
                  let isValidResponse = false;
                  let validationReason = '';
                  
                  // Method 1: Use backend validation data if available
                  if (backendValidation.hasResponseText && field === 'responseText') {
                    isValidResponse = true;
                    validationReason = 'backend validation confirms responseText exists';
                  }
                  // Method 2: Length-based validation for long responses (backend shows 2287+ chars)
                  else if (fieldValue.length > 1000) {
                    isValidResponse = true;
                    validationReason = `long response (${fieldValue.length} chars) likely valid`;
                  }
                  // Method 3: Original strict validation as fallback
                  else if (fieldValue !== originalPromptText && fieldValue.length > originalPromptText.length + 50) {
                    isValidResponse = true;
                    validationReason = 'strict validation passed';
                  }
                  
                  if (isValidResponse) {
                    responseText = fieldValue;
                    console.log(`✅ CRITICAL: Found VALIDATED response in field '${field}': ${responseText.substring(0, 100)}... (reason: ${validationReason})`);
                    break;
                  } else {
                    console.log(`⚠️ CRITICAL: Field '${field}' failed all validation methods`);
                    console.log(`   - Backend validation: ${backendValidation.hasResponseText && field === 'responseText'}`);
                    console.log(`   - Length validation (>1000): ${fieldValue.length > 1000}`);
                    console.log(`   - Strict validation: ${fieldValue !== originalPromptText && fieldValue.length > originalPromptText.length + 50}`);
                  }
                }
              }
              
              // If no response-specific field worked, try generic fields with smart validation
              if (!responseText) {
                console.log(`🔍 CRITICAL: No response-specific field found, trying generic fields with smart validation`);
                for (const field of genericFields) {
                  const fieldValue = prompt.aiResponse[field];
                  if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
                    console.log(`🔍 CRITICAL: Testing generic field '${field}' - length: ${fieldValue.length}`);
                    
                    // ✅ SMART VALIDATION for generic fields
                    let isValidResponse = false;
                    let validationReason = '';
                    
                    // Method 1: Very long responses are likely valid (backend shows 2287+ chars)
                    if (fieldValue.length > 1500) {
                      isValidResponse = true;
                      validationReason = `very long content (${fieldValue.length} chars) likely valid response`;
                    }
                    // Method 2: Original strict validation for generic fields
                    else if (fieldValue !== originalPromptText && 
                             fieldValue.length > originalPromptText.length + 100 &&
                             !fieldValue.startsWith(originalPromptText)) {
                      isValidResponse = true;
                      validationReason = 'strict generic validation passed';
                    }
                    
                    if (isValidResponse) {
                      responseText = fieldValue;
                      console.log(`✅ CRITICAL: Found VALIDATED response in generic field '${field}': ${responseText.substring(0, 100)}... (reason: ${validationReason})`);
                      break;
                    } else {
                      console.log(`⚠️ CRITICAL: Generic field '${field}' failed validation`);
                      console.log(`   - Length validation (>1500): ${fieldValue.length > 1500}`);
                      console.log(`   - Field length: ${fieldValue.length}, Prompt length: ${originalPromptText.length}`);
                      console.log(`   - Starts with prompt: ${fieldValue.startsWith(originalPromptText)}`);
                    }
                  }
                }
              }
              
              // If no string field found, check for nested objects with validation
              if (!responseText && prompt.aiResponse.aiResponse) {
                console.log(`🔍 CRITICAL: Trying nested aiResponse structure`);
                const nestedResponse = prompt.aiResponse.aiResponse;
                
                if (typeof nestedResponse === 'string' && nestedResponse.trim()) {
                  // Smart validation for nested string response
                  if (nestedResponse.length > 1000 || 
                      (nestedResponse !== originalPromptText && nestedResponse.length > originalPromptText.length + 50)) {
                    responseText = nestedResponse;
                    console.log(`✅ CRITICAL: Found VALIDATED nested string response: ${responseText.substring(0, 100)}...`);
                  } else {
                    console.log(`⚠️ CRITICAL: Nested string response failed validation (likely prompt text)`);
                  }
                } else if (nestedResponse && typeof nestedResponse === 'object') {
                  console.log(`🔍 CRITICAL: Processing nested response object`);
                  
                  // Try response-specific fields first in nested object
                  for (const field of responseFields) {
                    const fieldValue = nestedResponse[field];
                    if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
                      if (fieldValue !== originalPromptText && fieldValue.length > originalPromptText.length + 50) {
                        responseText = fieldValue;
                        console.log(`✅ CRITICAL: Found VALIDATED response in nested field '${field}': ${responseText.substring(0, 100)}...`);
                        break;
                      }
                    }
                  }
                  
                  // Try generic fields in nested object if needed
                  if (!responseText) {
                    for (const field of genericFields) {
                      const fieldValue = nestedResponse[field];
                      if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
                        if (fieldValue !== originalPromptText && 
                            fieldValue.length > originalPromptText.length + 100 &&
                            !fieldValue.startsWith(originalPromptText)) {
                          responseText = fieldValue;
                          console.log(`✅ CRITICAL: Found VALIDATED response in nested generic field '${field}': ${responseText.substring(0, 100)}...`);
                          break;
                        }
                      }
                    }
                  }
                }
              }
              
              if (!responseText) {
                // ✅ EMERGENCY FALLBACK: Extract any long field as response
                console.log(`⚠️ CRITICAL: Smart validation failed, trying emergency fallback`);
                const allFields = [...responseFields, ...genericFields];
                
                for (const field of Object.keys(prompt.aiResponse)) {
                  const fieldValue = prompt.aiResponse[field];
                  if (fieldValue && typeof fieldValue === 'string' && fieldValue.length > 500) {
                    responseText = fieldValue;
                    console.log(`✅ EMERGENCY: Using field '${field}' with ${fieldValue.length} characters as response`);
                    break;
                  }
                }
                
                if (!responseText) {
                  console.log(`⚠️ CRITICAL: No valid response text found. Available fields:`, Object.keys(prompt.aiResponse));
                  console.log(`🔍 CRITICAL: Field values:`, allFields.map(f => ({ 
                    [f]: prompt.aiResponse[f] ? `${typeof prompt.aiResponse[f]} (${String(prompt.aiResponse[f]).substring(0, 30)}...)` : 'undefined'
                  })));
                }
              }
            }
            
            console.log(`🔍 CRITICAL: Final extracted response for ${promptId}:`, responseText ? responseText.substring(0, 100) + '...' : 'NOT FOUND');
            
            if (responseText && typeof responseText === 'string' && responseText.trim()) {
              initialResponses[promptId] = responseText;
              console.log(`✅ CRITICAL: Successfully pre-populated response for prompt ${promptId} (length: ${responseText.length})`);
            } else {
              console.log(`⚠️ CRITICAL: Failed to extract valid response text for prompt ${promptId}`);
            }
          } else {
            console.log(`⚠️ CRITICAL: Prompt ${promptId} does NOT have aiResponse`);
          }
        });
      } else {
        console.log(`⚠️ CRITICAL: Category ${categoryIndex} does not have prompts array`);
      }
    });
    
    console.log('🔍 DEBUG: Final initialResponses object:', initialResponses);
    console.log('🔍 DEBUG: Number of pre-populated responses:', Object.keys(initialResponses).length);
    
    if (Object.keys(initialResponses).length > 0) {
      console.log('✅ DEBUG: Setting pre-populated responses');
      setPromptResponses(initialResponses);
    } else {
      console.log('⚠️ DEBUG: No initial responses found - this may cause loading issues');
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
            // ✅ FIX: Use the same SMART VALIDATED extraction logic as processCategoriesWithPrompts
            const originalPromptText = prompt.promptText || prompt.text || prompt.question || prompt.prompt || '';
            const backendValidation = prompt.aiResponse._dataValidation || {};
            console.log(`🔍 DEBUG: Original prompt for validation: ${originalPromptText.substring(0, 50)}...`);
            console.log(`🔍 DEBUG: Backend validation data:`, backendValidation);
            
            if (typeof prompt.aiResponse === 'string' && prompt.aiResponse.trim()) {
              // Smart validation for string response
              if (prompt.aiResponse.length > 1000 || 
                  (prompt.aiResponse !== originalPromptText && prompt.aiResponse.length > originalPromptText.length + 50)) {
                responseContent = prompt.aiResponse;
                console.log(`✅ DEBUG: Found VALIDATED string response: ${responseContent.substring(0, 100)}...`);
              } else {
                console.log(`⚠️ DEBUG: String aiResponse failed validation (likely prompt text)`);
              }
            } else if (prompt.aiResponse && typeof prompt.aiResponse === 'object') {
              const responseFields = [
                'responseText', 'aiResponseText', 'response'
              ];
              const genericFields = [
                'content', 'message', 'text', 'data'
              ];
              
              // Try response-specific fields first with smart validation
              for (const field of responseFields) {
                const fieldValue = prompt.aiResponse[field];
                if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
                  console.log(`🔍 DEBUG: Testing field '${field}' - length: ${fieldValue.length}`);
                  
                  // Smart validation like in processCategoriesWithPrompts
                  let isValidResponse = false;
                  let validationReason = '';
                  
                  if (backendValidation.hasResponseText && field === 'responseText') {
                    isValidResponse = true;
                    validationReason = 'backend validation confirms responseText exists';
                  } else if (fieldValue.length > 1000) {
                    isValidResponse = true;
                    validationReason = `long response (${fieldValue.length} chars) likely valid`;
                  } else if (fieldValue !== originalPromptText && fieldValue.length > originalPromptText.length + 50) {
                    isValidResponse = true;
                    validationReason = 'strict validation passed';
                  }
                  
                  if (isValidResponse) {
                    responseContent = fieldValue;
                    console.log(`✅ DEBUG: Found VALIDATED response in field '${field}': ${responseContent.substring(0, 100)}... (reason: ${validationReason})`);
                    break;
                  } else {
                    console.log(`⚠️ DEBUG: Field '${field}' failed all validation methods`);
                  }
                }
              }
              
              // Try generic fields with stricter validation if needed
              if (!responseContent) {
                for (const field of genericFields) {
                  const fieldValue = prompt.aiResponse[field];
                  if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
                    if (fieldValue !== originalPromptText && 
                        fieldValue.length > originalPromptText.length + 100 &&
                        !fieldValue.startsWith(originalPromptText)) {
                      responseContent = fieldValue;
                      console.log(`✅ DEBUG: Found VALIDATED response in generic field '${field}': ${responseContent.substring(0, 100)}...`);
                      break;
                    } else {
                      console.log(`⚠️ DEBUG: Generic field '${field}' failed validation`);
                    }
                  }
                }
              }
              
              // Check nested structure with validation if no direct field found
              if (!responseContent && prompt.aiResponse.aiResponse) {
                console.log(`🔍 DEBUG: Trying nested aiResponse with validation`);
                const nestedResponse = prompt.aiResponse.aiResponse;
                
                if (typeof nestedResponse === 'string' && nestedResponse.trim()) {
                  if (nestedResponse !== originalPromptText && nestedResponse.length > originalPromptText.length + 50) {
                    responseContent = nestedResponse;
                    console.log(`✅ DEBUG: Found VALIDATED nested string response`);
                  }
                } else if (nestedResponse && typeof nestedResponse === 'object') {
                  // Try response fields in nested structure
                  for (const field of responseFields) {
                    const fieldValue = nestedResponse[field];
                    if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
                      if (fieldValue !== originalPromptText && fieldValue.length > originalPromptText.length + 50) {
                        responseContent = fieldValue;
                        console.log(`✅ DEBUG: Found VALIDATED nested response in '${field}'`);
                        break;
                      }
                    }
                  }
                }
              }
              
              // ✅ EMERGENCY FALLBACK: Extract any long field as response
              if (!responseContent) {
                console.log('🔍 DEBUG: Smart validation failed, trying emergency fallback');
                for (const field of Object.keys(prompt.aiResponse)) {
                  const fieldValue = prompt.aiResponse[field];
                  if (fieldValue && typeof fieldValue === 'string' && fieldValue.length > 500) {
                    responseContent = fieldValue;
                    console.log(`✅ EMERGENCY: Using field '${field}' with ${fieldValue.length} characters as response`);
                    break;
                  }
                }
                
                if (!responseContent) {
                  console.log('🔍 DEBUG: No VALIDATED response text found, object keys:', Object.keys(prompt.aiResponse));
                  responseContent = `[Response validation failed - likely contains prompt text instead of AI response. Check console for details.]`;
                }
              }
            }
            
            console.log('✅ DEBUG: Final response content:', responseContent?.substring(0, 100));
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
    
    // ✅ FIX: Enhanced Super User handling with comprehensive fallback options
    if (isSuperUser) {
      console.log('⚠️ DEBUG: Super User analysis - no cached response found, trying COMPREHENSIVE extraction methods');
      
      // ✅ FIX: Try to extract response from different data structures with ENHANCED logic
      let fallbackResponse = null;
      
      // Look for response in the categories data again with different approaches
      for (const category of categories) {
        if (category.prompts && Array.isArray(category.prompts)) {
          for (const prompt of category.prompts) {
            if ((prompt._id === promptId || prompt.id === promptId)) {
              console.log('🔍 DEBUG: Re-examining prompt for Super User response:', prompt);
              console.log('🔍 DEBUG: Prompt keys for extraction:', Object.keys(prompt));
              
              // ✅ ENHANCED: Use the same validated extraction logic
              const responseFields = [
                'responseText', 'aiResponseText', 'response'
              ];
              const genericFields = [
                'content', 'message', 'text', 'data'
              ];
              
              // Get original prompt text for validation
              const originalPromptText = prompt.promptText || prompt.text || prompt.question || prompt.prompt || '';
              console.log(`🔍 DEBUG: Original prompt for Super User fallback validation: ${originalPromptText.substring(0, 50)}...`);
              
              // Try response-specific fields first with validation
              for (const field of responseFields) {
                const fieldValue = prompt[field];
                if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
                  if (fieldValue !== originalPromptText && fieldValue.length > originalPromptText.length + 50) {
                    fallbackResponse = fieldValue;
                    console.log(`✅ DEBUG: Found VALIDATED fallback response in field '${field}': ${fallbackResponse.substring(0, 100)}...`);
                    break;
                  } else {
                    console.log(`⚠️ DEBUG: Super User field '${field}' failed validation (likely prompt text)`);
                  }
                }
              }
              
              // Try generic fields with stricter validation if needed
              if (!fallbackResponse) {
                for (const field of genericFields) {
                  const fieldValue = prompt[field];
                  if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
                    if (fieldValue !== originalPromptText && 
                        fieldValue.length > originalPromptText.length + 100 &&
                        !fieldValue.startsWith(originalPromptText)) {
                      fallbackResponse = fieldValue;
                      console.log(`✅ DEBUG: Found VALIDATED fallback response in generic field '${field}': ${fallbackResponse.substring(0, 100)}...`);
                      break;
                    } else {
                      console.log(`⚠️ DEBUG: Super User generic field '${field}' failed validation`);
                    }
                  }
                }
              }
              
              // ✅ NEW: Check if prompt has a responses array with validation
              if (!fallbackResponse && prompt.responses && Array.isArray(prompt.responses) && prompt.responses.length > 0) {
                console.log('🔍 DEBUG: Checking responses array for Super User fallback');
                const firstResponse = prompt.responses[0];
                
                if (typeof firstResponse === 'string' && firstResponse.trim()) {
                  // Validate responses array string
                  if (firstResponse !== originalPromptText && firstResponse.length > originalPromptText.length + 50) {
                    fallbackResponse = firstResponse;
                    console.log('✅ DEBUG: Found VALIDATED fallback response in responses array (string)');
                  } else {
                    console.log('⚠️ DEBUG: Responses array string failed validation (likely prompt text)');
                  }
                } else if (firstResponse && typeof firstResponse === 'object') {
                  // Try response-specific fields first in responses array
                  for (const field of responseFields) {
                    const fieldValue = firstResponse[field];
                    if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
                      if (fieldValue !== originalPromptText && fieldValue.length > originalPromptText.length + 50) {
                        fallbackResponse = fieldValue;
                        console.log(`✅ DEBUG: Found VALIDATED fallback response in responses[0].${field}`);
                        break;
                      }
                    }
                  }
                  
                  // Try generic fields if needed
                  if (!fallbackResponse) {
                    for (const field of genericFields) {
                      const fieldValue = firstResponse[field];
                      if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
                        if (fieldValue !== originalPromptText && 
                            fieldValue.length > originalPromptText.length + 100 &&
                            !fieldValue.startsWith(originalPromptText)) {
                          fallbackResponse = fieldValue;
                          console.log(`✅ DEBUG: Found VALIDATED fallback response in responses[0] generic field '${field}'`);
                          break;
                        }
                      }
                    }
                  }
                }
              }
              
              if (fallbackResponse) break;
            }
          }
          if (fallbackResponse) break;
        }
      }
      
      if (fallbackResponse && typeof fallbackResponse === 'string' && fallbackResponse.trim().length > 10) {
        console.log(`✅ DEBUG: Using enhanced fallback response (length: ${fallbackResponse.length})`);
        setPromptResponses(prev => ({
          ...prev,
          [promptId]: fallbackResponse
        }));
        return;
      }
      
      console.log('❌ DEBUG: Super User analysis - COMPREHENSIVE extraction failed, all methods exhausted');
      console.log('🔍 DEBUG: Categories structure for debugging:', categories.map(cat => ({
        name: cat.categoryName,
        promptsCount: cat.prompts?.length || 0,
        firstPromptKeys: cat.prompts?.[0] ? Object.keys(cat.prompts[0]) : []
      })));
      
      setPromptResponses(prev => ({
        ...prev,
        [promptId]: 'Response extraction failed - check browser console for detailed analysis structure debugging'
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

  const handleDeletePrompt = async (promptId, categoryName) => {
    try {
      setDeletingPrompts(prev => ({ ...prev, [promptId]: true }));
      
      console.log(`🗑️ Deleting prompt: ${promptId} (${isSuperUser ? 'Super User' : 'Normal User'})`);
      
      let response;
      if (isSuperUser && analysisId) {
        // Super User deletion with analysis isolation
        response = await apiService.deleteSuperUserPrompt(analysisId, promptId);
        toast.success('Prompt deleted and analysis SOV recalculated successfully!');
      } else {
        // Normal user deletion
        response = await apiService.deletePrompt(promptId);
        toast.success('Prompt deleted and SOV recalculated successfully!');
      }
      
      console.log('✅ Prompt deleted successfully:', response.data);
      
      // Remove from local state
      setCategoryPrompts(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(categoryId => {
          updated[categoryId] = updated[categoryId].filter(p => p._id !== promptId);
        });
        return updated;
      });
      
      // Clear any cached response
      setPromptResponses(prev => {
        const updated = { ...prev };
        delete updated[promptId];
        return updated;
      });
      
      // Trigger parent data refresh to update SOV display
      if (onDataUpdate && typeof onDataUpdate === 'function') {
        console.log('🔄 Triggering parent data update after prompt deletion');
        await onDataUpdate();
      }
      
      if (onSOVUpdate && typeof onSOVUpdate === 'function') {
        console.log('🔄 Triggering SOV update after prompt deletion');
        await onSOVUpdate();
      }
      
      // Auto-reload Brand Dashboard for normal users
      if (!isSuperUser && apiService.triggerBrandDashboardReload) {
        apiService.triggerBrandDashboardReload();
      }
      
    } catch (error) {
      console.error('❌ Error deleting prompt:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete prompt';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setDeletingPrompts(prev => ({ ...prev, [promptId]: false }));
    }
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
                                  
                                  <div className="flex items-center space-x-2 ml-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePromptClick(prompt._id || prompt.id)}
                                      disabled={isLoading || deletingPrompts[prompt._id]}
                                      className="text-xs"
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
                                    
                                    <DeletePromptModal
                                      promptText={getPromptText(prompt)}
                                      categoryName={category.categoryName}
                                      onConfirm={() => handleDeletePrompt(prompt._id, category.categoryName)}
                                      isDeleting={deletingPrompts[prompt._id]}
                                      isSuperUser={isSuperUser}
                                    />
                                  </div>
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