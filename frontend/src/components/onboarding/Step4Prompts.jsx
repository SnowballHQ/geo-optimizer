import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/api';
import { Button } from '../ui/button';
import { MessageSquare, Sparkles, Check, Edit2, Save, X } from 'lucide-react';

const Step4Prompts = ({ onComplete, loading, error, progress, isSuperUser = false, skipApiCall = false }) => {
  const [prompts, setPrompts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (progress?.step4?.promptsGenerated) {
      setPrompts(['Prompts generated successfully']);
    }
  }, [progress]);

  const handleGeneratePrompts = async () => {
    try {
      setIsGenerating(true);
      
      let response;
      
      // For Super User analyses, use the isolated prompt generation endpoint
      if (isSuperUser && progress?.analysisId) {
        console.log('🔥 Super User: Using isolated prompt generation endpoint');
        response = await apiService.post('/api/v1/super-user/analysis/generate-prompts', {
          analysisId: progress.analysisId
        });
      } else {
        // Regular user flow
        response = await apiService.step4Prompts({});
      }
      
      console.log('📝 Prompts response:', response.data);
      
      if (response.data.success) {
        // Check if prompts is an array and has the expected structure
        if (response.data.prompts && Array.isArray(response.data.prompts)) {
          const promptTexts = response.data.prompts.map(p => p.promptText);
          console.log('📝 Extracted prompt texts:', promptTexts);
          setPrompts(promptTexts);
        } else {
          console.error('❌ Unexpected prompts structure:', response.data.prompts);
          alert('Prompts were generated but could not be displayed. Check console for details.');
        }
      }
    } catch (error) {
      console.error('Prompts generation failed:', error);
      alert('Failed to generate prompts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditPrompt = (index) => {
    setEditingIndex(index);
    setEditValue(prompts[index]);
  };

  const handleSaveEdit = async () => {
    if (editValue.trim()) {
      setIsSavingEdit(true);
      const newPrompts = [...prompts];
      newPrompts[editingIndex] = editValue.trim();
      setPrompts(newPrompts);
      
      // Save the edited prompts to backend
      try {
        const response = await apiService.step4Prompts({ prompts: newPrompts });
        if (response.data.success) {
          console.log('✅ Prompts updated successfully');
        }
      } catch (error) {
        console.error('❌ Failed to save edited prompts:', error);
        // Note: We don't show an error to user as the local state is updated
        // and they can continue with the onboarding
      } finally {
        setIsSavingEdit(false);
      }
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleComplete = async () => {
    try {
      setIsSaving(true);
      
      // For Super User isolated analyses, skip the regular API call
      if (skipApiCall) {
        console.log('🔥 Super User: Skipping regular step4Prompts API call for isolated analysis');
        onComplete({
          step4: {
            promptsGenerated: prompts.length > 0,
            prompts: prompts, // Send the edited prompts
            completed: true
          }
        }, 5);
        return;
      }
      
      // Save final prompts to database via API (ensures all edits are saved)
      const response = await apiService.step4Prompts({ prompts });
      if (response.data.success) {
        onComplete({
          step4: {
            promptsGenerated: prompts.length > 0,
            prompts: prompts, // Send the edited prompts
            completed: true
          }
        }, 5);
      }
    } catch (error) {
      console.error('Failed to save prompts:', error);
      alert('Failed to save prompts. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Step Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">Step 4 of 4</p>
        <h2 className="text-2xl font-bold text-gray-900">AI Prompts</h2>
        <p className="text-sm text-gray-600 mt-1">Generate search prompts to analyze your brand's presence</p>
      </div>

      <div className="space-y-6">
        {/* Prompts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              <h3 className="text-h4 text-gray-900">Search Prompts</h3>
            </div>
            <Button
              onClick={handleGeneratePrompts}
              disabled={isGenerating}
              variant="outline"
              className="border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Prompts
                </>
              )}
            </Button>
          </div>
          
          <p className="text-base text-gray-600">
            These prompts will be used to analyze your brand's online presence
          </p>

          {prompts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>Click "Generate Prompts" to create search queries</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium text-sm">
                  {prompts.length} prompts generated successfully!
                </span>
              </div>
              
              {/* Display actual prompts */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Prompts:</h4>
                {prompts.map((prompt, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-primary-200 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] transition-all duration-300">
                    {editingIndex === index ? (
                      <div className="space-y-3">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-3 py-2 border border-primary-200 rounded-md shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 resize-none transition-all duration-300"
                          rows={2}
                          placeholder="Edit prompt text"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveEdit}
                            size="sm"
                            disabled={isSavingEdit}
                            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                          >
                            {isSavingEdit ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            size="sm"
                            variant="outline"
                            disabled={isSavingEdit}
                            className="border-gray-300 text-gray-700 disabled:opacity-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-gray-900 flex-1">{prompt}</p>
                        <Button
                          onClick={() => handleEditPrompt(index)}
                          size="sm"
                          variant="ghost"
                          className="text-primary-500 hover:text-primary-600 hover:bg-primary-50 flex-shrink-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  These prompts will be used for AI analysis
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Super User Preview */}
        {isSuperUser && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">i</span>
              </div>
              <h4 className="text-sm font-semibold text-blue-800">What happens next?</h4>
            </div>
            <div className="space-y-2 text-sm text-blue-700">
              <p>• <strong>AI Analysis:</strong> Your prompts will be processed by AI to generate comprehensive responses</p>
              <p>• <strong>Mentions Extraction:</strong> Brand and competitor mentions will be automatically identified</p>
              <p>• <strong>Share of Voice:</strong> Market position and visibility scores will be calculated</p>
              <p>• <strong>Complete Report:</strong> Full analysis results will be available for download and review</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            onClick={() => onComplete({}, 3)}
            variant="outline"
            className="border-gray-300 text-gray-700 px-6 h-11"
          >
            Back
          </Button>
          <Button
            onClick={handleComplete}
            disabled={loading || isSaving || prompts.length === 0}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 h-11 min-w-[100px]"
          >
            {loading || isSaving ? 'Processing...' : (isSuperUser ? 'Start Complete Analysis' : 'Complete Setup')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step4Prompts;