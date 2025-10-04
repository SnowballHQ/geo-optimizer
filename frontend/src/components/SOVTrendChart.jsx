import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RefreshCw, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { apiService } from '../utils/api';

// Color palette for different brands/competitors
const CHART_COLORS = [
  '#7765e3',  // Primary brand color (purple)
  '#10b981',  // Emerald
  '#f59e0b',  // Amber
  '#ef4444',  // Red
  '#3b82f6',  // Blue
  '#8b5cf6',  // Violet
  '#06b6d4',  // Cyan
  '#84cc16',  // Lime
  '#f97316',  // Orange
  '#ec4899',  // Pink
];

const SOVTrendChart = ({ brandId }) => {
  const [chartData, setChartData] = useState([]);
  const [brandNames, setBrandNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRerunning, setIsRerunning] = useState(false);
  const [totalSnapshots, setTotalSnapshots] = useState(0);
  const [dateRange, setDateRange] = useState(null);
  const [error, setError] = useState(null);

  // Fetch SOV trend data and current SOV data
  const fetchTrendData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📈 Fetching SOV trend data for brand: ${brandId}`);
      
      // Fetch both trend data and current brand analysis
      const [trendResponse, brandResponse] = await Promise.all([
        apiService.get(`/api/v1/brand/${brandId}/sov-trends`).catch(() => ({ data: { success: false } })),
        apiService.getBrandAnalysis(brandId).catch(() => ({ data: null }))
      ]);
      
      let transformedData = [];
      let brandNames = [];
      let totalSnapshots = 0;
      let dateRange = null;
      
      // Check if we have historical trend data
      if (trendResponse.data.success && trendResponse.data.data.totalSnapshots > 0) {
        console.log('📊 Using historical trend data');
        const { chartData, brandNames: trendBrandNames, totalSnapshots: trendTotal, dateRange: trendRange } = trendResponse.data.data;
        
        // Transform historical data for Recharts format
        const dates = [...new Set(Object.values(chartData.datasets).flat().map(point => point.x))];
        dates.sort((a, b) => new Date(a) - new Date(b));
        
        dates.forEach(date => {
          const dataPoint = { date: new Date(date).toLocaleDateString() };
          
          trendBrandNames.forEach(brandName => {
            const brandData = chartData.datasets[brandName] || [];
            const pointForDate = brandData.find(point => point.x === date);
            dataPoint[brandName] = pointForDate ? pointForDate.y : 0;
          });
          
          transformedData.push(dataPoint);
        });
        
        brandNames = trendBrandNames;
        totalSnapshots = trendTotal;
        dateRange = trendRange;
      } 
      // Fallback to current SOV data if no historical data exists
      else if (brandResponse.data && brandResponse.data.shareOfVoice) {
        console.log('📊 No historical data found, using current SOV data as initial point');
        const currentSOV = brandResponse.data.shareOfVoice;
        const currentDate = new Date().toLocaleDateString();
        
        // Create initial data point from current SOV
        const dataPoint = { date: currentDate };
        brandNames = Object.keys(currentSOV);
        
        brandNames.forEach(brandName => {
          dataPoint[brandName] = currentSOV[brandName] || 0;
        });
        
        transformedData = [dataPoint];
        totalSnapshots = 1;
        dateRange = {
          from: new Date().toISOString(),
          to: new Date().toISOString()
        };
        
        console.log(`✅ Created initial chart data from current SOV:`, dataPoint);
      }
      
      setChartData(transformedData);
      setBrandNames(brandNames);
      setTotalSnapshots(totalSnapshots);
      setDateRange(dateRange);
      
      console.log(`✅ SOV trend data loaded: ${transformedData.length} data points, ${brandNames.length} brands`);
      
    } catch (error) {
      console.error('❌ Error fetching SOV trend data:', error);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual analysis rerun
  const handleRerunAnalysis = async () => {
    try {
      setIsRerunning(true);
      setError(null);
      
      console.log(`🔄 Starting manual analysis rerun for brand: ${brandId}`);
      const response = await apiService.post(`/api/v1/brand/${brandId}/rerun-analysis`);
      
      if (response.data.success) {
        console.log('✅ Analysis rerun completed successfully');
        console.log(`📊 New SOV results:`, response.data.sovResults);
        
        // Refresh chart data to show new results
        await fetchTrendData();
      } else {
        setError('Failed to rerun analysis');
      }
    } catch (error) {
      console.error('❌ Error during analysis rerun:', error);
      setError('Failed to rerun analysis. Please try again.');
    } finally {
      setIsRerunning(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (brandId) {
      fetchTrendData();
    }
  }, [brandId]);

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{`Date: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value.toFixed(1)}%`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="border-0.3 border-[#b0b0d8] bg-white">
        <CardHeader>
          <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Share of Voice Trends</span>
          </CardTitle>
          <CardDescription>Loading trend data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7765e3] mx-auto mb-4"></div>
              <p className="text-sm text-[#4a4a6a]">Loading SOV trend data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0.3 border-[#b0b0d8] bg-white">
        <CardHeader>
          <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Share of Voice Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">⚠️ {error}</div>
            <Button 
              onClick={fetchTrendData}
              variant="outline"
              className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="border-0.3 border-[#b0b0d8] bg-white">
        <CardHeader>
          <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Share of Voice Trends</span>
          </CardTitle>
          <CardDescription>Track your brand's performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#4a4a6a] mb-2">No data available yet</h3>
            <p className="text-sm text-[#4a4a6a] mb-6">
              This brand doesn't have any analysis data yet. Run an analysis to see your Share of Voice trends.
            </p>
            <Button 
              onClick={handleRerunAnalysis}
              disabled={isRerunning}
              className="gradient-primary"
            >
              {isRerunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running Analysis...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0.3 border-[#b0b0d8] bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Share of Voice Trends</span>
            </CardTitle>
            <CardDescription>
              Track your brand's performance against competitors over time
            </CardDescription>
          </div>
          <Button 
            onClick={handleRerunAnalysis}
            disabled={isRerunning}
            variant="outline"
            size="sm"
            className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
          >
            {isRerunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Update SOV
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-[#4a4a6a]">
              {totalSnapshots === 1 ? 'Current Data' : 'Data Points'}
            </div>
            <div className="text-2xl font-bold text-[#7765e3]">{totalSnapshots}</div>
            {totalSnapshots === 1 && (
              <div className="text-xs text-[#4a4a6a] mt-1">Starting point</div>
            )}
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-[#4a4a6a]">Brands Tracked</div>
            <div className="text-2xl font-bold text-[#7765e3]">{brandNames.length}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-[#4a4a6a]">
              {totalSnapshots === 1 ? 'Current Snapshot' : 'Time Period'}
            </div>
            <div className="text-sm font-medium text-[#7765e3]">
              {dateRange && totalSnapshots > 1 ? (
                <>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
                </>
              ) : (
                <>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {new Date().toLocaleDateString()}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#666"
                fontSize={12}
                tick={{ fill: '#666' }}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tick={{ fill: '#666' }}
                domain={[0, 30]}
                label={{ value: 'Share of Voice (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {brandNames.map((brandName, index) => (
                <Line
                  key={brandName}
                  type="monotone"
                  dataKey={brandName}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend info */}
        <div className="mt-4 text-xs text-[#4a4a6a]">
          {totalSnapshots === 1 ? (
            <>
              <p>💡 <strong>Getting started:</strong> This shows your current Share of Voice. Add custom prompts or competitors to see trends over time.</p>
              <p className="mt-1">📊 Each change you make will add a new point to track your progress.</p>
            </>
          ) : (
            <>
              <p>💡 <strong>Tip:</strong> Add custom prompts or competitors to see how they affect your Share of Voice over time.</p>
              <p className="mt-1">📊 Each point represents a new SOV calculation triggered by analysis updates.</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SOVTrendChart;