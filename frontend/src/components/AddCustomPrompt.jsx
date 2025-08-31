import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Sparkles, Send, X, ChevronDown } from 'lucide-react';
import { apiService } from '../utils/api';

const AddCustomPrompt = ({ categories, onPromptAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Create dropdown options with user's categories + "Other"
  const categoryOptions = [
    ...categories.map(cat => ({ value: cat._id, label: cat.categoryName })),
    { value: 'other', label: 'Other' }
  ];

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
  };

  const handleEnhancePrompt = async () => {
    if (!promptText.trim()) {
      setError('Please enter a prompt first');
      return;
    }

    try {
      setIsEnhancing(true);
      setError('');
      
      const response = await apiService.enhancePrompt({ 
        promptText: promptText.trim() 
      });
      
      if (response.data.success) {
        setPromptText(response.data.enhancedPrompt);
      } else {
        setError('Failed to enhance prompt');
      }
    } catch (error) {
      console.error('Prompt enhancement failed:', error);
      setError('Failed to enhance prompt. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }
    
    if (!promptText.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // Step 1: Create the custom prompt
      const createResponse = await apiService.addCustomPrompt({
        categoryId: selectedCategory.value,
        categoryName: selectedCategory.value === 'other' ? 'Other' : selectedCategory.label,
        promptText: promptText.trim()
      });

      if (createResponse.data.success) {
        const promptId = createResponse.data.promptId;
        
        // Step 2: Generate response and update SOV (this will blur the screen)
        const generateResponse = await apiService.generateCustomResponse(promptId);
        
        if (generateResponse.data.success) {
          // Close the modal and notify parent
          setIsOpen(false);
          resetForm();
          
          // Notify parent component to refresh data
          onPromptAdded(generateResponse.data);
          
          // Auto-reload Brand Dashboard if user is on dashboard page
          apiService.triggerBrandDashboardReload();
        } else {
          setError('Failed to generate response');
        }
      } else {
        setError('Failed to create prompt');
      }
    } catch (error) {
      console.error('Custom prompt creation failed:', error);
      setError('Failed to create custom prompt. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedCategory('');
    setPromptText('');
    setError('');
    setShowCategoryDropdown(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const selectedCategoryLabel = selectedCategory ? selectedCategory.label : 'Select category';

  return (
    <>
      {/* Add Prompt Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-primary-500 hover:bg-primary-600 text-white flex items-center gap-2"
        size="sm"
      >
        <Plus className="w-4 h-4" />
        Add Custom Prompt
      </Button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Custom Prompt</h3>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Category Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category
              </label>
              <div className="relative">
                <Button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  variant="outline"
                  className="w-full justify-between text-left"
                  disabled={isProcessing}
                >
                  <span className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedCategoryLabel}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>

                {/* Dropdown */}
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    {categoryOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleCategorySelect(option)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Prompt Text Area */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Prompt
              </label>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={4}
                placeholder="Enter your custom search prompt..."
                disabled={isProcessing}
              />
              
              {/* Enhance Button */}
              <div className="mt-2">
                <Button
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || isProcessing || !promptText.trim()}
                  variant="outline"
                  size="sm"
                  className="text-primary-500 border-primary-500 hover:bg-primary-50"
                >
                  {isEnhancing ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-2" />
                      Enhance with AI
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                onClick={handleClose}
                variant="outline"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isProcessing || !selectedCategory || !promptText.trim()}
                className="bg-primary-500 hover:bg-primary-600 text-white"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Generate Response
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Overlay (blurs entire screen) */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <div>
                <p className="font-medium text-gray-900">Processing your prompt...</p>
                <p className="text-sm text-gray-600">Generating response and updating analysis</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddCustomPrompt;