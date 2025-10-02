# Snowball MCP Server Setup Guide

## What is MCP?

Model Context Protocol (MCP) allows Claude Code to directly interact with your backend API and MongoDB database for better debugging and development.

## Features

This MCP server provides Claude with 3 powerful tools:

1. **test_backend_api** - Test any backend API endpoint
2. **query_mongodb** - Query MongoDB collections directly
3. **check_api_keys** - Verify API keys are configured

## Setup Instructions

### Step 1: Install MCP Server Dependencies

```bash
cd "F:\seo snow\Snowball"

# Install dependencies for MCP server
npm install --no-save @modelcontextprotocol/sdk@^0.5.0 axios@^1.6.0 mongodb@^6.3.0
```

### Step 2: Configure Claude Code MCP

You need to add the MCP configuration to Claude Code's settings:

**Windows:**
1. Open: `%APPDATA%\Claude\claude_desktop_config.json`
   - Or navigate to: `C:\Users\hp\AppData\Roaming\Claude\claude_desktop_config.json`

**Mac/Linux:**
1. Open: `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac)
2. Or: `~/.config/claude/claude_desktop_config.json` (Linux)

**Add this configuration:**

```json
{
  "mcpServers": {
    "snowball-backend": {
      "command": "node",
      "args": ["F:\\seo snow\\Snowball\\mcp-snowball-server.js"],
      "env": {
        "BACKEND_URL": "http://localhost:5000",
        "MONGO_URI": "mongodb+srv://abhishek:RLlOzwwUkzpDaBMd@cluster0.9pmn7wd.mongodb.net/snowball_fin?retryWrites=true&w=majority&appName=Cluster0"
      }
    }
  }
}
```

**Note:** Replace the `MONGO_URI` if your connection string changes.

### Step 3: Restart Claude Code

Close and reopen Claude Code for the MCP server to activate.

### Step 4: Verify MCP is Working

In Claude Code, ask:
```
"Can you test the MCP server by querying MongoDB for all brands?"
```

Claude should now be able to use the `mcp__query_mongodb` tool!

## Usage Examples

### Example 1: Query MongoDB for Brands

```
"Query MongoDB brands collection to find brand with domain 'oneshot.ai'"
```

Claude will use:
```
mcp__query_mongodb({
  collection: "brands",
  operation: "findOne",
  query: { domain: "oneshot.ai" }
})
```

### Example 2: Test Backend API

```
"Test the blog extraction endpoint for brandId 68b57c61b214ef243ee86fd5"
```

Claude will use:
```
mcp__test_backend_api({
  method: "POST",
  endpoint: "/api/v1/brand/68b57c61b214ef243ee86fd5/trigger-blog-analysis"
})
```

### Example 3: Check API Keys

```
"Check if Perplexity API key is configured"
```

Claude will use:
```
mcp__check_api_keys({
  keys: ["PERPLEXITY_API_KEY", "OPENAI_API_KEY"]
})
```

## Troubleshooting

### MCP Server Not Showing Up

1. Check `claude_desktop_config.json` path is correct
2. Verify Node.js is in your PATH: `node --version`
3. Check file paths use double backslashes on Windows: `F:\\seo snow\\...`
4. Restart Claude Code completely

### MongoDB Connection Issues

- Verify MONGO_URI is correct in the config
- Check MongoDB Atlas firewall/IP whitelist
- Test connection: `mongosh "mongodb+srv://..."`

### Backend API Errors

- Ensure backend is running on `http://localhost:5000`
- Check BACKEND_URL in config matches your server
- Verify authentication tokens if needed

## Available Tools

### 1. test_backend_api

Test any Snowball backend endpoint.

**Parameters:**
- `method`: GET, POST, PUT, DELETE, PATCH
- `endpoint`: API path (e.g., `/api/v1/brand/123/blogs`)
- `data`: Request body (optional)
- `token`: JWT token for auth (optional)

### 2. query_mongodb

Query MongoDB collections directly.

**Parameters:**
- `collection`: brands, users, onboardingprogresses, blogscores, etc.
- `operation`: find, findOne, count, aggregate
- `query`: MongoDB query filter
- `limit`: Max results (default: 10)

### 3. check_api_keys

Check if environment variables/API keys exist.

**Parameters:**
- `keys`: Array of key names to check

## Benefits

With MCP enabled, Claude can:

✅ **See actual data** - Query database to verify what's stored
✅ **Test APIs directly** - No need for Postman/curl
✅ **Debug faster** - See real responses, not just code
✅ **Verify config** - Check API keys without exposing them
✅ **Understand errors** - See exact API error responses

## Security Notes

- MCP server only runs locally
- API keys are stored in Claude Code config (encrypted)
- MongoDB connection uses existing credentials
- No data leaves your machine

## Next Steps

Once MCP is working:

1. Ask Claude to debug the blog analysis 401 error
2. Query MongoDB to see what data exists
3. Test API endpoints directly
4. Verify Perplexity API key configuration

---

**Need help?** Ask Claude: "Help me set up the Snowball MCP server"
