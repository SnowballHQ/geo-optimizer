# WordPress Integration Setup Guide

## Overview

Snowball now supports publishing blog content directly to WordPress sites using the WordPress REST API and Application Passwords. This integration allows users to publish AI-generated content from Snowball to their WordPress blogs seamlessly.

## How It Works

Unlike Shopify and Webflow which use OAuth, WordPress integration uses **Application Passwords** for authentication:

1. **User provides credentials**: WordPress site URL, username, and Application Password
2. **Connection testing**: Snowball verifies the credentials and permissions
3. **Content publishing**: Users can publish blogs directly to their WordPress site
4. **Tag/Category management**: Keywords are automatically converted to WordPress tags

## WordPress Site Requirements

### Minimum Requirements
- **WordPress Version**: 5.6+ (Application Passwords introduced in 5.6)
- **REST API**: Must be enabled (enabled by default)
- **User Role**: Editor or Administrator permissions
- **SSL**: HTTPS recommended for security

### Compatibility
- ✅ Self-hosted WordPress sites
- ✅ WordPress.com Business plan and above
- ✅ Managed WordPress hosting (WP Engine, Kinsta, etc.)
- ❌ WordPress.com Free/Personal plans (REST API limited)

## Setting Up Application Passwords

### For Self-Hosted WordPress Sites:

1. **Login to WordPress Admin** as Administrator or Editor
2. **Navigate to Users** → **Profile** (or Users → All Users → [Your User])
3. **Scroll to Application Passwords section**
4. **Add New Application Password**:
   - Name: `Snowball Content Publisher` 
   - Click **Add New Application Password**
5. **Copy the generated password** (it will only be shown once)
6. **Save the password securely** - you'll need it for Snowball

### For WordPress.com Sites (Business Plan+):

1. **Go to** [WordPress.com Account Settings](https://wordpress.com/me/security)
2. **Click** "Add New Application Password"
3. **Enter Application Name**: `Snowball Content Publisher`
4. **Copy the generated password**

## Connecting WordPress to Snowball

### Step 1: Navigate to CMS Connections
1. Login to your Snowball dashboard
2. Go to **Settings** → **CMS Connections**
3. Click **Add New Connection**
4. Select **WordPress**

### Step 2: Enter Credentials
- **Site URL**: Your WordPress site URL (e.g., `https://yourblog.com`)
- **Username**: Your WordPress username
- **Application Password**: The password generated in previous step

### Step 3: Test Connection
1. Click **Test Connection**
2. Snowball will verify:
   - WordPress site accessibility
   - REST API availability
   - Authentication credentials
   - User permissions
3. If successful, click **Save Connection**

## Publishing Content

### From Content Calendar
1. **Create or select content** in Content Calendar
2. **Click** "Publish to CMS"
3. **Select** "WordPress" from platform dropdown
4. **Configure options**:
   - Post Status: Draft or Publish
   - Categories (optional)
   - Tags (auto-generated from keywords)
5. **Click** "Publish"

### Publishing Options
- **Post Status**: 
  - `draft` - Save as draft for review
  - `publish` - Publish immediately
- **Categories**: Select existing WordPress categories
- **Tags**: Auto-created from content keywords
- **Featured Image**: Supported (if included in content)
- **SEO Metadata**: Added as custom fields and HTML comments

## API Endpoints

The WordPress integration exposes these endpoints:

### Authentication Required Endpoints
- `POST /api/v1/wordpress/connect` - Save WordPress credentials
- `POST /api/v1/wordpress/test-connection` - Test connection
- `POST /api/v1/wordpress/publish` - Publish content
- `GET /api/v1/wordpress/status` - Check connection status
- `GET /api/v1/wordpress/site-info` - Get categories, tags, user info
- `DELETE /api/v1/wordpress/disconnect` - Remove connection
- `GET /api/v1/wordpress/debug-api` - Debug connection

### Request Examples

#### Test Connection
```bash
curl -X POST https://your-snowball-api.com/api/v1/wordpress/test-connection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "siteUrl": "https://yourblog.com",
    "username": "your-username",
    "applicationPassword": "your-app-password"
  }'
```

#### Publish Content
```bash
curl -X POST https://your-snowball-api.com/api/v1/wordpress/publish \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Blog Post Title",
    "content": "<p>Blog post content here...</p>",
    "keywords": ["SEO", "content marketing", "blogging"],
    "targetAudience": "Content marketers",
    "status": "publish",
    "categories": [1, 2],
    "tags": ["custom-tag"]
  }'
```

## Troubleshooting

### Common Issues

#### 1. "WordPress REST API not found" (404)
**Causes:**
- REST API is disabled
- Incorrect site URL
- Site behind maintenance mode

**Solutions:**
- Verify site URL is correct
- Check if REST API is enabled: visit `yoursiteurl.com/wp-json/wp/v2/`
- Disable maintenance mode temporarily

#### 2. "Authentication failed" (401)
**Causes:**
- Wrong username or Application Password
- Application Password expired or revoked
- Two-factor authentication conflicts

**Solutions:**
- Verify username is correct
- Generate new Application Password
- Check user has Editor/Administrator role

#### 3. "Permission denied" (403)
**Causes:**
- User doesn't have publish_posts capability
- REST API disabled for user role
- Security plugins blocking API access

**Solutions:**
- Ensure user has Editor or Administrator role
- Check security plugin settings (Wordfence, etc.)
- Whitelist Snowball's server IP if needed

#### 4. "Cannot reach WordPress site" (Connection timeout)
**Causes:**
- Site is down or slow
- Firewall blocking requests
- DNS issues

**Solutions:**
- Verify site is accessible in browser
- Check hosting provider status
- Try again after a few minutes

### Debug Steps

1. **Test WordPress REST API directly**:
   ```bash
   curl https://yoursite.com/wp-json/wp/v2/
   ```

2. **Test authentication**:
   ```bash
   curl https://yoursite.com/wp-json/wp/v2/users/me \
     -H "Authorization: Basic base64(username:app-password)"
   ```

3. **Check Snowball logs** for detailed error messages

4. **Use debug endpoint** in Snowball:
   ```bash
   GET /api/v1/wordpress/debug-api
   ```

### WordPress Hosting Considerations

#### Shared Hosting
- May have REST API rate limits
- Some providers block external API requests
- Contact hosting support if issues persist

#### Managed WordPress Hosting
- Generally well-supported
- May have enhanced security that needs configuration
- Check with provider for API access requirements

#### WordPress.com
- Business plan required for full REST API access
- Application Passwords work differently than self-hosted
- Some features may be limited

## Security Best Practices

### For WordPress Site
1. **Use strong Application Passwords**
2. **Regular security updates**
3. **Monitor API access logs**
4. **Revoke unused Application Passwords**
5. **Use HTTPS only**

### For Snowball Users
1. **Don't share Application Passwords**
2. **Use separate Application Password per service**
3. **Revoke access when not needed**
4. **Monitor published content regularly**

## Limitations

### Current Limitations
- **Featured Images**: Limited to existing media library or public URLs
- **Custom Fields**: Basic support via meta fields
- **Gutenberg Blocks**: Content published as Classic Editor HTML
- **Multisite**: Single site support only

### Content Formatting
- **HTML**: Fully supported
- **Markdown**: Converted to HTML before publishing
- **Images**: Must be publicly accessible URLs
- **Videos**: Embedded videos supported

## Support

### Getting Help
1. **Check this documentation** for common solutions
2. **Use debug endpoints** to diagnose issues
3. **Contact Snowball support** with error details
4. **WordPress.org forums** for WordPress-specific issues

### Reporting Issues
When reporting WordPress integration issues, include:
- WordPress version
- Hosting provider
- Error messages from Snowball
- Browser console errors (if applicable)
- Steps to reproduce

## API Reference

### WordPress Connection Model
```javascript
{
  userId: ObjectId,
  platform: "wordpress",
  authDetails: {
    siteUrl: String,        // WordPress site URL
    username: String,       // WordPress username
    applicationPassword: String  // Application Password
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Publish Content Request
```javascript
{
  title: String,              // Post title (required)
  content: String,            // Post content HTML (required)
  keywords: [String],         // Keywords converted to tags
  targetAudience: String,     // Added as meta field
  status: String,             // 'draft' or 'publish'
  categories: [Number],       // WordPress category IDs
  tags: [String]              // Additional custom tags
}
```

### Publish Response
```javascript
{
  success: Boolean,
  message: String,
  data: {
    postId: Number,           // WordPress post ID
    url: String,              // Published post URL
    platform: "wordpress",
    siteUrl: String,
    status: String            // Post status
  }
}
```

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Compatible With**: Snowball v1.0+, WordPress 5.6+