const SuperUserAnalysis = require("../models/SuperUserAnalysis");

/**
 * Synchronize competitor changes across all related SuperUserAnalysis snapshots
 * This ensures that when competitors are added/removed from a brand, all analysis snapshots remain consistent
 */
class SuperUserAnalysisSync {
  
  /**
   * Update competitors in all SuperUserAnalysis snapshots for a given brand
   * @param {ObjectId} brandId - The brand ID to update
   * @param {Array<String>} newCompetitorsList - Updated competitors list
   * @param {String} operation - Type of operation ('add' or 'delete')
   * @param {String} competitorName - Name of the competitor being modified
   * @returns {Object} - Results of the sync operation
   */
  static async syncCompetitorsAcrossSnapshots(brandId, newCompetitorsList, operation, competitorName) {
    try {
      console.log(`🔄 SuperUserAnalysisSync: Starting ${operation} sync for brand ${brandId}`);
      console.log(`🎯 Competitor: "${competitorName}"`);
      console.log(`📋 New competitors list:`, newCompetitorsList);
      
      // Find all SuperUserAnalysis records that contain this brandId
      const analysisRecords = await SuperUserAnalysis.find({
        'analysisResults.brandId': brandId,
        status: { $in: ['completed', 'in_progress'] } // Only sync active/completed analyses
      });
      
      console.log(`📊 Found ${analysisRecords.length} SuperUserAnalysis records to update`);
      
      if (analysisRecords.length === 0) {
        console.log(`✅ No SuperUserAnalysis records found for brand ${brandId} - no sync needed`);
        return {
          success: true,
          updatedCount: 0,
          skippedCount: 0,
          message: 'No analysis records found for this brand'
        };
      }
      
      let updatedCount = 0;
      let skippedCount = 0;
      const updateResults = [];
      
      // Update each analysis record with individual error handling and recovery
      for (const analysis of analysisRecords) {
        try {
          const oldCompetitors = analysis.analysisResults.competitors || [];
          console.log(`🔍 Processing analysis ${analysis.analysisId}:`);
          console.log(`   Old competitors:`, oldCompetitors);
          console.log(`   Status: ${analysis.status}, Domain: ${analysis.domain}`);
          
          // Create backup of original data for potential rollback
          const originalData = {
            competitors: [...oldCompetitors],
            shareOfVoice: analysis.analysisResults.shareOfVoice ? { ...analysis.analysisResults.shareOfVoice } : null,
            mentionCounts: analysis.analysisResults.mentionCounts ? { ...analysis.analysisResults.mentionCounts } : null,
            step3Competitors: analysis.step3Data?.competitors ? [...analysis.step3Data.competitors] : null
          };
          
          // Update the competitors list in analysisResults
          analysis.analysisResults.competitors = [...newCompetitorsList];
          
          // Also update step3Data if it exists (for consistency)
          if (analysis.step3Data && analysis.step3Data.competitors) {
            analysis.step3Data.competitors = [...newCompetitorsList];
            console.log(`   Updated step3Data competitors`);
          }
          
          // Update SOV data to remove the deleted competitor
          if (operation === 'delete' && analysis.analysisResults.shareOfVoice) {
            // Remove competitor from shareOfVoice object
            if (analysis.analysisResults.shareOfVoice[competitorName] !== undefined) {
              delete analysis.analysisResults.shareOfVoice[competitorName];
              console.log(`   Removed "${competitorName}" from shareOfVoice`);
            }
          }
          
          // Update mentionCounts to remove the deleted competitor
          if (operation === 'delete' && analysis.analysisResults.mentionCounts) {
            // Remove competitor from mentionCounts object
            if (analysis.analysisResults.mentionCounts[competitorName] !== undefined) {
              delete analysis.analysisResults.mentionCounts[competitorName];
              console.log(`   Removed "${competitorName}" from mentionCounts`);
            }
          }
          
          // Mark as modified and save with validation
          analysis.markModified('analysisResults');
          if (analysis.step3Data) {
            analysis.markModified('step3Data');
          }
          analysis.updatedAt = new Date();
          
          // Validate before saving
          if (!analysis.analysisResults.competitors || !Array.isArray(analysis.analysisResults.competitors)) {
            throw new Error('Invalid competitors array after update');
          }
          
          await analysis.save();
          
          updateResults.push({
            analysisId: analysis.analysisId,
            success: true,
            oldCount: oldCompetitors.length,
            newCount: newCompetitorsList.length,
            operation,
            timestamp: new Date().toISOString()
          });
          
          updatedCount++;
          console.log(`✅ Updated analysis ${analysis.analysisId} - competitors: ${oldCompetitors.length} → ${newCompetitorsList.length}`);
          
        } catch (recordError) {
          console.error(`❌ Failed to update analysis ${analysis.analysisId}:`, recordError);
          console.error(`❌ Error details:`, {
            error: recordError.message,
            stack: recordError.stack?.split('\n').slice(0, 3).join('\n'),
            analysisId: analysis.analysisId,
            domain: analysis.domain,
            status: analysis.status
          });
          
          // Attempt to rollback this specific record (best effort)
          try {
            console.log(`🔄 Attempting rollback for analysis ${analysis.analysisId}...`);
            // Note: In a transaction-based system, we'd rollback here
            // For now, we log the failure and continue
          } catch (rollbackError) {
            console.error(`❌ Rollback failed for ${analysis.analysisId}:`, rollbackError.message);
          }
          
          updateResults.push({
            analysisId: analysis.analysisId,
            success: false,
            error: recordError.message,
            timestamp: new Date().toISOString()
          });
          skippedCount++;
        }
      }
      
      const result = {
        success: true,
        updatedCount,
        skippedCount,
        totalFound: analysisRecords.length,
        operation,
        competitorName,
        newCompetitorsList,
        updateResults
      };
      
      console.log(`✅ SuperUserAnalysisSync completed:`, {
        operation,
        brandId: brandId.toString(),
        competitor: competitorName,
        updated: updatedCount,
        skipped: skippedCount,
        total: analysisRecords.length
      });
      
      return result;
      
    } catch (error) {
      console.error(`❌ SuperUserAnalysisSync error:`, error);
      return {
        success: false,
        error: error.message,
        updatedCount: 0,
        skippedCount: 0
      };
    }
  }
  
  /**
   * Add a competitor to all SuperUserAnalysis snapshots for a brand
   * @param {ObjectId} brandId - The brand ID
   * @param {Array<String>} newCompetitorsList - Updated competitors list including the new competitor
   * @param {String} competitorName - Name of the added competitor
   */
  static async syncCompetitorAddition(brandId, newCompetitorsList, competitorName) {
    return await this.syncCompetitorsAcrossSnapshots(brandId, newCompetitorsList, 'add', competitorName);
  }
  
  /**
   * Remove a competitor from all SuperUserAnalysis snapshots for a brand
   * @param {ObjectId} brandId - The brand ID
   * @param {Array<String>} newCompetitorsList - Updated competitors list without the deleted competitor
   * @param {String} competitorName - Name of the deleted competitor
   */
  static async syncCompetitorDeletion(brandId, newCompetitorsList, competitorName) {
    return await this.syncCompetitorsAcrossSnapshots(brandId, newCompetitorsList, 'delete', competitorName);
  }
}

module.exports = SuperUserAnalysisSync;