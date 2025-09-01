/**
 * Test utility to validate SuperUserAnalysis sync functionality
 * This can be used to test the sync mechanism manually
 */

const mongoose = require('mongoose');
const SuperUserAnalysis = require('../models/SuperUserAnalysis');
const BrandProfile = require('../models/BrandProfile');
const SuperUserAnalysisSync = require('./superUserAnalysisSync');

class SuperUserSyncTester {
  
  /**
   * Test the sync functionality by creating a mock scenario
   * This is for development/testing purposes only
   */
  static async testSync() {
    try {
      console.log('🧪 Starting SuperUserAnalysis sync test...');
      
      // Connect to database if not already connected
      if (mongoose.connection.readyState !== 1) {
        console.log('❌ Database not connected. Please run this from the main application.');
        return;
      }
      
      // Find a brand with SuperUserAnalysis records
      const analysisWithBrand = await SuperUserAnalysis.findOne({
        'analysisResults.brandId': { $exists: true },
        status: 'completed'
      }).populate('analysisResults.brandId');
      
      if (!analysisWithBrand) {
        console.log('❌ No completed SuperUserAnalysis records found with brandId');
        return;
      }
      
      const brandId = analysisWithBrand.analysisResults.brandId._id;
      const brand = analysisWithBrand.analysisResults.brandId;
      
      console.log(`📊 Found test brand: ${brand.brandName} (${brandId})`);
      console.log(`🔍 Current competitors:`, brand.competitors);
      
      // Find all SuperUserAnalysis records for this brand
      const relatedAnalyses = await SuperUserAnalysis.find({
        'analysisResults.brandId': brandId
      });
      
      console.log(`📈 Found ${relatedAnalyses.length} SuperUserAnalysis records for this brand`);
      
      // Display current state
      for (const analysis of relatedAnalyses) {
        console.log(`   Analysis ${analysis.analysisId}:`);
        console.log(`     Competitors:`, analysis.analysisResults.competitors || []);
        console.log(`     SOV keys:`, Object.keys(analysis.analysisResults.shareOfVoice || {}));
        console.log(`     Status: ${analysis.status}`);
      }
      
      // Test the sync function (dry run)
      console.log(`\n🔄 Testing sync function...`);
      const testResult = await SuperUserAnalysisSync.syncCompetitorsAcrossSnapshots(
        brandId,
        brand.competitors,
        'test',
        'TestCompetitor'
      );
      
      console.log(`✅ Sync test result:`, {
        success: testResult.success,
        updatedCount: testResult.updatedCount,
        skippedCount: testResult.skippedCount,
        totalFound: testResult.totalFound
      });
      
      if (testResult.updateResults) {
        console.log(`📋 Update details:`, testResult.updateResults.map(r => ({
          analysisId: r.analysisId,
          success: r.success,
          error: r.error
        })));
      }
      
      console.log('✅ Sync test completed successfully');
      
    } catch (error) {
      console.error('❌ Sync test failed:', error);
    }
  }
  
  /**
   * Check consistency between BrandProfile and SuperUserAnalysis competitors
   */
  static async checkConsistency() {
    try {
      console.log('🔍 Checking competitor consistency across all records...');
      
      const analyses = await SuperUserAnalysis.find({
        'analysisResults.brandId': { $exists: true },
        status: { $in: ['completed', 'in_progress'] }
      }).populate('analysisResults.brandId');
      
      let inconsistencies = 0;
      
      for (const analysis of analyses) {
        if (!analysis.analysisResults.brandId) continue;
        
        const brand = analysis.analysisResults.brandId;
        const brandCompetitors = new Set(brand.competitors || []);
        const analysisCompetitors = new Set(analysis.analysisResults.competitors || []);
        
        // Check for differences
        const brandOnly = [...brandCompetitors].filter(c => !analysisCompetitors.has(c));
        const analysisOnly = [...analysisCompetitors].filter(c => !brandCompetitors.has(c));
        
        if (brandOnly.length > 0 || analysisOnly.length > 0) {
          console.log(`⚠️ Inconsistency found:`);
          console.log(`   Brand: ${brand.brandName} (${brand._id})`);
          console.log(`   Analysis: ${analysis.analysisId}`);
          console.log(`   Only in Brand:`, brandOnly);
          console.log(`   Only in Analysis:`, analysisOnly);
          inconsistencies++;
        }
      }
      
      if (inconsistencies === 0) {
        console.log('✅ All records are consistent');
      } else {
        console.log(`❌ Found ${inconsistencies} inconsistent records`);
      }
      
    } catch (error) {
      console.error('❌ Consistency check failed:', error);
    }
  }
}

module.exports = SuperUserSyncTester;

// If run directly (for manual testing)
if (require.main === module) {
  console.log('🧪 SuperUserAnalysis Sync Test Utility');
  console.log('This should be run from within the main application context');
  console.log('Example usage:');
  console.log('const tester = require("./utils/testSuperUserSync");');
  console.log('await tester.testSync();');
  console.log('await tester.checkConsistency();');
}