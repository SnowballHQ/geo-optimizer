# 🚀 MCP Quick Start - Snowball Project

## ✅ What's Been Set Up

I've created a custom MCP (Model Context Protocol) server for your Snowball project that gives Claude Code superpowers! 🎉

### 📁 Files Created:

1. **`mcp-snowball-server.mjs`** - The MCP server code
2. **`claude-mcp-config.json`** - Configuration for Claude Code
3. **`MCP-SETUP.md`** - Detailed setup instructions
4. **`test-mcp-server.mjs`** - Test script (optional)

### 🎯 What Claude Can Do With MCP:

#### 1. **Query Your MongoDB Database**
```
Claude: "Show me all brands in MongoDB"
Claude: "Find the brand with domain 'oneshot.ai' and show me its blog data"
Claude: "Count how many blog scores exist in the database"
```

#### 2. **Test Backend API Endpoints**
```
Claude: "Test the blog extraction endpoint for brand 123"
Claude: "Call POST /api/v1/brand/123/trigger-blog-analysis"
```

#### 3. **Check API Keys**
```
Claude: "Is the Perplexity API key configured?"
Claude: "Check all API keys"
```

---

## 🔧 How to Enable MCP

### Quick Setup (2 minutes):

**Step 1:** Find your Claude Code config file

- **Windows:** `C:\Users\hp\AppData\Roaming\Claude\claude_desktop_config.json`
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Step 2:** Copy the contents of `claude-mcp-config.json` into that file

**Step 3:** Restart Claude Code

**Step 4:** Test by asking: "Can you query MongoDB to show me all brands?"

---

## 💡 Real-World Example

### Before MCP:
**You:** "Why isn't blog analysis working?"
**Claude:** "Let me read the code... it looks like it's calling the API... check the backend logs..."
**You:** *(checks logs manually)* "It's a 401 error from Perplexity"

### With MCP:
**You:** "Why isn't blog analysis working?"
**Claude:**
```
Let me check...
1. [Uses mcp__query_mongodb] - Found brand 'oneshot.ai' with 0 blogs
2. [Uses mcp__test_backend_api] - Backend returns 401 error
3. [Uses mcp__check_api_keys] - Perplexity API key is missing!

The issue is: PERPLEXITY_API_KEY is not configured in your .env file.
```

**INSTANT DIAGNOSIS** 🎯

---

## 🎓 Example Queries You Can Ask

Once MCP is enabled, try these:

### Database Queries:
- "Show me all brands in the database"
- "Find brands that have blogs"
- "Count total users"
- "Show me the onboarding progress for user X"
- "List all blog scores with GEO score > 7"

### API Testing:
- "Test the login endpoint"
- "Call the blog extraction API for brand oneshot.ai"
- "Test if the Perplexity API is working"

### Debugging:
- "Why is blog analysis not finding blogs?"
- "Check if the Perplexity API key exists"
- "What does the database show for this brand?"

---

## 🔥 Why This Is Game-Changing

| Without MCP | With MCP |
|-------------|----------|
| Claude reads code files | Claude queries real data |
| "Check the logs" | Claude checks database instantly |
| Guess what's wrong | See actual API responses |
| Manual debugging | Automated diagnosis |
| 10+ messages | 1-2 messages |

---

## 🛠️ Tools Available

### `mcp__test_backend_api`
Test any Snowball API endpoint with proper auth

### `mcp__query_mongodb`
Query collections: brands, users, blogscores, onboardingprogresses, etc.

### `mcp__check_api_keys`
Verify environment variables without exposing them

---

## 📝 Configuration Details

The MCP server connects to:
- **Backend:** `http://localhost:5000`
- **MongoDB:** Your existing Atlas connection
- **API Keys:** Read from environment (never exposed)

---

## ⚡ Next Steps

1. **Enable MCP** (see Quick Setup above)
2. **Restart Claude Code**
3. **Ask Claude:** "Can you test the MCP server?"
4. **Start debugging faster!**

---

## 🐛 Troubleshooting

**Q: MCP tools not showing up?**
A: Make sure you restarted Claude Code completely and the config file path is correct.

**Q: MongoDB connection failing?**
A: Check your internet connection and MongoDB Atlas IP whitelist.

**Q: Backend API errors?**
A: Ensure your backend is running on port 5000.

---

## 🎉 Benefits Summary

✅ **10x faster debugging** - See real data instantly
✅ **No more guessing** - Query actual database state
✅ **Test APIs directly** - No Postman needed
✅ **Verify config** - Check API keys safely
✅ **Better answers** - Claude sees real data, not just code

---

**Ready to try?** Enable MCP and ask Claude: *"Debug why blog analysis isn't working for oneshot.ai"*

Watch Claude query the database, test the API, and give you the exact answer! 🚀
