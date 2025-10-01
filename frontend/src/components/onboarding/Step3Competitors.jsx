import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Building2, Sparkles, Plus, X } from 'lucide-react';

const Step3Competitors = ({ onComplete, loading, error, progress }) => {
  const [competitors, setCompetitors] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState('');

  useEffect(() => {
    if (progress?.step3?.competitors) {
      setCompetitors(progress.step3.competitors);
    }
  }, [progress]);

  const handleExtractCompetitors = async () => {
    try {
      setIsExtracting(true);
      const response = await apiService.step3Competitors({});
      if (response.data.success) {
        setCompetitors(response.data.competitors);
      }
    } catch (error) {
      console.error('Competitors extraction failed:', error);
      alert('Failed to extract competitors. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddCompetitor = () => {
    if (newCompetitor.trim() && competitors.length < 7) {
      setCompetitors([...competitors, newCompetitor.trim()]);
      setNewCompetitor('');
    }
  };

  const handleRemoveCompetitor = (index) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    try {
      setIsSaving(true);
      // Save competitors to brand profile via API
      const response = await apiService.step3Competitors({ competitors });
      if (response.data.success) {
        onComplete({
          step3: {
            competitors,
            completed: true
          }
        }, 4);
      }
    } catch (error) {
      console.error('Failed to save competitors:', error);
      alert('Failed to save competitors. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Step Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">Step 3 of 4</p>
        <h2 className="text-2xl font-bold text-gray-900">Competitors</h2>
        <p className="text-sm text-gray-600 mt-1">Add competitor URLs to analyze your market position</p>
      </div>

      <div className="space-y-6">
        {/* Competitors Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              <h3 className="text-h4 text-gray-900">Your Competitors</h3>
            </div>
            <Button
              onClick={handleExtractCompetitors}
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
            Add competitor URLs to help us understand your market
          </p>

          {/* Add Competitor Input */}
          <div className="flex gap-3">
            <Input
              type="text"
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCompetitor()}
              placeholder="Enter competitor URL (e.g., competitor.com)"
              className="h-11 border-primary-200 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-300"
            />
            <Button
              onClick={handleAddCompetitor}
              disabled={!newCompetitor.trim() || competitors.length >= 7}
              variant="outline"
              className="h-11 px-4 border-gray-300"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Competitors List */}
          {competitors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No competitors added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {competitors.map((competitor, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-primary-200 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] transition-all duration-300">
                  <span className="text-gray-900 font-medium">{competitor}</span>
                  <Button
                    onClick={() => handleRemoveCompetitor(index)}
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-500 text-center">
            Maximum 7 competitors • {7 - competitors.length} remaining
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            onClick={() => onComplete({}, 2)}
            variant="outline"
            className="border-gray-300 text-gray-700 px-6 h-11"
          >
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={loading || isSaving}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 h-11 min-w-[100px]"
          >
            {loading || isSaving ? 'Processing...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step3Competitors;