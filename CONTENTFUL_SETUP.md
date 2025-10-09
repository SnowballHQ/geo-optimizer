# Contentful Blog Integration Setup Guide

This guide will help you set up Contentful CMS for your Snowball AI blog.

## 🚀 Quick Start

### 1. Create a Contentful Account

1. Go to [contentful.com](https://www.contentful.com/)
2. Sign up for a free account
3. Create a new Space (e.g., "Snowball Blog")

### 2. Get Your API Credentials

1. In your Contentful dashboard, go to **Settings > API keys**
2. Click **Add API key**
3. Copy the following values:
   - **Space ID**
   - **Content Delivery API - access token**

### 3. Configure Environment Variables

Open `frontend/.env` and replace the placeholder values:

```env
VITE_CONTENTFUL_SPACE_ID=your_actual_space_id
VITE_CONTENTFUL_ACCESS_TOKEN=your_actual_access_token
VITE_CONTENTFUL_ENVIRONMENT=master
```

## 📝 Create Blog Content Model in Contentful

### Step-by-Step Instructions:

1. In your Contentful space, go to **Content model**
2. Click **Add content type**
3. Name it `Blog Post` (API Identifier: `blogPost`)
4. Click **Create**

### Add the Following Fields:

#### 1. Title
- **Field type:** Short text
- **Field ID:** `title`
- **Required:** Yes
- **Appearance:** Single line

#### 2. Slug
- **Field type:** Short text
- **Field ID:** `slug`
- **Required:** Yes
- **Appearance:** Slug
- **Validation:** Unique

#### 3. Excerpt
- **Field type:** Long text
- **Field ID:** `excerpt`
- **Required:** No
- **Appearance:** Single line
- **Help text:** Brief summary of the article (150-200 characters)

#### 4. Content
- **Field type:** Rich text
- **Field ID:** `content`
- **Required:** Yes

#### 5. Featured Image
- **Field type:** Media (One file)
- **Field ID:** `featuredImage`
- **Required:** No
- **Validation:** Accept only images

#### 6. Author
- **Field type:** Short text
- **Field ID:** `author`
- **Required:** No
- **Appearance:** Single line

#### 7. Category
- **Field type:** Short text
- **Field ID:** `category`
- **Required:** No
- **Appearance:** Single line
- **Help text:** e.g., SEO, Content Marketing, AI Tools

#### 8. Tags
- **Field type:** Short text (List)
- **Field ID:** `tags`
- **Required:** No
- **Appearance:** Tags

#### 9. Published Date
- **Field type:** Date and time
- **Field ID:** `publishedDate`
- **Required:** Yes
- **Default:** Current date/time

#### 10. Reading Time
- **Field type:** Integer
- **Field ID:** `readingTime`
- **Required:** No
- **Appearance:** Number editor
- **Help text:** Estimated reading time in minutes

#### 11. Featured (Optional)
- **Field type:** Boolean
- **Field ID:** `featured`
- **Required:** No
- **Help text:** Mark as featured to show on homepage

## ✍️ Creating Your First Blog Post

1. Go to **Content** in your Contentful dashboard
2. Click **Add entry** > **Blog Post**
3. Fill in all the required fields:
   - Title
   - Slug (auto-generated from title)
   - Content (use the rich text editor)
   - Published Date
4. Add optional fields:
   - Featured Image
   - Author
   - Category
   - Tags
   - Reading Time
   - Featured checkbox
5. Click **Publish** in the top right

## 🎨 Features Implemented

### Landing Page Blog Section
- Displays the 3 most recent blog posts
- Automatically hides if no posts are available
- Animated cards with hover effects
- Links to full blog listing page

### Blog Listing Page (`/blog`)
- Shows up to 12 blog posts
- Search functionality
- Responsive grid layout
- Back to home navigation
- CTA section

### Individual Blog Post Page (`/blog/:slug`)
- Full article display with rich text formatting
- Featured image
- Author information
- Reading time and publish date
- Category badge
- Tags
- Social sharing buttons (Twitter, Facebook, LinkedIn, Copy link)
- Back to blog navigation
- CTA section

## 📱 Rich Text Features

The blog post content supports:
- Headings (H1-H4)
- Paragraphs
- Bold, italic, underline
- Lists (ordered and unordered)
- Block quotes
- Hyperlinks
- Embedded images
- Code blocks (if enabled in Contentful)

## 🔄 API Functions Available

The following functions are available in `frontend/src/services/contentful.js`:

```javascript
// Get paginated blog posts
getBlogPosts(limit, skip)

// Get a single post by slug
getBlogPostBySlug(slug)

// Get featured posts
getFeaturedBlogPosts(limit)

// Get posts by category
getBlogPostsByCategory(category, limit)

// Search posts
searchBlogPosts(query, limit)
```

## 🎯 Best Practices

### Content Guidelines:
1. **Title:** Keep it under 60 characters for SEO
2. **Slug:** Use lowercase, hyphens, no special characters
3. **Excerpt:** 150-200 characters, compelling summary
4. **Featured Image:** 1200x630px recommended (2:1 ratio)
5. **Reading Time:** Calculate 200-250 words per minute
6. **Tags:** 3-5 relevant tags per post
7. **Category:** Use consistent naming (e.g., "SEO", "Content Marketing")

### SEO Tips:
- Use descriptive, keyword-rich titles
- Write compelling excerpts that encourage clicks
- Use high-quality featured images
- Structure content with proper headings (H2, H3)
- Add internal and external links
- Use alt text for images in rich content

## 🧪 Testing Your Setup

1. **Create a test post** in Contentful
2. **Publish it**
3. **Wait 1-2 minutes** for cache to clear
4. **Visit your landing page** - you should see the blog section
5. **Click "View All Articles"** to see the blog listing
6. **Click on a post** to view the full article

## 🐛 Troubleshooting

### Blog section not showing on landing page:
- Verify environment variables are correct
- Check that you have published posts in Contentful
- Check browser console for errors
- Ensure Contentful API keys have read permissions

### Images not loading:
- Verify images are uploaded in Contentful
- Check that image URLs are valid
- Contentful images use protocol-relative URLs (//images.ctfassets.net/...)

### Rich text not rendering:
- Ensure `@contentful/rich-text-react-renderer` is installed
- Check that content field is set as "Rich text" type in Contentful

### 404 errors on blog routes:
- Ensure the React Router is configured correctly
- Check that the dev server is running
- Verify slug matches exactly (case-sensitive)

## 📚 Additional Resources

- [Contentful Documentation](https://www.contentful.com/developers/docs/)
- [Rich Text Rendering](https://www.contentful.com/developers/docs/javascript/tutorials/rendering-contentful-rich-text-with-javascript/)
- [Content Delivery API](https://www.contentful.com/developers/docs/references/content-delivery-api/)

## 🎉 Next Steps

Once your blog is set up:
1. Create a content calendar
2. Write and publish regular articles
3. Share posts on social media
4. Monitor analytics
5. Update old posts for freshness
6. Consider adding:
   - Newsletter subscription
   - Related posts section
   - Comments system
   - Author pages
   - Category/tag filtering
   - RSS feed

## 📝 Notes

- The blog gracefully handles errors - if Contentful is unreachable, the blog section simply won't show
- Environment variables must start with `VITE_` to be accessible in the frontend
- Content changes in Contentful may take 1-2 minutes to reflect due to CDN caching
- Free Contentful plan includes up to 25,000 records and 1TB of asset bandwidth

---

**Need help?** Check the [Contentful Community Forum](https://www.contentful.com/developers/community/) or contact support.
