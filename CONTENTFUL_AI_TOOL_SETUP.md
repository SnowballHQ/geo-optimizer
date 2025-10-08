# Contentful AI Tool Content Type Setup Guide

## Overview
This guide will help you create the `aiTool` content type in Contentful for your AI Tools directory.

## Steps to Create Content Type

### 1. Access Contentful
1. Go to [https://app.contentful.com](https://app.contentful.com)
2. Log in to your account
3. Select your space: `l50i0nvj50of`
4. Navigate to **Content model** in the top navigation

### 2. Create New Content Type
1. Click **"Add content type"** button
2. Enter the following details:
   - **Name**: `AI Tool`
   - **API Identifier**: `aiTool` (important - must match exactly)
   - **Description**: `AI tool listing for the directory`
3. Click **"Create"**

### 3. Add Fields

Click **"Add field"** for each field below and configure as specified:

#### Field 1: Internal Name
- **Field type**: Text (Short text)
- **Name**: `Internal Name`
- **Field ID**: `internalName`
- **Appearance**: Single line
- **Validations**: Required
- **Help text**: `Internal reference name (not displayed publicly)`

#### Field 2: Tool Name
- **Field type**: Text (Short text)
- **Name**: `Tool Name`
- **Field ID**: `toolName`
- **Appearance**: Single line
- **Validations**: Required
- **Help text**: `Public name of the AI tool`

#### Field 3: Slug
- **Field type**: Text (Short text)
- **Name**: `Slug`
- **Field ID**: `slug`
- **Appearance**: Slug
- **Validations**: Required, Unique
- **Help text**: `URL-friendly identifier (e.g., "chatgpt" for ChatGPT)`

#### Field 4: Tagline
- **Field type**: Text (Short text)
- **Name**: `Tagline`
- **Field ID**: `tagline`
- **Appearance**: Single line
- **Help text**: `Brief one-liner describing the tool`

#### Field 5: Logo
- **Field type**: Media (Single file)
- **Name**: `Logo`
- **Field ID**: `logo`
- **Validations**: Accept only images (JPEG, PNG, WebP, GIF, SVG)
- **Help text**: `Tool logo/icon (recommended: 256x256px)`

#### Field 6: Category
- **Field type**: Text (Short text, list)
- **Name**: `Category`
- **Field ID**: `category`
- **Appearance**: Tags
- **Settings**: Allow multiple values
- **Predefined values** (optional):
  - Content Writing
  - SEO
  - Image Generation
  - Code Assistants
  - Marketing
  - Analytics
  - Video Editing
  - Audio Processing
  - Research
  - Productivity
- **Help text**: `Tool categories (can add multiple)`

#### Field 7: Description
- **Field type**: Text (Long text)
- **Name**: `Description`
- **Field ID**: `description`
- **Appearance**: Markdown
- **Help text**: `Detailed description of the tool and what it does`

#### Field 8: Key Features
- **Field type**: Text (Short text, list)
- **Name**: `Key Features`
- **Field ID**: `keyFeatures`
- **Appearance**: List
- **Settings**: Allow multiple values
- **Help text**: `Main features of the tool (one per line)`

#### Field 9: Pros
- **Field type**: Text (Short text, list)
- **Name**: `Pros`
- **Field ID**: `pros`
- **Appearance**: List
- **Settings**: Allow multiple values
- **Help text**: `Advantages of using this tool`

#### Field 10: Cons
- **Field type**: Text (Short text, list)
- **Name**: `Cons`
- **Field ID**: `cons`
- **Appearance**: List
- **Settings**: Allow multiple values
- **Help text**: `Limitations or drawbacks of the tool`

#### Field 11: Use Cases
- **Field type**: Text (Short text, list)
- **Name**: `Use Cases`
- **Field ID**: `useCases`
- **Appearance**: List
- **Settings**: Allow multiple values
- **Help text**: `Common scenarios where this tool is useful`

#### Field 12: Pricing Type
- **Field type**: Text (Short text)
- **Name**: `Pricing Type`
- **Field ID**: `pricingType`
- **Appearance**: Dropdown
- **Predefined values**:
  - Free
  - Freemium
  - Paid
  - Trial
- **Default value**: `Free`
- **Help text**: `Pricing model of the tool`

#### Field 13: Pricing Details
- **Field type**: Text (Long text)
- **Name**: `Pricing Details`
- **Field ID**: `pricingDetails`
- **Appearance**: Multiple lines
- **Help text**: `Detailed pricing information and tiers`

#### Field 14: Monthly Price
- **Field type**: Number (Integer)
- **Name**: `Monthly Price`
- **Field ID**: `monthlyPrice`
- **Help text**: `Starting monthly price in USD (leave empty for free tools)`

#### Field 15: Website URL
- **Field type**: Text (Short text)
- **Name**: `Website URL`
- **Field ID**: `websiteUrl`
- **Validations**: Required, URL format
- **Help text**: `Official website URL of the tool`

#### Field 16: Platforms
- **Field type**: Text (Short text, list)
- **Name**: `Platforms`
- **Field ID**: `platforms`
- **Appearance**: Tags
- **Settings**: Allow multiple values
- **Predefined values** (optional):
  - Web
  - Windows
  - Mac
  - Linux
  - iOS
  - Android
  - Chrome Extension
  - API
- **Help text**: `Platforms where the tool is available`

#### Field 17: Screenshots
- **Field type**: Media (Multiple files)
- **Name**: `Screenshots`
- **Field ID**: `screenshots`
- **Settings**: Allow multiple files
- **Validations**: Accept only images
- **Help text**: `Product screenshots (optional, for detail page)`

#### Field 18: Rating
- **Field type**: Number (Decimal)
- **Name**: `Rating`
- **Field ID**: `rating`
- **Validations**: Range (0 to 5)
- **Help text**: `Overall rating out of 5 stars`

#### Field 19: Review Count
- **Field type**: Number (Integer)
- **Name**: `Review Count`
- **Field ID**: `reviewCount`
- **Help text**: `Number of reviews/ratings`

#### Field 20: Verified
- **Field type**: Boolean
- **Name**: `Verified`
- **Field ID**: `verified`
- **Default value**: `false`
- **Help text**: `Mark as verified/trusted tool`

#### Field 21: Featured
- **Field type**: Boolean
- **Name**: `Featured`
- **Field ID**: `featured`
- **Default value**: `false`
- **Help text**: `Feature this tool on the homepage`

#### Field 22: AI Models Used
- **Field type**: Text (Short text, list)
- **Name**: `AI Models Used`
- **Field ID**: `aiModelsUsed`
- **Appearance**: Tags
- **Settings**: Allow multiple values
- **Predefined values** (optional):
  - GPT-4
  - GPT-3.5
  - Claude
  - Gemini
  - DALL-E
  - Stable Diffusion
  - Midjourney
  - LLaMA
  - Custom Model
- **Help text**: `AI models/technologies used by this tool`

#### Field 23: Last Updated
- **Field type**: Date and time
- **Name**: `Last Updated`
- **Field ID**: `lastUpdated`
- **Help text**: `When the tool was last updated`

### 4. Configure Display Field
1. Click **"Settings"** (gear icon) in the top right
2. Under **Entry title**, select `toolName` as the display field
3. Click **"Save"**

### 5. Save Content Type
Click **"Save"** in the top right corner

## Creating Your First AI Tool Entry

1. Go to **Content** in the top navigation
2. Click **"Add entry"** → **"AI Tool"**
3. Fill in the fields (example for ChatGPT):
   - **Internal Name**: `ChatGPT`
   - **Tool Name**: `ChatGPT`
   - **Slug**: `chatgpt`
   - **Tagline**: `Advanced AI chatbot for conversations and content creation`
   - **Logo**: Upload ChatGPT logo
   - **Category**: `Content Writing`, `Code Assistants`
   - **Description**: `ChatGPT is an advanced language model...`
   - **Key Features**:
     - `Natural conversation capabilities`
     - `Code generation and debugging`
     - `Content writing and editing`
   - **Pros**:
     - `Highly accurate responses`
     - `Wide range of capabilities`
     - `Easy to use interface`
   - **Cons**:
     - `Can occasionally provide incorrect information`
     - `Limited to training data cutoff`
   - **Use Cases**:
     - `Writing blog posts and articles`
     - `Answering questions`
     - `Code assistance`
   - **Pricing Type**: `Freemium`
   - **Pricing Details**: `Free tier available. ChatGPT Plus: $20/month`
   - **Monthly Price**: `20`
   - **Website URL**: `https://chat.openai.com`
   - **Platforms**: `Web`, `iOS`, `Android`
   - **Rating**: `4.8`
   - **Review Count**: `15000`
   - **Verified**: `true`
   - **Featured**: `true`
   - **AI Models Used**: `GPT-4`, `GPT-3.5`

4. Click **"Publish"** (or "Save" as draft)

## Testing the Integration

After creating at least one published AI tool entry:

1. Make sure your dev server is running: `npm run dev`
2. Navigate to `http://localhost:5174/ai-tools`
3. You should see your AI tool(s) displayed in the grid
4. Click on a tool card to view the detail page

## Bulk Import (Optional)

If you want to add multiple tools at once:

1. Create them manually in Contentful, or
2. Use Contentful's Import API (requires scripting)
3. Use Contentful's CSV import feature (if available in your plan)

## Notes

- All published entries will automatically appear on your website
- You can create drafts and publish them later
- Use the `featured` field to highlight specific tools
- The `verified` badge adds credibility to tool listings
- Categories are used for filtering on the directory page

## Need Help?

- Contentful Documentation: [https://www.contentful.com/developers/docs/](https://www.contentful.com/developers/docs/)
- Content Model Guide: [https://www.contentful.com/help/content-model/](https://www.contentful.com/help/content-model/)
