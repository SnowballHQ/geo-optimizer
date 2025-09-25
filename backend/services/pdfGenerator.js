const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class BrandAnalysisPDFGenerator {
  constructor() {
    this.doc = null;
    this.pageWidth = 612;
    this.pageHeight = 792;
    this.margin = 50;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    // Safe bottom limit to prevent content overlap with page footer area
    this.bottomLimit = this.pageHeight - this.margin - 40;
    
    // Updated color scheme to match website theme
    this.colors = {
      primary: '#7765e3',        // Main brand color
      primaryLight: '#a4abff',   // Lighter primary
      primaryDark: '#5e6ad2',    // Darker primary
      text: '#2d3142',           // Dark text
      textLight: '#4a4a6a',      // Light text
      textMuted: '#6b7280',      // Muted text
      background: '#ffffff',      // White background
      surface: '#f8f9ff',        // Light surface
      border: '#e4e7ff',         // Light border
      accent: '#10b981',         // Success green
      warning: '#f59e0b',        // Warning orange
      error: '#ef4444'           // Error red
    };
  }

  // Ensure there is space for the next block. If not, add a new page and
  // return a reset Y coordinate for top-of-page content.
  ensureSpace(currentY, neededHeight, resetTo = 80) {
    if (currentY + neededHeight > this.bottomLimit) {
      this.doc.addPage();
      return resetTo;
    }
    return currentY;
  }

  // Measure text height using the same font/size that will be used to render it,
  // avoiding mismatches that cause overlap.
  measureTextHeight(text, options = {}) {
    const { size = 10, width = this.contentWidth - 20, lineGap = 3, align = 'left' } = options;
    
    if (!text || text.length === 0) {
      return 0;
    }
    
    // Store current font size to restore later
    const currentFontSize = this.doc._fontSize;
    
    // Set the font size for accurate measurement
    this.doc.fontSize(size);
    
    // Measure with same parameters used for rendering
    const height = this.doc.heightOfString(text, { 
      width, 
      lineGap, 
      align 
    });
    
    // Restore original font size
    this.doc.fontSize(currentFontSize);
    
    return height;
  }

  // Estimate height needed for SOV section
  estimateSOVSectionHeight(analysisData) {
    if (!analysisData.shareOfVoice || Object.keys(analysisData.shareOfVoice).length === 0) {
      return 100; // Minimal height for "no data" message
    }
    
    const entries = Object.keys(analysisData.shareOfVoice).length;
    const headerHeight = 80;
    const tableHeaderHeight = 25;
    const rowHeight = 25;
    
    return headerHeight + tableHeaderHeight + (entries * rowHeight) + 50;
  }

  // Estimate height needed for categories section
  estimateCategoriesSectionHeight(categories) {
    if (!categories || categories.length === 0) {
      return 100;
    }
    
    let totalHeight = 80; // Section header
    
    categories.forEach(category => {
      totalHeight += 30; // Category header
      if (category.prompts && category.prompts.length > 0) {
        category.prompts.forEach(prompt => {
          totalHeight += 60; // Prompt header + text (estimated)
          if (prompt.aiResponse && prompt.aiResponse.responseText) {
            const responseLength = prompt.aiResponse.responseText.length;
            const estimatedLines = Math.ceil(responseLength / 80); // Rough estimate
            totalHeight += estimatedLines * 12 + 40; // Response text + spacing
          }
        });
      }
      totalHeight += 20; // Category spacing
    });
    
    return Math.min(totalHeight, 600); // Cap at reasonable height
  }

  generateBrandAnalysisPDF(analysisData) {
    return new Promise((resolve, reject) => {
      try {
        this.doc = new PDFDocument({ 
          margin: this.margin,
          font: 'Helvetica'
        });
        const buffers = [];

        // Collect the PDF data
        this.doc.on('data', buffers.push.bind(buffers));
        this.doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Generate the PDF content
        this.generateContent(analysisData);

        // Finalize the PDF
        this.doc.end();
      } catch (error) {
        console.error('❌ PDF Generation Error:', error);
        reject(new Error(`PDF generation failed: ${error.message}`));
      }
    });
  }

  generateContent(analysisData) {
    let currentY = this.margin;

    // Title Page
    this.addTitlePage(analysisData);
    
    // Add new page only if we have more content and need space
    this.doc.addPage();
    currentY = this.margin;

    // Executive Summary
    const summaryEndY = this.addExecutiveSummary(analysisData, currentY);
    currentY = summaryEndY;

    // Share of Voice Analysis - only add page if needed
    const sovNeededHeight = this.estimateSOVSectionHeight(analysisData);
    currentY = this.ensureSpace(currentY, sovNeededHeight, this.margin + 20);
    if (currentY === this.margin + 20) {
      // New page was created, add some top margin
      currentY = this.margin + 40;
    }
    const sovEndY = this.addShareOfVoiceSection(analysisData, currentY);
    currentY = sovEndY;

    // Categories Analysis - only add page if needed
    if (analysisData.categories && analysisData.categories.length > 0) {
      const categoriesNeededHeight = this.estimateCategoriesSectionHeight(analysisData.categories);
      currentY = this.ensureSpace(currentY, categoriesNeededHeight, this.margin + 20);
      if (currentY === this.margin + 20) {
        // New page was created
        currentY = this.margin + 40;
      }
      this.addCategoriesSection(analysisData.categories, analysisData, currentY);
    }
  }

  addTitlePage(analysisData) {
    const centerX = this.pageWidth / 2;

    // Add logo at the top
    // this.addLogo();

    // Brand header bar with primary color
    this.doc
      .rect(0, 80, this.pageWidth, 6)
      .fill(this.colors.primary);

    // Main Title
    this.doc
      .fontSize(36)
      .fillColor(this.colors.text)
      .text('AI-SEO Analysis Report', this.margin, 120, {
        align: 'center'
      });

    // Brand Name
    this.doc
      .fontSize(28)
      .fillColor(this.colors.primary)
      .text(analysisData.brandName || analysisData.domain, this.margin, 180, {
        align: 'center'
      });

    // Info Box with improved styling
    const boxY = 250;
    this.doc
      .rect(this.margin, boxY, this.contentWidth, 120)
      .stroke(this.colors.border)
      .fillAndStroke(this.colors.surface, this.colors.border);

    // Info content
    this.doc
      .fontSize(14)
      .fillColor(this.colors.textLight);

    const infoY = boxY + 25;
    this.addInfoRow('Domain:', analysisData.domain, infoY);
    this.addInfoRow('Analysis Date:', new Date(analysisData.analysisDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), infoY + 25);
    this.addInfoRow('Report Type:', 'AI-SEO Analysis', infoY + 50);

    // Footer
    this.doc
      .fontSize(10)
      .fillColor(this.colors.textMuted)
      .text('Generated by Snowball - AI-Powered Brand Analysis', this.margin, 700, {
        align: 'center'
      });
  }

  addInfoRow(label, value, y) {
    this.doc
      .fontSize(12)
      .fillColor(this.colors.textLight);
    
    this.doc.text(label, this.margin + 20, y, { continued: true });
    this.doc.text(` ${value}`, { align: 'left' });
  }

  addExecutiveSummary(analysisData, startY = this.margin) {
    let currentY = startY;
    
    currentY = this.addSectionTitle('Executive Summary', currentY);

    // Metrics box with improved design
    const boxHeight = 150;
    currentY = this.ensureSpace(currentY, boxHeight + 20, this.margin + 40);
    
    this.doc
      .rect(this.margin, currentY, this.contentWidth, boxHeight)
      .fillAndStroke(this.colors.surface, this.colors.border);

    // Key metrics
    const metricsY = currentY + 30;
    const col1X = this.margin + 30;
    const col2X = this.margin + (this.contentWidth / 2) + 30;

    this.addMetric('AI Visibility Score', `${Math.round(analysisData.aiVisibilityScore || 0)}%`, col1X, metricsY);
    this.addMetric('Brand Market Share', `${Math.round(analysisData.brandShare || 0)}%`, col2X, metricsY);
    this.addMetric('Total Mentions', (analysisData.totalMentions || 0).toString(), col1X, metricsY + 40);
    this.addMetric('Competitors Found', (analysisData.competitors?.length || 0).toString(), col2X, metricsY + 40);

    currentY += boxHeight + 30;

    // Description (guard for long text)
    currentY = this.ensureSpace(currentY, 30, this.margin + 40);
    this.doc
      .fontSize(16)
      .fillColor(this.colors.text)
      .text('Brand Description', this.margin, currentY);

    currentY += 30;
    const description = analysisData.description || 'No description available.';
    const descHeight = this.measureTextHeight(description, { size: 12, width: this.contentWidth, lineGap: 5 });
    currentY = this.ensureSpace(currentY, descHeight, this.margin + 40);
    this.doc
      .fontSize(12)
      .fillColor(this.colors.textLight)
      .text(description, this.margin, currentY, {
        width: this.contentWidth,
        lineGap: 5
      });

    return currentY + descHeight + 40;
  }

  addMetric(label, value, x, y) {
    this.doc
      .fontSize(10)
      .fillColor(this.colors.textMuted)
      .text(label, x, y);
    
    this.doc
      .fontSize(18)
      .fillColor(this.colors.primary)
      .text(value, x, y + 15);
  }

  addShareOfVoiceSection(analysisData, startY = this.margin) {
    let currentY = startY;
    
    currentY = this.addSectionTitle('Share of Voice Analysis', currentY);

    if (!analysisData.shareOfVoice || Object.keys(analysisData.shareOfVoice).length === 0) {
      this.doc
        .fontSize(12)
        .fillColor(this.colors.textMuted)
        .text('No Share of Voice data available.', this.margin, currentY);
      return currentY + 30;
    }

    const rowHeight = 25;
    const col1X = this.margin;
    const col2X = this.margin + 200;
    const col3X = this.margin + 320;
    const col4X = this.margin + 420;

    const drawHeader = (y) => {
      this.doc
        .rect(col1X, y, this.contentWidth, rowHeight)
        .fill(this.colors.primary);

      this.doc
        .fontSize(12)
        .fillColor('white')
        .text('Brand/Competitor', col1X + 10, y + 8)
        .text('Share of Voice',  col2X + 10, y + 8)
        .text('Mentions',        col3X + 10, y + 8)
        .text('Rank',            col4X + 10, y + 8);
    };

    currentY = this.ensureSpace(currentY, rowHeight, this.margin + 40);
    drawHeader(currentY);
    currentY += rowHeight;

    const sortedEntries = Object.entries(analysisData.shareOfVoice).sort((a, b) => b[1] - a[1]);

    sortedEntries.forEach(([brand, percentage], index) => {
      // Ensure space for row; if new page, redraw header
      currentY = this.ensureSpace(currentY, rowHeight, this.margin + 40);
      if (currentY === this.margin + 40) {
        drawHeader(currentY);
        currentY += rowHeight;
      }

      const mentions = (analysisData.mentionCounts && analysisData.mentionCounts[brand]) || 0;
      const isEven = index % 2 === 0;

      if (isEven) {
        this.doc
          .rect(col1X, currentY, this.contentWidth, rowHeight)
          .fill(this.colors.surface);
      }

      this.doc
        .fontSize(11)
        .fillColor(this.colors.text)
        .text(brand.substring(0, 25), col1X + 10, currentY + 8)
        .text(`${percentage.toFixed(1)}%`, col2X + 10, currentY + 8)
        .text(String(mentions), col3X + 10, currentY + 8);

      if (index === 0) {
        this.doc.fillColor(this.colors.warning).text('#1', col4X + 20, currentY + 8);
      } else {
        this.doc.fillColor(this.colors.textMuted).text(`#${index + 1}`, col4X + 10, currentY + 8);
      }

      currentY += rowHeight;
    });

    return currentY + 20;
  }

  // addCompetitorsSection(analysisData) {
  //   this.addSectionTitle('Competitor Analysis');

  //   if (!analysisData.competitors || analysisData.competitors.length === 0) {
  //     this.doc
  //       .fontSize(12)
  //       .fillColor(this.colors.textMuted)
  //       .text('No competitors identified in this analysis.', this.margin, 140);
  //     return;
  //   }

  //   this.doc
  //     .fontSize(14)
  //     .fillColor(this.colors.text)
  //     .text(`Found ${analysisData.competitors.length} competitors:`, this.margin, 140);

  //   let currentY = 170;
  //   analysisData.competitors.forEach((competitor, index) => {
  //     // Competitor box with improved styling
  //     this.doc
  //       .rect(this.margin, currentY, this.contentWidth, 30)
  //       .fillAndStroke(this.colors.surface, this.colors.border);

  //     // Competitor text
  //     this.doc
  //       .fontSize(12)
  //       .fillColor(this.colors.text)
  //       .text(`${index + 1}. ${competitor}`, this.margin + 15, currentY + 10);

  //     currentY += 35;
      
  //     // Add page break if needed
  //     if (currentY > 700 && index < analysisData.competitors.length - 1) {
  //       this.doc.addPage();
  //       currentY = 100;
  //     }
  //   });
  // }

  addCategoriesSection(categories, analysisData = null, startY = this.margin) {
    let currentY = this.addSectionTitle('Detailed Category Analysis', startY);
    
    const descriptionHeight = this.measureTextHeight(
      `Analysis across ${categories.length} business categories with AI-generated insights:`,
      { size: 12, width: this.contentWidth }
    );
    
    currentY = this.ensureSpace(currentY, descriptionHeight + 10, this.margin + 40);
    
    this.doc
      .fontSize(12)
      .fillColor(this.colors.textMuted)
      .text(`Analysis across ${categories.length} business categories with AI-generated insights:`, 
        this.margin, currentY, { width: this.contentWidth });

    currentY += descriptionHeight + 20;

    // Add competitor mention summary with improved design (if analysisData is available)
    if (analysisData) {
      currentY = this.addCompetitorMentionSummary(analysisData, currentY);
    }

    currentY += 10; // start below mentions summary

    categories.forEach((category, index) => {
      // Ensure space for category header
      currentY = this.ensureSpace(currentY, 30, 80);
      // Category header with primary color
      this.doc
        .rect(this.margin, currentY, this.contentWidth, 25)
        .fill(this.colors.primary);

      this.doc
        .fontSize(14)
        .fillColor('white')
        .text(`Category ${index + 1}: ${category.categoryName}`, this.margin + 10, currentY + 8);

      currentY += 30;

      // Process prompts and responses
      if (category.prompts && category.prompts.length > 0) {
        category.prompts.forEach((prompt, promptIndex) => {
          // Measure heights with the same font sizes used for rendering
          const promptText = prompt.promptText || 'No prompt text available';
          const promptHeight = this.measureTextHeight(promptText, { size: 10 });
          let responseText = '';
          let responseHeight = 0;
          if (prompt.aiResponse && prompt.aiResponse.responseText) {
            responseText = prompt.aiResponse.responseText;
            responseHeight = this.measureTextHeight(responseText, { size: 10 });
          }

          const blockHeaderHeight = 18;
          const neededForPromptBlock = 22 + blockHeaderHeight + promptHeight + 20;
          const neededForResponseHeader = 22 + blockHeaderHeight;
          const neededForResponseText = responseHeight + 25;

          // Ensure space: prompt header + text
          currentY = this.ensureSpace(currentY, neededForPromptBlock, 80);
          // Prompt header with improved styling
          this.doc
            .rect(this.margin, currentY, this.contentWidth, blockHeaderHeight)
            .fillAndStroke(this.colors.surface, this.colors.border);

          this.doc
            .fontSize(11)
            .fillColor(this.colors.text)
            .text(`Prompt ${promptIndex + 1}`, this.margin + 10, currentY + 5);

          currentY += 22;

          // Prompt text
          this.doc
            .fontSize(10)
            .fillColor(this.colors.textLight)
            .text(promptText, this.margin + 10, currentY, { 
              width: this.contentWidth - 20,
              lineGap: 3
            });

          currentY += promptHeight + 20;

          // AI Response
          if (responseText) {
            // Response header
            currentY = this.ensureSpace(currentY, neededForResponseHeader, 80);
            this.doc
              .rect(this.margin, currentY, this.contentWidth, blockHeaderHeight)
              .fillAndStroke(this.colors.surface, this.colors.border);

            this.doc
              .fontSize(11)
              .fillColor(this.colors.text)
              .text('AI Response', this.margin + 10, currentY + 5);

            currentY += 22;

            // Response text
            currentY = this.ensureSpace(currentY, neededForResponseText, 80);
            this.doc
              .fontSize(10)
              .fillColor(this.colors.text)
              .text(responseText, this.margin + 10, currentY, { 
                width: this.contentWidth - 20,
                lineGap: 3
              });

            currentY += responseHeight + 25;
          } else {
            currentY = this.ensureSpace(currentY, 25, 80);
            this.doc
              .fontSize(10)
              .fillColor(this.colors.textMuted)
              .text('No AI response available.', this.margin + 10, currentY);
            currentY += 25;
          }
        });
      } else {
        currentY = this.ensureSpace(currentY, 25, 80);
        this.doc
          .fontSize(11)
          .fillColor(this.colors.textMuted)
          .text('No prompts available for this category.', this.margin + 10, currentY);
        currentY += 25;
      }

      currentY += 10;
    });
  }

  addCompetitorMentionSummary(analysisData, startY = 165) {
    // Use the actual mentionsByBrand data that was already extracted
    const mentionsByBrand = analysisData.mentionsByBrand || {};
    
    // Display mention summary organized by brand and prompts
    if (Object.keys(mentionsByBrand).length > 0) {
      let currentY = this.ensureSpace(startY, 30, this.margin + 40);
      
      this.doc
        .fontSize(16)
        .fillColor(this.colors.text)
        .text('Brand Mentions by Prompt', this.margin, currentY);

      let summaryY = currentY + 25;
      
      // Sort brands by number of mentions (descending)
      const sortedBrands = Object.entries(mentionsByBrand)
        .sort(([,a], [,b]) => b.length - a.length);
      
      // Display each brand and its mentions organized by prompts
      sortedBrands.forEach(([brandName, mentions]) => {
        // Check if we need space for this brand section
        summaryY = this.ensureSpace(summaryY, 55, 80);

        // Brand header box
        this.doc
          .rect(this.margin, summaryY, this.contentWidth, 25)
          .fillAndStroke(this.colors.surface, this.colors.primary);

        this.doc
          .fontSize(14)
          .fillColor(this.colors.primary)
          .text(`${brandName.toUpperCase()} (${mentions.length} mentions)`, this.margin + 10, summaryY + 8);
        
        summaryY += 30;
        
        // Group mentions by unique prompts to avoid duplicates
        const promptGroups = {};
        mentions.forEach((mention) => {
          const promptText = mention.promptText || 'Unknown prompt';
          const key = promptText.substring(0, 100); // Use first 100 chars as key
          
          if (!promptGroups[key]) {
            promptGroups[key] = {
              promptText: promptText,
              categoryName: mention.categoryName || 'Unknown category',
              responses: []
            };
          }
          
          if (mention.responseText) {
            promptGroups[key].responses.push(mention.responseText);
          }
        });
        
        // Display each unique prompt and its details
        Object.values(promptGroups).forEach((group, index) => {
          // Check for page break
          summaryY = this.ensureSpace(summaryY, 70, 80);
          
          // Prompt header
          this.doc
            .fontSize(11)
            .fillColor(this.colors.text)
            .text(`${index + 1}. Category: ${group.categoryName}`, this.margin + 15, summaryY);
          
          summaryY += 15;
          
          // Prompt text (truncated)
          const promptPreview = group.promptText.length > 120 
            ? group.promptText.substring(0, 120) + '...'
            : group.promptText;
            
          const promptTextHeight = this.measureTextHeight(`Prompt: "${promptPreview}"`, {
            size: 10,
            width: this.contentWidth - 40,
            lineGap: 1
          });
            
          this.doc
            .fontSize(10)
            .fillColor(this.colors.textLight)
            .text(`Prompt: "${promptPreview}"`, this.margin + 20, summaryY, {
              width: this.contentWidth - 40,
              lineGap: 1
            });
          
          summaryY += promptTextHeight + 15;
          
          // // Response preview (first response if available)
          // if (group.responses.length > 0) {
          //   const responsePreview = group.responses[0].length > 150 
          //     ? group.responses[0].substring(0, 150) + '...'
          //     : group.responses[0];
              
          //   this.doc
          //     .fontSize(9)
          //     .fillColor(this.colors.textMuted)
          //     .text(`Response: "${responsePreview}"`, this.margin + 20, summaryY, {
          //       width: this.contentWidth - 40,
          //       lineGap: 1
          //     });
              
          //   summaryY += 20;
          // }
          
          summaryY += 8; // Space between prompts
        });
        
        summaryY += 15; // Space between brands
      });
      
      return summaryY + 15; // Return the Y position for continuing content
    } else {
      // No mentions found
      let currentY = this.ensureSpace(startY, 50, this.margin + 40);
      
      this.doc
        .fontSize(16)
        .fillColor(this.colors.text)
        .text('Brand Mentions by Prompt', this.margin, currentY);
        
      currentY += 25;
      
      this.doc
        .fontSize(12)
        .fillColor(this.colors.textMuted)
        .text('No brand mentions found in this analysis.', this.margin, currentY);
      
      return currentY + 30; // Return Y position after no mentions message
    }
  }

  addSectionTitle(title, startY = this.margin) {
    let currentY = startY;
    
    // Ensure space for title and line
    currentY = this.ensureSpace(currentY, 50, this.margin + 40);
    
    // Section title
    this.doc
      .fontSize(20)
      .fillColor(this.colors.text)
      .text(title, this.margin, currentY);

    currentY += 30;

    // Section line with primary color
    this.doc
      .moveTo(this.margin, currentY)
      .lineTo(this.pageWidth - this.margin, currentY)
      .stroke(this.colors.primary);

    return currentY + 20; // Return Y position after title and line
  }

  addLogo() {
    try {
      // Try to load logo from backend directory
      const logoPath = path.join(__dirname, '..', 'logo.jpg');
      
      if (fs.existsSync(logoPath)) {
        // Add logo centered at the top
        const logoWidth = 120;
        const logoHeight = 40;
        const logoX = (this.pageWidth - logoWidth) / 2;
        const logoY = 20;
        
        this.doc.image(logoPath, logoX, logoY, {
          width: logoWidth,
          height: logoHeight
        });
        console.log('✅ Logo loaded successfully');
        return;
      }
      
      // If logo not found, use text fallback
      console.log('⚠️ Logo not found, using text fallback');
      this.addTextLogo();
      
    } catch (error) {
      console.log('❌ Error loading logo:', error.message);
      this.addTextLogo();
    }
  }
  
  addTextLogo() {
    // Simple text fallback for logo
    this.doc
      .fontSize(24)
      .fillColor(this.colors.primary)
      .text('SNOWBALL', this.margin, 30, {
        align: 'center'
      });
  }

  addContactPage() {
    // Main "Thank You!" heading - large and purple as shown in image
    this.doc
      .fontSize(42)
      .fillColor(this.colors.primary)
      .text('Thank You!', this.margin, 150, { 
        align: 'center',
        width: this.contentWidth
      });

    // Contact information below - two pieces on same horizontal line as shown
    let contactY = 250;
    
    // Email address (left side)
    this.doc
      .fontSize(16)
      .fillColor(this.colors.textLight)
      .text('ashish@snowballai.digital', this.margin, contactY, {
        align: 'left'
      });

    // Book a call CTA (right side) - with space between as shown in image
    this.doc
      .fontSize(16)
      .fillColor(this.colors.textLight)
      .text('Book a call here', this.margin + 300, contactY, {
        align: 'right'
      });

    // Add Calendly link below the CTA
    this.doc
      .fontSize(12)
      .fillColor(this.colors.primary)
      .text('https://calendly.com/team-snowballai/30min', this.margin + 300, contactY + 20, {
        align: 'right'
      });
  }
}

module.exports = BrandAnalysisPDFGenerator;