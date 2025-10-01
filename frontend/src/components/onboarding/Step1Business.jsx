import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Sparkles, Globe } from 'lucide-react';

const Step1Business = ({ onComplete, loading, error, progress }) => {
  const [domain, setDomain] = useState('');
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [isLocalBrand, setIsLocalBrand] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Load saved progress if available
    if (progress?.step1) {
      setDomain(progress.step1.domain || '');
      setBrandName(progress.step1.brandName || '');
      setDescription(progress.step1.description || '');
      setIsLocalBrand(progress.step1.isLocalBrand || false);
    }
  }, [progress]);

  const handleAutocompleteWithAI = async () => {
    if (!domain.trim()) {
      alert('Please enter a domain first');
      return;
    }

    try {
      setIsAnalyzing(true);
      
      const response = await apiService.step1DomainAnalysis({ domain });
      
      if (response.data.success) {
        setBrandName(response.data.brand.brandName || '');
        setDescription(response.data.brand.brandInformation || '');
      }
    } catch (error) {
      console.error('AI autocomplete failed:', error);
      alert('AI autocomplete failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinue = () => {
    if (!domain.trim() || !brandName.trim() || !description.trim()) {
      alert('Please fill in all fields before continuing');
      return;
    }

    onComplete({
      step1: {
        domain: domain.trim(),
        brandName: brandName.trim(),
        description: description.trim(),
        isLocalBrand: isLocalBrand,
        completed: true
      }
    }, 2);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Step Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">Step 1 of 4</p>
        <h2 className="text-2xl font-bold text-gray-900">Business Details</h2>
        <p className="text-sm text-gray-600 mt-1">Let's start with your website and business information</p>
      </div>

      <div className="space-y-6">
        {/* Domain Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-500" />
            <h3 className="text-h4 text-gray-900">Website Domain</h3>
          </div>
          <Input
            type="url"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="https://example.com"
            className="h-11 border-primary-200 shadow-[0_4px_20px_rgba(99,102,241,0.7)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.9)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-300"
          />
          
          <Button
            onClick={handleAutocompleteWithAI}
            disabled={isAnalyzing || !domain.trim()}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white h-11 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Autocomplete With AI
              </>
            )}
          </Button>
        </div>

        {/* Business Details */}
        <div className="space-y-4">
       
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <Input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter business name"
                className="h-11 border-primary-200 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500 transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter business description"
                rows={3}
                className="w-full px-3 py-2 border border-primary-200 rounded-md shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 resize-none transition-all duration-300"
              />
            </div>

            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLocalBrand}
                  onChange={(e) => setIsLocalBrand(e.target.checked)}
                  className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Local Brand</span>
                  <p className="text-xs text-gray-500">Enable if this is a location-specific business</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleContinue}
            disabled={loading || !domain.trim() || !brandName.trim() || !description.trim()}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 h-11 min-w-[100px]"
          >
            {loading ? 'Processing...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step1Business;
