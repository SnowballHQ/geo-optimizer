const jwt = require("jsonwebtoken");
const User = require("../models/User");
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const { Configuration, OpenAIApi } = require("openai");
const OpenAI = require("openai");
const { authenticationMiddleware } = require('../middleware/auth');

// Removed old Analysis model definition - now using the new Analysis model from models/Analysis.js


const login = async (req, res) => {
  console.log('🔐 Login attempt:', { body: req.body, headers: req.headers });
  
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('❌ Missing email or password:', { email: !!email, password: !!password });
    return res.status(400).json({
      msg: "Bad request. Please add email and password in the request body",
    });
  }

  console.log('🔍 Looking for user with email:', email);
  let foundUser = await User.findOne({ email: req.body.email });
  
  if (foundUser) {
    console.log('✅ User found:', foundUser.name);
    const isMatch = await foundUser.comparePassword(password);
    console.log('🔑 Password match:', isMatch);

    if (isMatch) {
      const token = jwt.sign(
        { id: foundUser._id, name: foundUser.name, role: foundUser.role || 'user' },
        process.env.JWT_SECRET,
        {
          expiresIn: "30d",
        }
      );
      console.log('🎉 Login successful, token generated');
      return res.status(200).json({ msg: "user logged in", token });
    } else {
      console.log('❌ Password mismatch');
      return res.status(400).json({ msg: "Bad password" });
    }
  } else {
    console.log('❌ User not found with email:', email);
    return res.status(400).json({ msg: "Bad credentials" });
  }
};

const dashboard = async (req, res) => {
  const luckyNumber = Math.floor(Math.random() * 100);

  res.status(200).json({
    msg: `Hello, ${req.user.name}`,

  });
};

const getAllUsers = async (req, res) => {
  let users = await User.find({});

  return res.status(200).json({ users });
};

const register = async (req, res) => {
  let foundUser = await User.findOne({ email: req.body.email });
  if (foundUser === null) {
    let { name, email, password } = req.body; // <-- use 'name'
    if (name && email && password) { // <-- check for truthy, not .length
      const person = new User({
        name,
        email,
        password,
      });
      await person.save();
      
      // Generate JWT token for automatic login
      const token = jwt.sign(
        { id: person._id, name: person.name, role: person.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
      
      return res.status(201).json({ 
        person,
        token, // Add token to response
        message: "Registration successful"
      });
    } else {
      return res.status(400).json({ msg: "Please add all values in the request body" });
    }
  } else {
    return res.status(400).json({ msg: "Email already in use" });
  }
};

const analyzeLink = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ msg: "URL is required" });

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const $ = cheerio.load(response.data);
    

    const extractedTags = {
      title: $('title').text() || '',
      description: $('meta[name="description"]').attr('content') || '',
      robots: $('meta[name="robots"]').attr('content') || '',
      canonical: $('link[rel="canonical"]').attr('href') || '',
      h1: $('h1').first().text() || '',
      h2: [],
      openGraph: {},
      twitter: {}
    };

    $('h2').each((i, el) => {
      extractedTags.h2.push($(el).text());
    });

    $('meta[property^="og:"]').each((i, el) => {
      const property = $(el).attr('property');
      const content = $(el).attr('content');
      if (property && content) {
        extractedTags.openGraph[property] = content;
      }
    });

    $('meta[name^="twitter:"]').each((i, el) => {
      const name = $(el).attr('name');
      const content = $(el).attr('content');
      if (name && content) {
        extractedTags.twitter[name] = content;
      }
    });

    return res.json({ result: extractedTags });
  } catch (err) {
    console.error('Scraping failed:', err.message);
    return res.status(500).json({ msg: "Failed to analyze link", error: err.message });
  }
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const suggestImprovements = async (req, res) => {
  const { tags, url } = req.body;
  if (!tags || !url) return res.status(400).json({ msg: "Tags and URL are required" });

  try {
    const prompt = `
      Here are the SEO tags for a web page:
      ${JSON.stringify(tags, null, 2)}
      Suggest improvements for these tags to enhance SEO. Be specific and concise.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    const suggestion = completion.choices[0].message.content;

    // Save analysis with user reference
    const analysis = new Analysis({ user: req.user.id, url, tags, suggestion });
    await analysis.save();

    res.json({ suggestion });
  } catch (err) {
    console.error("OpenAI error:", err.message);
    res.status(500).json({ msg: "Failed to get suggestions", error: err.message });
  }
};

const getAnalysisHistory = async (req, res) => {
  try {
    const history = await Analysis.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ history });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch history", error: err.message });
  }
};


const deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    await Analysis.findByIdAndDelete(id);
    res.json({ msg: "Analysis deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete analysis", error: err.message });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        msg: "Google ID token is required"
      });
    }

    // Verify the Google ID token
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError);
      return res.status(401).json({
        success: false,
        msg: "Invalid Google token"
      });
    }

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        msg: "Email not provided by Google"
      });
    }

    console.log('🔍 Google Auth - Looking for user with email:', email);

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      console.log('✅ Google Auth - Existing user found:', user.name);
      
      // Update Google ID and profile picture if not set
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.profilePicture && picture) {
        user.profilePicture = picture;
      }
      await user.save();
    } else {
      console.log('👤 Google Auth - Creating new user:', name);
      
      // Create new user
      user = new User({
        name,
        email,
        googleId,
        profilePicture: picture,
        // Generate a random password for Google users
        password: Math.random().toString(36).substring(2, 15),
        provider: 'google'
      });
      
      await user.save();
      console.log('✅ Google Auth - New user created:', user.name);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
    );

    console.log('✅ Google Auth - Login successful for user:', user.name);

    res.json({
      success: true,
      msg: "Google authentication successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role || 'user'
      }
    });

  } catch (error) {
    console.error('❌ Google Auth error:', error);
    res.status(500).json({
      success: false,
      msg: "Google authentication failed",
      error: error.message
    });
  }
};

module.exports = {
  login,
  register,
  dashboard,
  getAllUsers,
  analyzeLink,
  suggestImprovements,
  getAnalysisHistory,
  deleteAnalysis,
  googleAuth,
};
