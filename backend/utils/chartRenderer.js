const puppeteer = require('puppeteer');

/**
 * Render a Chart.js doughnut chart in a headless browser and return PNG buffer
 * @param {Object} params
 * @param {string[]} params.labels
 * @param {number[]} params.data
 * @param {string[]} params.colors - hex or rgba strings for segments
 * @param {string} [params.title]
 * @param {number} [params.size] - canvas size in px (square). Default 600
 * @returns {Promise<Buffer>} PNG buffer
 */
async function renderDoughnutChart({ labels, data, colors, title = 'Share of Voice', size = 600 }) {
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        html, body { margin: 0; padding: 0; }
        #wrap { width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; }
        canvas { width: ${size}px; height: ${size}px; }
      </style>
    </head>
    <body>
      <div id="wrap">
        <canvas id="c" width="${size}" height="${size}"></canvas>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
      <script>
        const labels = ${JSON.stringify(labels)};
        const data = ${JSON.stringify(data)};
        const colors = ${JSON.stringify(colors)};
        const title = ${JSON.stringify(title)};
        const ctx = document.getElementById('c').getContext('2d');
        const chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{
              data,
              backgroundColor: colors,
              borderWidth: 0
            }]
          },
          options: {
            responsive: false,
            plugins: {
              legend: { display: true, position: 'bottom', labels: { boxWidth: 14, boxHeight: 14 } },
              title: { display: true, text: title, color: '#2d3142', font: { size: 18, weight: '600' } }
            },
            cutout: '55%'
          }
        });
      </script>
    </body>
  </html>`;

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    // Give Chart.js a brief moment to render (compat without waitForTimeout)
    await new Promise((r) => setTimeout(r, 120));
    const dataUrl = await page.evaluate(() => {
      const c = document.getElementById('c');
      return c.toDataURL('image/png');
    });
    const png = Buffer.from(dataUrl.split(',')[1], 'base64');
    return png;
  } finally {
    await browser.close();
  }
}

module.exports = {
  renderDoughnutChart,
};


