import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Building2, Globe, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const BrandSummary = ({ brandData }) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Function to truncate text after approximately 3-4 lines (150-200 characters)
  const truncateText = (text, maxLength = 180) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Function to check if text needs truncation
  const needsTruncation = (text, maxLength = 180) => {
    return text.length > maxLength;
  };

  if (!brandData) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Brand Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground">No brand data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <CardTitle className="text-lg">Brand Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-1">
        {/* Brand Information */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Brand Name</p>
              <p className="text-lg font-semibold text-foreground">{brandData.name || 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Domain</p>
              <div className="inline-flex items-center px-3 py-1 bg-muted rounded-md">
                <span className="text-sm font-mono text-foreground">{brandData.domain || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {brandData.description && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Description</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isDescriptionExpanded 
                  ? brandData.description 
                  : truncateText(brandData.description)
                }
              </p>
              
              {/* Read More/Less Button */}
              {needsTruncation(brandData.description) && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="inline-flex items-center space-x-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-md px-2 py-1 hover:bg-primary/5"
                >
                  <span>{isDescriptionExpanded ? 'Read Less' : 'Read More'}</span>
                  {isDescriptionExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Categories */}
        {brandData.categories && Array.isArray(brandData.categories) && brandData.categories.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Categories</p>
            <div className="flex flex-wrap gap-2">
              {brandData.categories.map((category, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {category.categoryName || category}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Fallback for single category */}
        {brandData.category && !brandData.categories && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Category</p>
            <Badge variant="outline" className="text-xs">
              {brandData.category}
            </Badge>
          </div>
        )}

        {brandData.industry && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Industry</p>
            <Badge variant="outline" className="text-xs">
              {brandData.industry}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrandSummary;