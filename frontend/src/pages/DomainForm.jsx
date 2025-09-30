import React, { useState, useEffect } from "react";
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const DomainForm = ({ domain, setDomain, loading, onSubmit, onClose, existingDomain, showDomainWarning }) => {
  const [hasExistingData, setHasExistingData] = useState(false);
  const [checkingDomain, setCheckingDomain] = useState(false);

  // Check if domain has existing data
  useEffect(() => {
    const checkExistingData = async () => {
      if (domain && domain.trim() && !loading) {
        setCheckingDomain(true);
        try {
          // Import apiService dynamically to avoid circular dependencies
          const { apiService } = await import('../utils/api');
          const brandsResponse = await apiService.getUserBrands();
          const userBrands = brandsResponse.data.brands || [];
          
          const existingBrand = userBrands.find(brand => 
            brand.domain === domain || 
            brand.domain.replace(/^https?:\/\//, '') === domain ||
            brand.domain === `https://${domain}` ||
            brand.domain === `http://${domain}`
          );
          
          setHasExistingData(!!existingBrand);
        } catch (error) {
          console.log('Error checking existing data:', error);
          setHasExistingData(false);
        } finally {
          setCheckingDomain(false);
        }
      } else {
        setHasExistingData(false);
      }
    };
    
    // Debounce the check
    const timeoutId = setTimeout(checkExistingData, 500);
    return () => clearTimeout(timeoutId);
  }, [domain, loading]);

  return (
    <Card className="mb-6 border-0.3 border-[#b0b0d8] bg-white">
      <CardHeader>
        <CardTitle className="text-[#4a4a6a]"></CardTitle>
      </CardHeader>
      <CardContent>
        {/* Domain Switch Warning */}
        {showDomainWarning && existingDomain && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="text-amber-600 mt-0.5">⚠️</div>
              <div className="text-sm text-amber-800">
                <p className="font-medium">Switching Domains</p>
                <p>You're switching from <strong>{existingDomain}</strong> to <strong>{domain}</strong>.</p>
                <p className="mt-1 text-xs">This will replace your previous brand analysis and settings.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Existing Data Available Indicator */}
        {hasExistingData && !showDomainWarning && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="text-green-600 mt-0.5">📊</div>
              <div className="text-sm text-green-800">
                <p className="font-medium">Existing Analysis Found!</p>
                <p>Domain <strong>{domain}</strong> has already been analyzed.</p>
                <p className="mt-1 text-xs">Click "Analyze Domain" to choose between loading existing data or running fresh analysis.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Domain Input */}
        <form onSubmit={(e) => {
          console.log('🎯 Form submitted!', { domain, onSubmit: typeof onSubmit });
          e.preventDefault();
          if (onSubmit && typeof onSubmit === 'function') {
            console.log('✅ Calling onSubmit function...');
            onSubmit(e);
          } else {
            console.error('❌ onSubmit is not a function:', onSubmit);
          }
        }} className="space-y-4">
          <div>
            <Input
              id="domain"
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="Enter brand domain"
              disabled={loading}
              className="border-[#b0b0d8] focus:border-[#6658f4] focus:ring-[#6658f4]"
            />
            
            {/* Domain Status Indicator */}
            {domain && domain.trim() && (
              <div className="mt-2 flex items-center space-x-2">
                {checkingDomain ? (
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                    Checking domain...
                  </div>
                ) : hasExistingData ? (
                  <div className="flex items-center text-xs text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    ✓ Existing analysis available
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-blue-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    🔍 New domain - will analyze
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={loading || !domain.trim()}
              onClick={() => {
                console.log('🔘 Button clicked!', { domain, loading });
              }}
              className="flex-1 gradient-primary hover:shadow-lg transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Analyzing...
                </div>
              ) : showDomainWarning ? (
                'Switch & Analyze'
              ) : hasExistingData ? (
                'Analyze Domain'
              ) : (
                'Analyze Domain'
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#b0b0d8] text-[#4a4a6a] hover:bg-[#d5d6eb]"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DomainForm;