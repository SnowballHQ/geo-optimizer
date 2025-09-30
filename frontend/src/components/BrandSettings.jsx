import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { apiService } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { ConfirmDialog } from './ui/confirm-dialog';

const BrandSettings = () => {
  const [brandTonality, setBrandTonality] = useState('');
  const [brandInformation, setBrandInformation] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Load existing brand settings on component mount
  useEffect(() => {
    loadBrandSettings();
  }, []);

  const loadBrandSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBrandSettings();
      
      if (response.data.success) {
        const { brandTonality: tonality, brandInformation: info, updatedAt } = response.data.data;
        setBrandTonality(tonality || '');
        setBrandInformation(info || '');
        setLastUpdated(updatedAt ? new Date(updatedAt).toLocaleString() : null);
      }
    } catch (error) {
      console.error('Error loading brand settings:', error);
      toast.error('Failed to load brand settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiService.saveBrandSettings({
        brandTonality,
        brandInformation
      });
      
      if (response.data.success) {
        toast.success('Brand settings saved successfully!');
        setLastUpdated(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Error saving brand settings:', error);
      const errorMsg = error.response?.data?.msg || 'Failed to save brand settings';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const confirmReset = () => {
    loadBrandSettings();
    setShowResetDialog(false);
    toast.info('Settings have been reset to saved values');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-small text-muted-foreground">Loading brand settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Brand Tonality */}
        <div className="space-y-4">
          <div>
            <label className="block text-base font-medium text-foreground mb-2">
              Brand Tonality
            </label>
            <Textarea
              value={brandTonality}
              onChange={(e) => setBrandTonality(e.target.value)}
              placeholder="e.g., Professional yet approachable, innovative, customer-focused, trustworthy..."
              className="min-h-[100px] resize-none border-input focus:border-primary focus:ring-primary/20"
              maxLength={500}
            />
            <div className="text-tiny text-muted-foreground text-right mt-1">
              {brandTonality.length}/500 characters
            </div>
          </div>
        </div>

        {/* Brand Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-base font-medium text-foreground mb-2">
              Brand Information
            </label>
            <Textarea
              value={brandInformation}
              onChange={(e) => setBrandInformation(e.target.value)}
              placeholder="e.g., We are a B2B SaaS company specializing in AI-powered sales automation. Our platform helps sales teams increase productivity through intelligent lead scoring, automated outreach, and data-driven insights..."
              className="min-h-[100px] resize-none border-input focus:border-primary focus:ring-primary/20"
              maxLength={2000}
            />
            <div className="text-tiny text-muted-foreground text-right mt-1">
              {brandInformation.length}/2000 characters
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-4 border-t border-border">
        <div className="text-small text-muted-foreground">
          {lastUpdated && (
            <span>Last updated: {lastUpdated}</span>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-input text-muted-foreground hover:border-primary"
          >
            Reset Changes
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={confirmReset}
        title="Reset Changes?"
        description="This will discard all unsaved changes and restore your last saved brand settings. Are you sure you want to continue?"
        confirmText="Reset"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default BrandSettings;
