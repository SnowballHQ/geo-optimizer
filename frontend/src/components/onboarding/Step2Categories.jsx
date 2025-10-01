import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/api';
import { Button } from '../ui/button';
import { Tags, Sparkles, Edit2, Plus, X } from 'lucide-react';

const Step2Categories = ({ onComplete, loading, error, progress }) => {
  const [categories, setCategories] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    // Load saved progress if available
    if (progress?.step2?.categories) {
      setCategories(progress.step2.categories);
    }
  }, [progress]);

  const handleExtractCategories = async () => {
    try {
      setIsExtracting(true);
      
      // Only extract categories from AI, don't save to database yet
      const response = await apiService.extractCategories({});
      
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Categories extraction failed:', error);
      alert('Failed to extract categories. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleEditCategory = (index) => {
    setEditingIndex(index);
    setEditValue(categories[index]);
  };

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      const newCategories = [...categories];
      newCategories[editingIndex] = editValue.trim();
      setCategories(newCategories);
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleRemoveCategory = (index) => {
    const newCategories = categories.filter((_, i) => i !== index);
    setCategories(newCategories);
  };

  const handleAddCategory = () => {
    if (categories.length < 6) {
      setCategories([...categories, '']);
      setEditingIndex(categories.length);
      setEditValue('');
    }
  };

  const handleContinue = async () => {
    if (categories.length === 0) {
      alert('Please extract or add at least one category');
      return;
    }

    // Filter out empty categories
    const validCategories = categories.filter(cat => cat.trim());

    try {
      setIsSaving(true);
      // Save categories to database via API
      const response = await apiService.step2Categories({ categories: validCategories });
      if (response.data.success) {
        onComplete({
          step2: {
            categories: validCategories,
            completed: true
          }
        }, 3);
      }
    } catch (error) {
      console.error('Failed to save categories:', error);
      alert('Failed to save categories. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Step Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">Step 2 of 4</p>
        <h2 className="text-2xl font-bold text-gray-900">Content Categories</h2>
        <p className="text-sm text-gray-600 mt-1">Select the topics your business focuses on</p>
      </div>

      <div className="space-y-6">
        {/* Categories Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tags className="w-5 h-5 text-primary-500" />
              <h3 className="text-h4 text-gray-900">Business Categories</h3>
            </div>
            <Button
              onClick={handleExtractCategories}
              disabled={isExtracting}
              variant="outline"
              className="border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white"
            >
              {isExtracting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Extract with AI
                </>
              )}
            </Button>
          </div>
          
          <p className="text-base text-gray-600">
            Categories help us understand your business focus areas
          </p>

          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tags className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No categories yet. Click "Extract with AI" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-primary-200 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] transition-all duration-300">
                  {editingIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 border border-primary-200 rounded-md shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                        placeholder="Enter category name"
                      />
                      <Button
                        onClick={handleSaveEdit}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        size="sm"
                        variant="outline"
                        className="border-gray-300 text-gray-700"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 text-gray-900 font-medium">
                        {category}
                      </div>
                      <Button
                        onClick={() => handleEditCategory(index)}
                        size="sm"
                        variant="ghost"
                        className="text-primary-500 hover:text-primary-600 hover:bg-primary-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleRemoveCategory(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Category Button */}
          {categories.length < 6 && (
            <Button
              onClick={handleAddCategory}
              variant="outline"
              className="w-full border-2 border-dashed border-gray-300 text-gray-600 hover:border-primary-500 hover:text-primary-500 hover:bg-primary-50 h-11"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            onClick={() => onComplete({}, 1)}
            variant="outline"
            className="border-gray-300 text-gray-700 px-6 h-11"
          >
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={loading || isSaving || categories.length === 0}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 h-11 min-w-[100px]"
          >
            {loading || isSaving ? 'Processing...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step2Categories;
