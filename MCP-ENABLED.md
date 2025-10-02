# ✅ MCP IS NOW ENABLED!

## What Just Happened:

I've configured Claude Code to use the Snowball MCP server!

### Files Configured:
- ✅ `C:\Users\hp\AppData\Roaming\Claude\claude_desktop_config.json` - Created
- ✅ `F:\seo snow\Snowball\mcp-snowball-server.mjs` - Ready (8.4KB)
- ✅ Dependencies installed (MCP SDK, MongoDB, Axios)

---

## 🚀 Next Step: RESTART CLAUDE CODE

**IMPORTANT:** You must completely close and reopen Claude Code for MCP to activate.

### How to Restart:
1. Close this Claude Code window completely
2. Close any other Claude Code windows
3. Reopen Claude Code
4. Open this project again

---

## 🧪 Test MCP After Restart

Once you've restarted Claude Code, test if MCP is working:

### Test 1: List Available Tools
Ask Claude:
```
"What MCP tools are available?"
```

Expected response:
```
I have access to these MCP tools:
- mcp__test_backend_api
- mcp__query_mongodb
- mcp__check_api_keys
```

### Test 2: Query MongoDB
Ask Claude:
```
"Can you query MongoDB to show me all brands? Use find with limit 5"
```

Expected: Claude queries the database and shows you actual brand data!

### Test 3: Debug Blog Analysis
Ask Claude:
```
"Why isn't blog analysis working for oneshot.ai? Query the database and test the API."
```

Expected: Claude will:
1. Query MongoDB for the brand
2. Test the blog extraction API
3. Check for the Perplexity API key
4. Tell you exactly what's wrong!

---

## 🎯 What You Can Now Do

### Database Queries:
```
"Show me all brands in MongoDB"
"Find brands with domain containing 'oneshot'"
"Count how many users exist"
"Show me blog scores for brand X"
```

### API Testing:
```
"Test POST /api/v1/brand/123/trigger-blog-analysis"
"Call the login endpoint with test credentials"
```

### Debugging:
```
"Debug why blog analysis fails"
"Check if Perplexity API key exists"
"What data exists for brand oneshot.ai?"
```

---

## 🐛 Troubleshooting

### If MCP Tools Don't Appear:

1. **Did you restart Claude Code?**
   - Must completely close and reopen, not just reload window

2. **Check config file exists:**
   ```bash
   cat "C:\Users\hp\AppData\Roaming\Claude\claude_desktop_config.json"
   ```

3. **Check Node.js version:**
   ```bash
   node --version  # Should be v20.16.0 (you have this ✅)
   ```

4. **Check MCP server file:**
   ```bash
   node "F:\seo snow\Snowball\mcp-snowball-server.mjs"
   ```
   Should print: "Snowball MCP Server running on stdio"

5. **Look for MCP errors:**
   - Check Claude Code developer tools (Help → Toggle Developer Tools)
   - Look for MCP-related errors in console

---

## 📊 Expected Behavior After Restart

When MCP is working, you'll see:
- Tool names starting with `mcp__` in Claude's responses
- Claude can query your database directly
- Claude can test API endpoints
- Much faster debugging with real data

---

## 🎉 You're All Set!

**RESTART CLAUDE CODE NOW** and come back to test MCP!

After restart, ask: *"Can you test the Snowball MCP server by querying MongoDB for all brands?"*

If it works, you'll see Claude use `mcp__query_mongodb` and show you real data! 🚀

---

## 📝 Quick Reference

- **Config File:** `%APPDATA%\Claude\claude_desktop_config.json`
- **MCP Server:** `F:\seo snow\Snowball\mcp-snowball-server.mjs`
- **Backend URL:** http://localhost:5000
- **MongoDB:** Your Atlas cluster (configured ✅)

**Questions after restart?** Just ask Claude to help debug MCP!
