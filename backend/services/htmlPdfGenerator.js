const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class HTMLPdfGenerator {
  constructor() {
    this.templatePath = path.join(__dirname, '..', 'templates', 'pdfTemplate.html');
  }

  /**
   * Generate PDF from analysis data using HTML template and Puppeteer
   * @param {Object} analysisData - The analysis data to populate in the PDF
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async generateBrandAnalysisPDF(analysisData) {
    let browser = null;

    try {
      console.log('📄 HTML PDF Generator: Starting PDF generation');

      // Read the HTML template
      const template = await fs.readFile(this.templatePath, 'utf-8');

      // Prepare data for injection
      const preparedData = this.prepareAnalysisData(analysisData);

      // Replace placeholders in template
      let html = this.injectDataIntoTemplate(template, preparedData);

      console.log('✅ HTML PDF Generator: Template prepared with data');

      // Launch Puppeteer browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();

      // Set content and wait for charts to render
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'domcontentloaded']
      });

      // Wait for charts to fully render
      await page.waitForTimeout(2000); // Give Chart.js time to render

      console.log('✅ HTML PDF Generator: Charts rendered');

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        }
      });

      console.log('✅ HTML PDF Generator: PDF generated successfully');

      return pdfBuffer;

    } catch (error) {
      console.error('❌ HTML PDF Generator Error:', error);
      throw new Error(`HTML PDF generation failed: ${error.message}`);
    } finally {
      // Always close the browser
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Prepare analysis data for template injection
   * @param {Object} analysisData - Raw analysis data
   * @returns {Object} - Prepared data
   */
  prepareAnalysisData(analysisData) {
    return {
      brandName: analysisData.brandName || analysisData.domain || 'Unknown Brand',
      domain: analysisData.domain || 'N/A',
      analysisDate: this.formatDate(analysisData.analysisDate || analysisData.createdAt),
      aiVisibilityScore: Math.round(analysisData.aiVisibilityScore || 0),
      brandShare: Math.round(analysisData.brandShare || 0),
      totalMentions: analysisData.totalMentions || 0,
      competitorsCount: analysisData.competitors?.length || 0,
      description: analysisData.description || analysisData.brandInformation || `Analysis of ${analysisData.brandName || analysisData.domain}`,
      shareOfVoice: analysisData.shareOfVoice || {},
      mentionCounts: analysisData.mentionCounts || {},
      competitors: analysisData.competitors || [],
      categories: analysisData.categories || [],
      mentionsByBrand: analysisData.mentionsByBrand || {}
    };
  }

  /**
   * Inject data into HTML template
   * @param {string} template - HTML template string
   * @param {Object} data - Prepared data object
   * @returns {string} - HTML with injected data
   */
  injectDataIntoTemplate(template, data) {
    // Replace simple placeholders
    let html = template
      .replace(/\{\{brandName\}\}/g, this.escapeHtml(data.brandName))
      .replace(/\{\{domain\}\}/g, this.escapeHtml(data.domain))
      .replace(/\{\{analysisDate\}\}/g, this.escapeHtml(data.analysisDate))
      .replace(/\{\{aiVisibilityScore\}\}/g, data.aiVisibilityScore)
      .replace(/\{\{brandShare\}\}/g, data.brandShare)
      .replace(/\{\{totalMentions\}\}/g, data.totalMentions)
      .replace(/\{\{competitorsCount\}\}/g, data.competitorsCount)
      .replace(/\{\{description\}\}/g, this.escapeHtml(data.description));

    // Inject complex data object for JavaScript
    const dataJSON = JSON.stringify({
      shareOfVoice: data.shareOfVoice,
      mentionCounts: data.mentionCounts,
      categories: data.categories,
      mentionsByBrand: data.mentionsByBrand
    });

    html = html.replace('{{DATA_PLACEHOLDER}}', dataJSON);

    return html;
  }

  /**
   * Format date to readable string
   * @param {Date|string} date - Date to format
   * @returns {string} - Formatted date
   */
  formatDate(date) {
    if (!date) return 'N/A';

    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml(text) {
    if (!text) return '';

    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return text.toString().replace(/[&<>"']/g, (m) => map[m]);
  }
}

module.exports = HTMLPdfGenerator;
