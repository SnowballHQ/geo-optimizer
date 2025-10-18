# Lottie Animations for Snowball Landing Page

This directory contains Lottie animation files used throughout the Snowball landing page.

## 📁 Folder Structure

```
animations/
├── hero/           # Hero section animations
├── features/       # Feature card icon animations
├── metrics/        # Metrics section animations
└── ui/            # UI elements (loading, scroll indicators, etc.)
```

## 🎨 Required Animations

### Hero Section (`hero/`)
- **dashboard-preview.json** - Animated dashboard or data visualization
  - **Search terms:** "dashboard animation", "data analysis", "analytics dashboard"
  - **Style:** Professional, clean, matches brand colors (#6658f4)
  - **Duration:** 3-5 seconds, loop

### Feature Cards (`features/`)
1. **ai-brain.json** - AI/Machine learning animation
   - **Search terms:** "AI brain", "artificial intelligence", "neural network"
   - **Style:** Tech, modern, purple tones
   - **Duration:** 2-3 seconds, loop

2. **seo-search.json** - SEO/Search optimization
   - **Search terms:** "SEO", "search optimization", "search engine"
   - **Style:** Clean, magnifying glass or search-related
   - **Duration:** 2-3 seconds, loop

3. **growth-chart.json** - Performance/Growth chart
   - **Search terms:** "growth chart", "trending up", "business growth"
   - **Style:** Upward trending, positive, energetic
   - **Duration:** 2-3 seconds, loop

4. **target-audience.json** - Target/Goal achievement
   - **Search terms:** "target goal", "bullseye", "audience targeting"
   - **Style:** Focused, precise
   - **Duration:** 2-3 seconds, loop

### Metrics Section (`metrics/`)
1. **trending-up.json** - Trending up chart animation
   - **Search terms:** "trending up", "growth arrow", "increase"
   - **Style:** Bold, positive momentum
   - **Duration:** 2-3 seconds, loop

2. **search-analytics.json** - Search/Analytics icon
   - **Search terms:** "search analytics", "data search", "magnifying glass data"
   - **Style:** Analytical, professional
   - **Duration:** 2-3 seconds, loop

3. **user-engagement.json** - Users/Community
   - **Search terms:** "user engagement", "community", "people analytics"
   - **Style:** Friendly, collaborative
   - **Duration:** 2-3 seconds, loop

### UI Elements (`ui/`)
1. **loading.json** - Loading spinner/animation
   - **Search terms:** "loading", "spinner", "data loading"
   - **Style:** Subtle, brand colors
   - **Duration:** 1-2 seconds, loop

2. **scroll-down.json** - Scroll indicator
   - **Search terms:** "scroll down", "arrow down", "scroll indicator"
   - **Style:** Minimal, bouncing motion
   - **Duration:** 1-2 seconds, loop

3. **sparkle.json** - Sparkle/shine effect (optional)
   - **Search terms:** "sparkle", "shine", "stars"
   - **Style:** Subtle, accent
   - **Duration:** 1-2 seconds, loop

## 📥 How to Download Animations from LottieFiles

### Step 1: Visit LottieFiles
Go to the relevant category pages:
- AI: https://lottiefiles.com/free-animations/ai
- SEO: https://lottiefiles.com/free-animations/seo
- Charts: https://lottiefiles.com/free-animations/chart
- Dashboard: https://lottiefiles.com/free-animations/dashboard
- Loading: https://lottiefiles.com/free-animations/loading

### Step 2: Search for Animations
Use the search terms provided above for each animation

### Step 3: Download Format
- Click on the animation you like
- Click "Download" button
- Select **Lottie JSON** format (recommended) or **dotLottie** (smaller size)
- Free animations don't require login

### Step 4: Save to Correct Folder
- Rename the downloaded file to match the names above
- Place in the appropriate subfolder

### Step 5: Test the Animation
- Refresh your development server
- The animations should automatically load on the landing page

## 🎨 Design Guidelines

### Color Scheme
- **Primary:** #6658f4 (Purple)
- **Secondary:** #7c77ff (Light Purple)
- **Accent:** White, light grays

### Animation Style
- **Modern & Minimal:** Clean lines, not overly complex
- **Professional:** Business-appropriate, not cartoonish
- **Smooth:** 60fps, fluid motion
- **Purposeful:** Each animation should enhance understanding

### Performance
- **File Size:** Keep under 100KB per animation
- **Duration:** 1-5 seconds maximum
- **Format:** Lottie JSON or dotLottie (smaller)
- **Optimization:** Use dotLottie format when possible

## 🔧 Using Custom Animations

If you want to use your own animations:

1. **Create in After Effects**
   - Design your animation
   - Export using Bodymovin plugin
   - Save as JSON

2. **Use LottieFiles Creator**
   - https://lottiefiles.com/create
   - Create animations directly in browser
   - Export as Lottie JSON

3. **AI-Generated (New!)**
   - https://lottiefiles.com/ai
   - Use AI to generate animations from text prompts
   - Customize and download

## 📚 Resources

- **LottieFiles:** https://lottiefiles.com
- **lottie-react docs:** https://www.npmjs.com/package/lottie-react
- **Lottie by Airbnb:** https://airbnb.io/lottie/

## 🆘 Troubleshooting

**Animation not showing?**
- Check file path is correct (relative to `public/`)
- Verify JSON file is valid
- Check browser console for errors
- Ensure file name matches exactly (case-sensitive)

**Animation too large?**
- Use dotLottie format instead of JSON
- Simplify animation in After Effects
- Reduce keyframes and complexity

**Animation not smooth?**
- Check animation is 60fps
- Reduce file size
- Enable hardware acceleration in browser

## 💡 Tips

- Use **loop: true** for icon animations
- Use **playOnScroll: true** for below-the-fold content
- Use **playOnHover: true** for interactive elements
- Keep animations under 3 seconds for best UX
- Test on mobile devices for performance
