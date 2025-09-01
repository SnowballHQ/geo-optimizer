import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import SuperUserDomainAnalysis from '../components/SuperUserDomainAnalysis';
import { apiService } from '../utils/api';

// Mock the API service
jest.mock('../utils/api');

// Mock toast notifications
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Super User SOV Table Update Integration Test', () => {
  let mockAnalysisData;
  let mockRefreshedData;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock analysis data
    mockAnalysisData = {
      analysisId: 'test-analysis-123',
      brandId: 'test-brand-456',
      domain: 'testdomain.com',
      brand: 'Test Brand',
      shareOfVoice: {
        'Test Brand': 50,
        'Competitor A': 30,
        'Competitor B': 20
      },
      mentionCounts: {
        'Test Brand': 10,
        'Competitor A': 6,
        'Competitor B': 4
      },
      totalMentions: 20,
      brandShare: 50,
      competitors: ['Competitor A', 'Competitor B'],
      categories: []
    };

    // Mock refreshed data after competitor addition
    mockRefreshedData = {
      analysis: {
        analysisResults: {
          shareOfVoice: {
            'Test Brand': 40,
            'Competitor A': 25,
            'Competitor B': 20,
            'New Competitor': 15 // New competitor added
          },
          mentionCounts: {
            'Test Brand': 8,
            'Competitor A': 5,
            'Competitor B': 4,
            'New Competitor': 3
          },
          totalMentions: 20,
          brandShare: 40,
          competitors: ['Competitor A', 'Competitor B', 'New Competitor']
        },
        step3Data: {
          competitors: ['Competitor A', 'Competitor B', 'New Competitor']
        }
      }
    };

    // Mock API responses
    apiService.analyzeBrand = jest.fn().mockResolvedValue({ data: mockAnalysisData });
    apiService.addCompetitor = jest.fn().mockResolvedValue({
      data: { 
        success: true, 
        competitor: 'New Competitor',
        shareOfVoice: mockRefreshedData.analysis.analysisResults
      }
    });
    apiService.get = jest.fn().mockImplementation((url) => {
      if (url.includes('/super-user/analysis/')) {
        return Promise.resolve({ data: mockRefreshedData });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  test('SOV table should update after adding competitor in Super User dashboard', async () => {
    const mockOnAnalysisComplete = jest.fn();
    
    render(
      <SuperUserDomainAnalysis onAnalysisComplete={mockOnAnalysisComplete} />
    );

    // 1. Perform initial analysis
    const domainInput = screen.getByPlaceholderText(/domain/i);
    const analyzeButton = screen.getByText(/analyze/i);
    
    fireEvent.change(domainInput, { target: { value: 'testdomain.com' } });
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText(/Analysis Results for testdomain.com/i)).toBeInTheDocument();
    });

    // 2. Verify initial SOV data is displayed
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument(); // Initial brand share

    // 3. Add new competitor
    const addCompetitorButton = screen.getByText(/Add Competitor/i);
    fireEvent.click(addCompetitorButton);

    const competitorInput = screen.getByLabelText(/Competitor Name/i);
    const addButton = screen.getByRole('button', { name: /Add Competitor/i });
    
    fireEvent.change(competitorInput, { target: { value: 'New Competitor' } });
    fireEvent.click(addButton);

    // 4. Wait for competitor addition to complete and SOV table to update
    await waitFor(() => {
      // Verify API calls were made
      expect(apiService.addCompetitor).toHaveBeenCalledWith(
        'test-brand-456',
        { competitorName: 'New Competitor' }
      );
    });

    // Wait for refresh data call
    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith('/api/v1/super-user/analysis/test-analysis-123');
    });

    // 5. Verify SOV table shows updated data
    await waitFor(() => {
      // Should show updated brand share (40% instead of 50%)
      expect(screen.getByText('40.0%')).toBeInTheDocument();
      
      // Should show new competitor
      expect(screen.getByText('New Competitor')).toBeInTheDocument();
      expect(screen.getByText('15.0%')).toBeInTheDocument(); // New competitor share
    });

    // 6. Verify no page redirect occurred (no triggerBrandDashboardReload for Super User)
    expect(window.location.href).not.toContain('/domain-analysis');
  });

  test('SOV table should handle refresh errors gracefully', async () => {
    // Mock API to simulate refresh error
    apiService.get = jest.fn().mockRejectedValue(new Error('Network error'));
    
    const mockOnAnalysisComplete = jest.fn();
    
    render(
      <SuperUserDomainAnalysis onAnalysisComplete={mockOnAnalysisComplete} />
    );

    // Perform initial analysis
    const domainInput = screen.getByPlaceholderText(/domain/i);
    const analyzeButton = screen.getByText(/analyze/i);
    
    fireEvent.change(domainInput, { target: { value: 'testdomain.com' } });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/Analysis Results for testdomain.com/i)).toBeInTheDocument();
    });

    // Try to add competitor (this should succeed but refresh should fail)
    const addCompetitorButton = screen.getByText(/Add Competitor/i);
    fireEvent.click(addCompetitorButton);

    const competitorInput = screen.getByLabelText(/Competitor Name/i);
    const addButton = screen.getByRole('button', { name: /Add Competitor/i });
    
    fireEvent.change(competitorInput, { target: { value: 'New Competitor' } });
    fireEvent.click(addButton);

    // Wait for error handling
    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled();
    });

    // Should still show original data (graceful fallback)
    expect(screen.getByText('Test Brand')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument(); // Original data preserved
  });

  test('should use correct Super User API endpoint for data refresh', async () => {
    const mockOnAnalysisComplete = jest.fn();
    
    render(
      <SuperUserDomainAnalysis onAnalysisComplete={mockOnAnalysisComplete} />
    );

    // Perform initial analysis
    const domainInput = screen.getByPlaceholderText(/domain/i);
    const analyzeButton = screen.getByText(/analyze/i);
    
    fireEvent.change(domainInput, { target: { value: 'testdomain.com' } });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/Analysis Results for testdomain.com/i)).toBeInTheDocument();
    });

    // Add competitor to trigger refresh
    const addCompetitorButton = screen.getByText(/Add Competitor/i);
    fireEvent.click(addCompetitorButton);

    const competitorInput = screen.getByLabelText(/Competitor Name/i);
    const addButton = screen.getByRole('button', { name: /Add Competitor/i });
    
    fireEvent.change(competitorInput, { target: { value: 'New Competitor' } });
    fireEvent.click(addButton);

    // Verify correct Super User endpoint was called
    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith('/api/v1/super-user/analysis/test-analysis-123');
    });
    
    // Should NOT call regular brand analysis endpoint
    expect(apiService.get).not.toHaveBeenCalledWith('/api/v1/brand/analysis/test-brand-456');
  });
});