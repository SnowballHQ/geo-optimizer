import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import RichTextEditor from '../components/RichTextEditor';
import InlineRichTextEditor from '../components/InlineRichTextEditor';

import { apiService } from '../utils/api';
import { getUserName } from '../utils/auth';
import { CalendarIcon, Edit, CheckCircle, Clock, Send, Plus, Image, FileText, Calendar, Grid, List, ChevronLeft, ChevronRight, Upload, X, Eye, RefreshCw, ArrowLeft } from 'lucide-react';

const ContentCalendarView = ({ inline = false, onClose, shouldAutoLoad = false }) => {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentPlan, setContentPlan] = useState(null);
  const [cmsPlatform, setCmsPlatform] = useState('');
  const [showCmsSetup, setShowCmsSetup] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [cmsCredentials, setCmsCredentials] = useState({});
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  
  // New state variables for enhanced features
  const [currentView, setCurrentView] = useState('week'); // week, month, list
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [showContentViewer, setShowContentViewer] = useState(false);
  const [viewingContent, setViewingContent] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [existingCalendarFound, setExistingCalendarFound] = useState(false);
  const [existingCalendarCount, setExistingCalendarCount] = useState(0);
  const [showRichTextEditor, setShowRichTextEditor] = useState(false);
  const [richTextContent, setRichTextContent] = useState('');
  const [userBrandProfile, setUserBrandProfile] = useState(null);
  const [brandCategories, setBrandCategories] = useState([]);
  const [isAutoCreatingCalendar, setIsAutoCreatingCalendar] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  // Inline editor states
  const [activeEditorTool, setActiveEditorTool] = useState(null); // 'content-editor' or null
  const [selectedContent, setSelectedContent] = useState(null);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  
  const [editorFormData, setEditorFormData] = useState({
    title: '',
    description: '',
    keywords: '',
    targetAudience: '',
    content: '',
    outline: '',
    status: 'draft'
  });
  const [showContentRichTextEditor, setShowContentRichTextEditor] = useState(false);
  const [contentRichText, setContentRichText] = useState('');
  const [contentTemplates] = useState([
    {
      id: 'blog-post',
      name: 'Blog Post',
      icon: '📝',
      structure: {
        title: 'Blog Post Title',
        description: 'Engaging blog post description...',
        keywords: ['keyword1', 'keyword2', 'keyword3'],
        targetAudience: 'General audience',
        contentStructure: 'Introduction → Main Points → Conclusion'
      }
    },
    {
      id: 'social-media',
      name: 'Social Media Post',
      icon: '📱',
      structure: {
        title: 'Social Media Update',
        description: 'Engaging social media content...',
        keywords: ['social', 'engagement', 'viral'],
        targetAudience: 'Social media followers',
        contentStructure: 'Hook → Value → Call to Action'
      }
    },
    {
      id: 'newsletter',
      name: 'Newsletter',
      icon: '📧',
      structure: {
        title: 'Weekly Newsletter',
        description: 'Company updates and insights...',
        keywords: ['newsletter', 'updates', 'insights'],
        targetAudience: 'Email subscribers',
        contentStructure: 'Header → Updates → Insights → Call to Action'
      }
    },
    {
      id: 'case-study',
      name: 'Case Study',
      icon: '📊',
      structure: {
        title: 'Customer Success Story',
        description: 'Detailed case study content...',
        keywords: ['case study', 'success', 'results'],
        targetAudience: 'Prospects and customers',
        contentStructure: 'Challenge → Solution → Results → Testimonial'
      }
    }
  ]);

  const handleGenerateCalendar = async () => {
    if (!companyName.trim()) return;
    
    // Store company name in localStorage for future use
    localStorage.setItem('companyName', companyName.trim());
    
    setIsGenerating(true);
    try {
      // First, check if a calendar already exists for this company
      const existingCalendar = await apiService.getContentCalendar({ companyName });
      
      if (existingCalendar.data.data && existingCalendar.data.data.length > 0) {
        // Calendar exists - ask user if they want to load existing or generate new
        const userChoice = window.confirm(
          `A content calendar for "${companyName}" already exists with ${existingCalendar.data.data.length} entries.\n\n` +
          `Click "OK" to load the existing calendar (saves API tokens)\n` +
          `Click "Cancel" to generate a new one (uses OpenAI API)`
        );
        
        if (userChoice) {
          // Load existing calendar
          setContentPlan(existingCalendar.data.data);
          alert('Existing calendar loaded successfully! No API tokens used.');
          return;
        }
      }
      
             // Generate new calendar if no existing one or user chose to generate new
      const response = await apiService.generateContentCalendar({ companyName });
       const newContentPlan = response.data.data;
       setContentPlan(newContentPlan);
       
               // Save the generated content to database immediately
        try {
          // Ensure keywords are properly formatted as arrays before saving
          const formattedContentPlan = newContentPlan.map(item => ({
            ...item,
            status: 'draft',
            keywords: Array.isArray(item.keywords) ? item.keywords : 
                     (typeof item.keywords === 'string' ? item.keywords.split(',').map(k => k.trim()) : [])
          }));
          
          await apiService.approveContentCalendar({ 
            companyName,
            contentPlan: formattedContentPlan
          });
          alert('New content calendar generated and saved to database successfully!');
        } catch (saveError) {
          console.error('Error saving generated content:', saveError);
          alert('Content generated but failed to save to database. Please approve manually.');
        }
    } catch (error) {
      console.error('Error generating content calendar:', error);
      alert('Failed to generate content calendar. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch user's brand profile and categories for enhanced content generation
  const fetchUserBrandData = async () => {
    try {
      // Fetch user brands
      const brandsResponse = await apiService.getUserBrands();
      if (brandsResponse.data.brands && brandsResponse.data.brands.length > 0) {
        const firstBrand = brandsResponse.data.brands[0];
        setUserBrandProfile(firstBrand);
        
        // Fetch brand categories
        try {
          const categoriesResponse = await apiService.getUserCategories();
          if (categoriesResponse.data.categories) {
            setBrandCategories(categoriesResponse.data.categories);
          }
        } catch (categoriesError) {
          console.log('No categories found for user:', categoriesError.message);
          setBrandCategories([]);
        }
        
        return firstBrand;
      }
    } catch (error) {
      console.error('Error fetching user brand data:', error);
    }
    return null;
  };

  // Load existing content calendar for users
  const loadExistingCalendar = async (companyName) => {
    try {
      const response = await apiService.getContentCalendar({ companyName });
      
      if (response.data.data && response.data.data.length > 0) {
        const existingEntries = response.data.data;
        setContentPlan(existingEntries);
        setExistingCalendarFound(true);
        setExistingCalendarCount(existingEntries.length);
        
        // Log status breakdown
        const statusCounts = existingEntries.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});
        
        console.log(`📅 Loaded existing calendar: ${existingEntries.length} entries`, statusCounts);
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('No existing calendar found:', error.message);
      return false;
    }
  };

  // Automatically load or create content calendar for users
  const handleAutoCreateCalendar = async () => {
    if (isAutoCreatingCalendar || hasAttemptedLoad) return;
    
    setIsAutoCreatingCalendar(true);
    setHasAttemptedLoad(true);
    
    try {
      // Fetch user's brand data
      const brandProfile = await fetchUserBrandData();
      
      if (!brandProfile) {
        console.log('No brand profile found for user');
        setIsAutoCreatingCalendar(false);
        return;
      }
      
      // Use brand name as company name
      const brandCompanyName = brandProfile.name || brandProfile.domain;
      setCompanyName(brandCompanyName);
      
      // First, always try to load existing calendar
      const existingLoaded = await loadExistingCalendar(brandCompanyName);
      
      if (existingLoaded) {
        console.log('✅ Existing calendar loaded, no need to create new one');
        setIsAutoCreatingCalendar(false);
        return;
      }
      
      // Only create new calendar if none exists
      console.log('🆕 No existing calendar found, creating new one...');
      
      // Generate new calendar with enhanced brand context
      console.log('🔍 DEBUG: About to generate calendar with brand data:');
      console.log('   Company Name:', brandCompanyName);
      console.log('   Brand Profile:', userBrandProfile);
      console.log('   Brand Profile Domain:', userBrandProfile?.domain);
      console.log('   Brand Categories:', brandCategories);
      
      const response = await apiService.generateContentCalendar({ 
        companyName: brandCompanyName,
        brandProfile: userBrandProfile,
        brandCategories: brandCategories
      });
      
      const newContentPlan = response.data.data;
      setContentPlan(newContentPlan);
      
      // Save to database
      const formattedContentPlan = newContentPlan.map(item => ({
        ...item,
        status: 'draft',
        keywords: Array.isArray(item.keywords) ? item.keywords : 
                 (typeof item.keywords === 'string' ? item.keywords.split(',').map(k => k.trim()) : [])
      }));
      
      await apiService.approveContentCalendar({ 
        companyName: brandCompanyName,
        contentPlan: formattedContentPlan
      });
      
      console.log('✅ New calendar created and saved successfully');
    } catch (error) {
      console.error('❌ Error in auto-create calendar:', error);
    } finally {
      setIsAutoCreatingCalendar(false);
    }
  };

  // Manual refresh function for reloading calendar data
  const handleRefreshCalendar = async () => {
    if (!companyName) return;
    
    try {
      console.log('🔄 Refreshing calendar data...');
      const refreshed = await loadExistingCalendar(companyName);
      
      if (refreshed) {
        alert('Calendar refreshed successfully!');
      } else {
        alert('No calendar data found to refresh.');
      }
    } catch (error) {
      console.error('Error refreshing calendar:', error);
      alert('Failed to refresh calendar. Please try again.');
    }
  };

  // Inline editor functions
  const handleGenerateInlineOutline = async () => {
    if (!selectedContent || !editorFormData.title.trim()) {
      alert('Please enter a title first!');
      return;
    }

    try {
      setIsGeneratingOutline(true);
      
      const outlineData = {
        title: editorFormData.title,
        description: editorFormData.description,
        keywords: editorFormData.keywords,
        targetAudience: editorFormData.targetAudience
      };

      console.log('Generating inline outline:', outlineData);
      const response = await apiService.generateContentOutline(selectedContent._id, outlineData);
      
      if (response.data && response.data.success && response.data.data && response.data.data.outline) {
        setEditorFormData(prev => ({
          ...prev,
          outline: response.data.data.outline
        }));
        
        // Update the content plan to reflect the new outline
        setContentPlan(prevPlan => 
          prevPlan.map(item => 
            item._id === selectedContent._id 
              ? { ...item, outline: response.data.data.outline }
              : item
          )
        );
        
        const brandContextInfo = response.data.brandContext === 'Applied' 
          ? ' with your brand voice and style applied! 🎯'
          : ' (brand settings not found - using default style)';
        
        alert(`Content outline generated successfully${brandContextInfo}`);
      } else {
        alert('Failed to generate outline. Please try again.');
      }
    } catch (error) {
      console.error('Error generating outline:', error);
      alert(`Error generating outline: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleGenerateInlineBlog = async () => {
    if (!selectedContent || !editorFormData.outline) {
      alert('Please generate an outline first!');
      return;
    }

    if (!editorFormData.title.trim()) {
      alert('Please enter a title first!');
      return;
    }

    try {
      setIsGeneratingBlog(true);
      
      const blogData = {
        title: editorFormData.title,
        description: editorFormData.description,
        keywords: editorFormData.keywords,
        targetAudience: editorFormData.targetAudience,
        outline: editorFormData.outline
      };

      console.log('Generating inline blog:', blogData);
      const response = await apiService.createBlogFromOutline(selectedContent._id, blogData);
      
      if (response.data && response.data.success && response.data.data && response.data.data.blogContent) {
        const generatedContent = response.data.data.blogContent;
        
        setEditorFormData(prev => ({
          ...prev,
          content: generatedContent
        }));
        
        // Populate rich text editor with generated content
        setContentRichText(generatedContent);
        
        // Update the content plan to reflect the new blog content
        setContentPlan(prevPlan => 
          prevPlan.map(item => 
            item._id === selectedContent._id 
              ? { ...item, content: generatedContent }
              : item
          )
        );
        
        const brandContextInfo = response.data.brandContext === 'Applied' 
          ? ' with your brand voice and style applied! 🎯'
          : ' (brand settings not found - using default style)';
        
        alert(`Blog content generated successfully${brandContextInfo}`);
      } else {
        alert('Failed to generate blog content. Please try again.');
      }
    } catch (error) {
      console.error('Error generating blog:', error);
      alert(`Error generating blog: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  const handleSaveInlineContent = async () => {
    if (!selectedContent) return;

    try {
      const updateData = {
        title: editorFormData.title,
        description: editorFormData.description,
        keywords: editorFormData.keywords.split(',').map(k => k.trim()),
        targetAudience: editorFormData.targetAudience,
        content: editorFormData.content,
        outline: editorFormData.outline,
        status: editorFormData.status
      };

      await apiService.updateContentCalendarEntry(selectedContent._id, updateData);
      
      // Update the content plan with new data
      setContentPlan(prevPlan => 
        prevPlan.map(item => 
          item._id === selectedContent._id 
            ? { ...item, ...updateData }
            : item
        )
      );
      
      alert('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content. Please try again.');
    }
  };

  const handleCloseInlineEditor = () => {
    setActiveEditorTool(null);
    setSelectedContent(null);
    setEditorFormData({
      title: '',
      description: '',
      keywords: '',
      targetAudience: '',
      content: '',
      outline: '',
      status: 'draft'
    });
    setContentRichText('');
  };

  // Rich text editor handlers for content editor (legacy modal - now using inline editor)
  const handleContentRichTextSave = (content) => {
    setContentRichText(content);
    setEditorFormData(prev => ({
      ...prev,
      content: content
    }));
    setShowContentRichTextEditor(false);
  };

  const handleContentRichTextCancel = () => {
    setShowContentRichTextEditor(false);
  };

  const openContentRichTextEditor = () => {
    setShowContentRichTextEditor(true);
  };

  const handleLoadExistingCalendar = async () => {
    if (!companyName.trim()) return;
    
    // Store company name in localStorage for future use
    localStorage.setItem('companyName', companyName.trim());
    
    try {
      const response = await apiService.getContentCalendar({ companyName });
      if (response.data.data && response.data.data.length > 0) {
        setContentPlan(response.data.data);
        alert(`Existing calendar loaded successfully! Found ${response.data.data.length} entries.`);
      } else {
        alert(`No existing calendar found for "${companyName}". Please generate a new one.`);
      }
    } catch (error) {
      console.error('Error loading existing calendar:', error);
      alert('Failed to load existing calendar. Please try again.');
    }
  };

  const handleApproveCalendar = async () => {
    if (!contentPlan) return;
    
    setIsApproving(true);
    try {
      // Ensure keywords are properly formatted as arrays before saving
      const formattedContentPlan = contentPlan.map(item => ({
        ...item,
        status: 'approved',
        keywords: Array.isArray(item.keywords) ? item.keywords : 
                 (typeof item.keywords === 'string' ? item.keywords.split(',').map(k => k.trim()) : [])
      }));
      
      await apiService.approveContentCalendar({ 
        companyName,
        contentPlan: formattedContentPlan
      });
      alert('Content calendar approved and scheduled for auto-publishing!');
      setContentPlan(prev => prev.map(item => ({ ...item, status: 'approved' })));
    } catch (error) {
      console.error('Error approving calendar:', error);
      alert('Failed to approve calendar. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleEditContent = (content) => {
    // Ensure content has proper structure for editing
    const contentForEditing = {
      ...content,
      keywords: Array.isArray(content.keywords) ? content.keywords : (content.keywords ? [content.keywords] : []),
      targetAudience: content.targetAudience || '',
      contentStructure: content.contentStructure || ''
    };
    setEditingContent(contentForEditing);
    setShowContentEditor(true);
  };

  const handleViewContent = (content) => {
    // Show content in view-only mode
    setViewingContent(content);
    setShowContentViewer(true);
  };

  const handleCardClick = (content) => {
    // Open inline content editor within dashboard layout
    setSelectedContent(content);
    setEditorFormData({
      title: content.title || '',
      description: content.description || '',
      keywords: Array.isArray(content.keywords) ? content.keywords.join(', ') : content.keywords || '',
      targetAudience: content.targetAudience || '',
      content: content.content || '',
      outline: content.outline || '',
      status: content.status || 'draft'
    });
    setContentRichText(content.content || '');
    setActiveEditorTool('content-editor');
  };

  const handleTemplateSelect = (template) => {
    // Set the selected template
    setSelectedTemplate(template);
    
    // If we have content being edited, apply the template structure
    if (editingContent) {
      const updatedContent = {
        ...editingContent,
        title: template.structure.title,
        description: template.structure.description,
        keywords: template.structure.keywords,
        targetAudience: template.structure.targetAudience
      };
      setEditingContent(updatedContent);
    }
    
    // Close the templates modal
    setShowTemplates(false);
    
    // Show success message
    alert(`Template "${template.name}" selected! The content structure has been updated.`);
  };

  const applyTemplateToNewContent = (template) => {
    // Create new content with template structure
    const newContent = {
      date: new Date().toISOString().split('T')[0],
      title: template.structure.title,
      description: template.structure.description,
      keywords: template.structure.keywords,
      targetAudience: template.structure.targetAudience,
      status: 'draft'
    };
    
    setEditingContent(newContent);
    setSelectedTemplate(template);
    setShowContentEditor(true);
    setShowTemplates(false);
    
    alert(`Template "${template.name}" applied! You can now edit the content.`);
  };

  const handleSaveContent = async () => {
    if (!editingContent) return;
    
    try {
      // Update the content in the plan
      setContentPlan(prev => prev.map(item => 
        item.date === editingContent.date ? editingContent : item
      ));
      
             // Ensure keywords are properly formatted as arrays before saving
       const formattedEditingContent = {
         ...editingContent,
         keywords: Array.isArray(editingContent.keywords) ? editingContent.keywords : 
                  (typeof editingContent.keywords === 'string' ? editingContent.keywords.split(',').map(k => k.trim()) : [])
       };
       
       // Save the updated content to database
       if (editingContent._id) {
         // If content has an ID, update existing entry
         await apiService.updateCalendarEntry(editingContent._id, formattedEditingContent);
         alert('Content updated and saved to database successfully!');
       } else {
         // If no ID, save as new entry
         await apiService.approveContentCalendar({ 
           companyName,
           contentPlan: [formattedEditingContent]
         });
         alert('Content saved to database successfully!');
       }
      
      setShowContentEditor(false);
      setShowRichTextEditor(false);
      setEditingContent(null);
      
      // Refresh the existing calendar count
      await checkExistingCalendar();
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content to database. Please try again.');
    }
  };

  const handleRichTextSave = (htmlContent) => {
    setRichTextContent(htmlContent);
    setEditingContent({ ...editingContent, description: htmlContent });
    setShowRichTextEditor(false);
  };

  const handleRichTextCancel = () => {
    setShowRichTextEditor(false);
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'published': return <Send className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Handle body scroll when modal is open
  useEffect(() => {
    if (showCmsSetup || showContentEditor || showContentViewer || showTemplates || showMediaUpload || showRichTextEditor || showContentRichTextEditor) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCmsSetup, showContentEditor, showContentViewer, showTemplates, showMediaUpload, showRichTextEditor, showContentRichTextEditor]);

  // Auto-load existing content calendar when component is rendered inline
  useEffect(() => {
    if (inline && !contentPlan && shouldAutoLoad) {
      // Try to get company name from localStorage or user info
      const storedCompanyName = localStorage.getItem('companyName') || getUserName()?.companyName;
      if (storedCompanyName) {
        setCompanyName(storedCompanyName);
        // Load existing calendar automatically
        const loadCalendar = async () => {
          try {
            const response = await apiService.getContentCalendar({ companyName: storedCompanyName });
            if (response.data.data && response.data.data.length > 0) {
              setContentPlan(response.data.data);
              setExistingCalendarFound(true);
              setExistingCalendarCount(response.data.data.length);
            }
          } catch (error) {
            console.error('Error auto-loading existing calendar:', error);
          }
        };
        loadCalendar();
      }
    }
  }, [inline, shouldAutoLoad]);


  // Check for existing calendars when company name changes
  useEffect(() => {
    if (companyName.trim()) {
      checkExistingCalendar();
    } else {
      // Clear existing calendar state when company name is empty
      setExistingCalendarFound(false);
      setExistingCalendarCount(0);
      setContentPlan(null);
    }
  }, [companyName]);

  // Auto-load calendar for normal users with brand profiles
  useEffect(() => {
    const initializeCalendarForUser = async () => {
      // Only initialize if:
      // 1. Component is rendered inline (from dashboard)
      // 2. No content plan exists yet
      // 3. Not already processing
      // 4. Haven't attempted load yet
      if (inline && !contentPlan && !isAutoCreatingCalendar && !isGenerating && !hasAttemptedLoad) {
        console.log('🔄 Initializing content calendar for user...');
        // Small delay to ensure UI is ready
        setTimeout(() => {
          handleAutoCreateCalendar();
        }, 500);
      }
    };

    // Only run once when component mounts inline
    initializeCalendarForUser();
  }, [inline, contentPlan, hasAttemptedLoad]); // Track hasAttemptedLoad to prevent re-runs

  const checkExistingCalendar = async () => {
    try {
      const response = await apiService.getContentCalendar({ companyName });
      if (response.data.data && response.data.data.length > 0) {
        // Show info about existing calendar
        console.log(`Found existing calendar with ${response.data.data.length} entries for ${companyName}`);
        setExistingCalendarFound(true);
        setExistingCalendarCount(response.data.data.length);
      } else {
        setExistingCalendarFound(false);
        setExistingCalendarCount(0);
      }
    } catch (error) {
      // Silently handle errors - this is just a check
      console.log('No existing calendar found or error occurred');
      setExistingCalendarFound(false);
      setExistingCalendarCount(0);
    }
  };

  const handleUpdatePlatformToShopify = async () => {
    if (!contentPlan || contentPlan.length === 0) {
      alert('No content to update. Please generate content first.');
      return;
    }

    if (!companyName.trim()) {
      alert('Please enter a company name first.');
      return;
    }

    try {
      // Use the new backend route to fix all content at once
      const response = await apiService.fixContentPlatform({
        companyName: companyName.trim()
      });

      if (response.data.success) {
        // Update local state to reflect the change
        const updatedContent = contentPlan.map(item => ({
          ...item,
          cmsPlatform: 'shopify'
        }));
        
        setContentPlan(updatedContent);
        alert(`Successfully updated ${response.data.modifiedCount} content items to use Shopify platform! You can now publish to Shopify.`);
      } else {
        alert('Failed to update platform. Please try again.');
      }
      
    } catch (error) {
      console.error('Error updating platform:', error);
      alert('Failed to update platform. Please try again.');
    }
  };

  const handlePublishSingleContent = async (content) => {
    if (content.status !== 'approved') {
      alert('Only approved content can be published.');
      return;
    }

    try {
      // Call the auto-publisher to publish this specific content immediately
      const response = await apiService.triggerAutoPublish({
        contentId: content._id,
        companyName: companyName
      });

      if (response.data.success) {
        // Update local state to show as published
        setContentPlan(prev => prev.map(item => 
          item._id === content._id ? { ...item, status: 'published' } : item
        ));
        alert(`"${content.title}" published successfully to your Shopify store!`);
      } else {
        alert(`Failed to publish "${content.title}": ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error publishing content:', error);
      alert(`Failed to publish "${content.title}". Please try again.`);
    }
  };

  const handlePublishNow = async () => {
    if (!contentPlan || !contentPlan.some(item => item.status === 'approved')) {
      alert('No approved content to publish. Please approve content first.');
      return;
    }

    try {
      // Get approved content items
      const approvedContent = contentPlan.filter(item => item.status === 'approved');
      
      if (approvedContent.length === 0) {
        alert('No approved content found. Please approve content first.');
        return;
      }

      // Publish each approved item
      let publishedCount = 0;
      let failedCount = 0;

      for (const content of approvedContent) {
        try {
          // Call the auto-publisher to publish this content immediately
          const response = await apiService.triggerAutoPublish({
            contentId: content._id,
            companyName: companyName
          });

          if (response.data.success) {
            publishedCount++;
            // Update local state to show as published
            setContentPlan(prev => prev.map(item => 
              item._id === content._id ? { ...item, status: 'published' } : item
            ));
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error(`Failed to publish content: ${content.title}`, error);
          failedCount++;
        }
      }

      // Show results
      if (publishedCount > 0) {
        alert(`Successfully published ${publishedCount} content items!${failedCount > 0 ? ` Failed to publish ${failedCount} items.` : ''}`);
      } else {
        alert('Failed to publish any content. Please check your CMS credentials and try again.');
      }

    } catch (error) {
      console.error('Error publishing content:', error);
      alert('Failed to publish content. Please try again.');
    }
  };

  const handleSaveCMSCredentials = async () => {
    if (!cmsPlatform) return;
    
    setIsSavingCredentials(true);
    try {
      // Prepare credentials object based on platform
      const authDetails = {};
      
      switch (cmsPlatform) {
        case 'wordpress':
          authDetails.siteUrl = cmsCredentials.siteUrl;
          authDetails.username = cmsCredentials.username;
          authDetails.applicationPassword = cmsCredentials.applicationPassword;
          break;
        case 'webflow':
          authDetails.apiKey = cmsCredentials.apiKey;
          authDetails.siteId = cmsCredentials.siteId;
          break;
        case 'shopify':
          authDetails.shopDomain = cmsCredentials.shopDomain;
          authDetails.accessToken = cmsCredentials.accessToken;
          break;
        case 'wix':
          authDetails.siteId = cmsCredentials.siteId;
          authDetails.apiKey = cmsCredentials.apiKey;
          authDetails.accessToken = cmsCredentials.accessToken;
          break;
      }

      // Save credentials
      await apiService.saveCMSCredentials({
        platform: cmsPlatform,
        authDetails
      });

      alert('CMS credentials saved successfully! Connection tested and verified.');
      setShowCmsSetup(false);
      setCmsCredentials({});
    } catch (error) {
      console.error('Error saving CMS credentials:', error);
      
      // Show more specific error message
      let errorMessage = 'Failed to save CMS credentials. Please check your input and try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        if (error.response.data.details) {
          errorMessage += `\n\nDetails: ${error.response.data.details}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSavingCredentials(false);
    }
  };



  if (!contentPlan) {
    // Show loading state when auto-creating calendar for normal users
    if (isAutoCreatingCalendar) {
      return (
        <div className="max-w-2xl mx-auto">
          <Card className="border border-[#ffffff] bg-white">
            <CardHeader>
              <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
                <CalendarIcon className="w-6 h-6 text-[#7c77ff]" />
                <span>Content Calendar</span>
              </CardTitle>
              <CardDescription className="text-[#4a4a6a]">
                Setting up your personalized content calendar...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#7765e3] mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-[#4a4a6a]">Creating Your Content Calendar...</p>
                  <p className="text-sm text-[#6b7280] mt-2">Using your brand profile to generate personalized content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border border-[#ffffff] bg-white">
          <CardHeader>
            <CardTitle className="text-[#4a4a6a] flex items-center space-x-2">
              <CalendarIcon className="w-6 h-6 text-[#7c77ff]" />
              <span>Content Calendar Generator</span>
            </CardTitle>
            <CardDescription className="text-[#4a4a6a]">
              Generate a 30-day AI-powered content plan for your company
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                Company Name
              </label>
              <Input
                type="text"
                placeholder="Enter your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="border-[#b0b0d8] focus:border-[#6658f4]"
              />
            </div>
                          {existingCalendarFound && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <div className="text-sm text-blue-800">
                      <strong>Existing calendar found!</strong> {existingCalendarCount} content entries already exist for "{companyName}".
                      <br />
                      <span className="text-blue-600">Use "Load Existing Calendar" to save API tokens, or "Generate Calendar" for fresh content.</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
            <Button 
              onClick={handleGenerateCalendar}
              disabled={!companyName.trim() || isGenerating}
              className="w-full gradient-primary"
            >
              {isGenerating ? 'Generating...' : 'Generate Calendar'}
            </Button>
                
                <Button 
                  onClick={handleLoadExistingCalendar}
                  disabled={!companyName.trim()}
                  variant="outline"
                  className="w-full border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
                >
                  Load Existing Calendar
                </Button>
              </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render inline content editor if active
  if (activeEditorTool === 'content-editor') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#4a4a6a]">Content Editor</h2>
            <p className="text-[#4a4a6a]">Edit and generate content for your calendar</p>
          </div>
          <Button variant="outline" onClick={handleCloseInlineEditor} className="inline-flex items-center border-[#b0b0d8] text-[#4a4a6a] hover:bg-white hover:border-[#6658f4]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Calendar
          </Button>
        </div>
        
        <div className="space-y-8">
          {/* Content Details Section - Row Layout */}
          <Card className="border border-[#b0b0d8] bg-white">
            <CardHeader>
              <CardTitle className="text-[#4a4a6a]">Content Details</CardTitle>
              <CardDescription>Edit the basic information for this content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                    Title
                  </label>
                  <Input
                    type="text"
                    value={editorFormData.title}
                    onChange={(e) => setEditorFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="border-[#b0b0d8] focus:border-[#6658f4]"
                    placeholder="Enter blog title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                    Keywords
                  </label>
                  <Input
                    type="text"
                    value={editorFormData.keywords}
                    onChange={(e) => setEditorFormData(prev => ({ ...prev, keywords: e.target.value }))}
                    className="border-[#b0b0d8] focus:border-[#6658f4]"
                    placeholder="keyword1, keyword2, keyword3..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                    Target Audience
                  </label>
                  <Input
                    type="text"
                    value={editorFormData.targetAudience}
                    onChange={(e) => setEditorFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="border-[#b0b0d8] focus:border-[#6658f4]"
                    placeholder="Who is this content for?"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                  Description
                </label>
                <Textarea
                  value={editorFormData.description}
                  onChange={(e) => setEditorFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="border-[#b0b0d8] focus:border-[#6658f4] min-h-[100px]"
                  placeholder="Brief description of the content..."
                />
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                    Status
                  </label>
                  <select
                    value={editorFormData.status}
                    onChange={(e) => setEditorFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#b0b0d8] rounded-md focus:border-[#6658f4] focus:outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outline Generation Section */}
          <Card className="border border-[#b0b0d8] bg-white">
            <CardHeader>
              <CardTitle className="text-[#4a4a6a] flex items-center justify-between">
                Content Outline Editor
                <Button
                  onClick={handleGenerateInlineOutline}
                  disabled={isGeneratingOutline || !editorFormData.title.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
                >
                  {isGeneratingOutline ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : editorFormData.outline ? '🔄 Regenerate Outline' : '✨ Generate Outline'}
                </Button>
              </CardTitle>
              <CardDescription>AI-generated content structure and outline - directly editable</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                    Content Outline
                  </label>
                  <Textarea
                    value={editorFormData.outline || ''}
                    onChange={(e) => setEditorFormData(prev => ({ ...prev, outline: e.target.value }))}
                    className="border-[#b0b0d8] focus:border-[#6658f4] min-h-[200px] font-mono text-sm"
                    placeholder="Click 'Generate Outline' to create an AI-powered content structure, or type your own outline here..."
                  />
                </div>
                {!editorFormData.outline && (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                    <p className="text-sm">No outline generated yet.</p>
                    <p className="text-xs mt-1">Fill in the content details above, then click "Generate Outline" to create the content structure.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Blog Content Editor Section */}
          <Card className="border border-[#b0b0d8] bg-white">
            <CardHeader>
              <CardTitle className="text-[#4a4a6a] flex items-center justify-between">
                Blog Content Editor
                <Button
                  onClick={handleGenerateInlineBlog}
                  disabled={isGeneratingBlog || !editorFormData.outline}
                  className="bg-[#7765e3] hover:bg-[#6658f4] text-white text-sm px-4 py-2"
                >
                  {isGeneratingBlog ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : '📝 Generate Blog'}
                </Button>
              </CardTitle>
              <CardDescription>AI-generated blog content that you can edit and customize directly in the editor below</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                    Blog Content
                  </label>
                  <InlineRichTextEditor
                    content={contentRichText || editorFormData.content || ''}
                    onChange={(htmlContent) => {
                      setContentRichText(htmlContent);
                      setEditorFormData(prev => ({ ...prev, content: htmlContent }));
                    }}
                    placeholder="Click 'Generate Blog' to create AI-powered content, or start writing your blog post here..."
                  />
                </div>
                {!contentRichText && !editorFormData.content && (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
                    <p className="text-sm">No blog content generated yet.</p>
                    <p className="text-xs mt-1">Generate an outline first, then click "Generate Blog" to create the full content.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Options Section */}
          <Card className="border border-[#b0b0d8] bg-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-semibold text-[#4a4a6a] mb-2">Save Your Content</h4>
                  <p className="text-sm text-[#4a4a6a]">Save your outline and blog content to the content calendar</p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleCloseInlineEditor}
                    className="border-gray-300 text-gray-600 hover:border-gray-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveInlineContent}
                    className="bg-[#7765e3] hover:bg-[#6658f4] text-white"
                  >
                    💾 Save Content
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-[#4a4a6a]">
            Content Calendar for {companyName}
          </h3>
          <p className="text-sm text-[#4a4a6a]">
            {contentPlan.filter(item => item.status === 'approved').length} of {contentPlan.length} posts approved
          </p>
        </div>
        <div className="flex space-x-3">
        
          
          <Button
            onClick={handlePublishNow}
            disabled={!contentPlan || !contentPlan.some(item => item.status === 'approved')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Publish Now
          </Button>

        
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white border border-[#b0b0d8] rounded-lg p-3">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate(-1)}
            className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-lg font-semibold text-[#4a4a6a]">
            {currentView === 'week' && `Week of ${currentDate.toLocaleDateString()}`}
            {currentView === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {currentView === 'list' && 'Content List View'}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate(1)}
            className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
         
          <Button
            variant={currentView === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('month')}
            className={currentView === 'month' ? 'gradient-primary' : 'border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]'}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Month
          </Button>
          <Button
            variant={currentView === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('list')}
            className={currentView === 'list' ? 'gradient-primary' : 'border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]'}
          >
            <List className="w-4 h-4 mr-1" />
            List
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshCalendar}
            className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4] ml-2"
            title="Refresh calendar data"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          
        </div>
      </div>

      {/* Calendar Grid */}
       {currentView === 'week' && (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-[#4a4a6a] p-2">
            {day}
          </div>
        ))}
        
        {contentPlan.map((item, index) => (
             <div 
               key={index} 
               className="relative min-h-[120px] border border-[#b0b0d8] rounded-lg p-2 hover:border-[#6658f4] hover:shadow-md transition-all duration-200 cursor-pointer group bg-white"
               onClick={() => handleCardClick(item)}
             >
            <div className="text-xs text-[#4a4a6a] mb-1">
              {new Date(item.date).getDate()}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-[#4a4a6a] line-clamp-2">
                {item.title}
              </div>
              <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                <span className="flex items-center space-x-1">
                  {getStatusIcon(item.status)}
                  <span>{item.status}</span>
                </span>
              </Badge>
            </div>
               
               {/* Hover Actions - Only show on hover */}
               <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg flex items-center justify-center space-x-2 z-10">
                 
                
                 
                 {/* Publish Button - Only show for approved content */}
                 {item.status === 'approved' && (
                   <Button
                     size="sm"
                     onClick={(e) => {
                       e.stopPropagation();
                       handlePublishSingleContent(item);
                     }}
                     className="bg-green-600 hover:bg-green-700 text-white"
                   >
                     <Send className="w-3 h-3 mr-1" />
                     Publish
                   </Button>
                 )}
               </div>
               
               {/* Click to edit hint */}
               <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="text-xs text-[#6658f4] bg-white/80 px-1 rounded">
                   Click to edit
                 </div>
               </div>
          </div>
        ))}
      </div>
       )}

      {/* Month View */}
      {currentView === 'month' && (
        <div className="bg-white border border-[#b0b0d8] rounded-lg p-4">
          <div className="text-center text-lg font-semibold text-[#4a4a6a] mb-4">
            Month view coming soon...
          </div>
        </div>
      )}

      {/* List View */}
      {currentView === 'list' && (
        <div className="space-y-3">
          {contentPlan.map((item, index) => (
            <Card key={index} className="border border-[#b0b0d8] bg-white hover:border-[#6658f4] transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-[#4a4a6a]">{item.title}</h4>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <span className="text-sm text-[#4a4a6a]">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#4a4a6a] line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditContent(item)}
                      className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}


      {/* Content Editor Modal */}
      {showContentEditor && editingContent && editingContent.title && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Content</h2>
                <div className="flex space-x-2">
                  {selectedTemplate && (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-[#f8f9ff] border border-[#6658f4] rounded-md">
                      <span className="text-lg">{selectedTemplate.icon}</span>
                      <span className="text-sm font-medium text-[#6658f4]">
                        {selectedTemplate.name} Template
                      </span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowTemplates(true)}
                    className={`border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4] ${
                      selectedTemplate ? 'bg-[#f0f0ff]' : ''
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {selectedTemplate ? 'Change Template' : 'Templates'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowMediaUpload(true)}
                    className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Media
                  </Button>
                  <button
                    onClick={() => setShowContentEditor(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Title</label>
                     <Input
                       value={editingContent.title || ''}
                       onChange={(e) => setEditingContent({...editingContent, title: e.target.value})}
                       className="border-[#b0b0d8] focus:border-[#6658f4]"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Description</label>
                     <div className="space-y-2">
                       <Textarea
                         value={editingContent.description || ''}
                         onChange={(e) => setEditingContent({...editingContent, description: e.target.value})}
                         rows={4}
                         className="border-[#b0b0d8] focus:border-[#6658f4]"
                         placeholder="Enter your content here or use the Rich Text Editor for formatting..."
                       />
                       <div className="flex space-x-2">
                         <Button
                           type="button"
                           variant="outline"
                           onClick={() => {
                             setRichTextContent(editingContent.description || '');
                             setShowRichTextEditor(true);
                           }}
                           className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4] text-sm"
                         >
                           ✏️ Rich Text Editor
                         </Button>
                         {editingContent.description && editingContent.description.includes('<') && (
                           <Button
                             type="button"
                             variant="outline"
                             onClick={() => setShowContentViewer(true)}
                             className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4] text-sm"
                           >
                           👁️ Preview Formatted
                         </Button>
                         )}
                       </div>
                     </div>
                   </div>
                                     <div>
                     <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Keywords</label>
                     <Input
                       value={Array.isArray(editingContent.keywords) ? editingContent.keywords.join(', ') : (editingContent.keywords || '')}
                       onChange={(e) => setEditingContent({...editingContent, keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k.length > 0)})}
                       placeholder="keyword1, keyword2, keyword3"
                       className="border-[#b0b0d8] focus:border-[#6658f4]"
                     />
                   </div>
                                     <div>
                     <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Target Audience</label>
                     <Input
                       value={editingContent.targetAudience || ''}
                       onChange={(e) => setEditingContent({...editingContent, targetAudience: e.target.value})}
                       className="border-[#b0b0d8] focus:border-[#6658f4]"
                     />
                   </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Content Structure</label>
                    <Textarea
                      value={editingContent.contentStructure || ''}
                      onChange={(e) => setEditingContent({...editingContent, contentStructure: e.target.value})}
                      rows={6}
                      placeholder="Outline your content structure..."
                      className="border-[#b0b0d8] focus:border-[#6658f4]"
                    />
                  </div>
                  
                  {uploadedMedia.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Attached Media</label>
                      <div className="space-y-2">
                        {uploadedMedia.map(media => (
                          <div key={media.id} className="flex items-center space-x-2 p-2 border border-[#b0b0d8] rounded">
                            <Image className="w-4 h-4 text-[#4a4a6a]" />
                            <span className="text-sm text-[#4a4a6a] flex-1">{media.name}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeMedia(media.id)}
                              className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4] p-1"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowContentEditor(false)}
                  className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveContent}
                  className="gradient-primary"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
                 </div>
       )}

       {/* Content Viewer Modal */}
       {showContentViewer && viewingContent && (
         <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
           <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-gray-900">View Content</h2>
                 <div className="flex space-x-2">
                   <Button
                     variant="outline"
                     onClick={() => {
                       setShowContentViewer(false);
                       setViewingContent(null);
                     }}
                     className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
                   >
                     Close
                   </Button>
                   <Button
                     onClick={() => {
                       setShowContentViewer(false);
                       setViewingContent(null);
                       handleEditContent(viewingContent);
                     }}
                     className="gradient-primary"
                   >
                     <Edit className="w-4 h-4 mr-2" />
                     Edit Content
                   </Button>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Title</label>
                     <div className="p-3 bg-gray-50 border border-[#b0b0d8] rounded-lg text-[#4a4a6a]">
                       {viewingContent.title || 'No title'}
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Description</label>
                     <div className="p-3 bg-gray-50 border border-[#b0b0d8] rounded-lg text-[#4a4a6a] min-h-[100px]">
                       {viewingContent.description || 'No description'}
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Keywords</label>
                     <div className="p-3 bg-gray-50 border border-[#b0b0d8] rounded-lg text-[#4a4a6a]">
                       {Array.isArray(viewingContent.keywords) ? viewingContent.keywords.join(', ') : (viewingContent.keywords || 'No keywords')}
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Target Audience</label>
                     <div className="p-3 bg-gray-50 border border-[#b0b0d8] rounded-lg text-[#4a4a6a]">
                       {viewingContent.targetAudience || 'No target audience specified'}
                     </div>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Content Structure</label>
                     <div className="p-3 bg-gray-50 border border-[#b0b0d8] rounded-lg text-[#4a4a6a] min-h-[150px]">
                       {viewingContent.contentStructure || 'No content structure defined'}
                     </div>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Status</label>
                     <Badge className={getStatusColor(viewingContent.status)}>
                       {viewingContent.status}
                     </Badge>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-[#4a4a6a] mb-2">Publish Date</label>
                     <div className="p-3 bg-gray-50 border border-[#b0b0d8] rounded-lg text-[#4a4a6a]">
                       {new Date(viewingContent.date).toLocaleDateString()}
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Content Templates</h2>
                <div className="flex items-center space-x-3">
                  {selectedTemplate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(null);
                        alert('Template cleared!');
                      }}
                      className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
                    >
                      Clear Template
                    </Button>
                  )}
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contentTemplates.map(template => (
                  <Card
                    key={template.id}
                    className={`border transition-all cursor-pointer ${
                      selectedTemplate?.id === template.id
                        ? 'border-[#6658f4] bg-[#f8f9ff] shadow-lg scale-105'
                        : 'border-[#b0b0d8] bg-white hover:border-[#6658f4] hover:shadow-md'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{template.icon}</span>
                          <h3 className="font-semibold text-[#4a4a6a]">{template.name}</h3>
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <CheckCircle className="w-5 h-5 text-[#6658f4]" />
                        )}
                      </div>
                      <p className="text-sm text-[#4a4a6a] mb-3">{template.structure.contentStructure}</p>
                      <div className="text-xs text-[#4a4a6a]">
                        <strong>Target:</strong> {template.structure.targetAudience}
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#e0e0e0]">
                        <div className="text-xs text-[#4a4a6a] mb-3">
                          <strong>Keywords:</strong> {template.structure.keywords.join(', ')}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              applyTemplateToNewContent(template);
                            }}
                            className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4] text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Create New
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTemplateSelect(template);
                            }}
                            className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4] text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Apply to Current
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Upload Modal */}
      {showMediaUpload && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Media Upload</h2>
                <button
                  onClick={() => setShowMediaUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-[#b0b0d8] rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-[#4a4a6a] mx-auto mb-4" />
                  <p className="text-[#4a4a6a] mb-2">Drop files here or click to upload</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleMediaUpload}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload">
                    <Button className="gradient-primary cursor-pointer">
                      Choose Files
                    </Button>
                  </label>
                </div>

                {uploadedMedia.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[#4a4a6a] mb-3">Uploaded Media</h3>
                    <div className="space-y-2">
                      {uploadedMedia.map(media => (
                        <div key={media.id} className="flex items-center space-x-2 p-2 border border-[#b0b0d8] rounded">
                          <Image className="w-4 h-4 text-[#4a4a6a]" />
                          <span className="text-sm text-[#4a4a6a] flex-1">{media.name}</span>
                          <span className="text-xs text-[#4a4a6a]">{(media.size / 1024 / 1024).toFixed(2)} MB</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeMedia(media.id)}
                            className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4] p-1"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CMS Setup Modal */}
      {showCmsSetup && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCmsSetup(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="relative p-6">
              {/* Close Button */}
              <button
                onClick={() => setShowCmsSetup(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">CMS Platform Setup</h2>
                <p className="text-gray-600">
                  Configure your CMS credentials for auto-publishing
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                    CMS Platform
                  </label>
                  <select 
                    value={cmsPlatform} 
                    onChange={(e) => setCmsPlatform(e.target.value)}
                    className="w-full h-10 rounded-md border border-[#b0b0d8] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6658f4] focus:border-[#6658f4]"
                  >
                    <option value="">Select a platform...</option>
                    <option value="wordpress">WordPress</option>
                    <option value="webflow">Webflow</option>
                    <option value="shopify">Shopify</option>
                    <option value="wix">Wix</option>
                  </select>
                  {cmsPlatform && (
                    <p className="text-xs text-[#6658f4] mt-1">
                      Selected: {cmsPlatform.charAt(0).toUpperCase() + cmsPlatform.slice(1)}
                    </p>
                  )}
                </div>

                {/* WordPress Fields */}
                {cmsPlatform === 'wordpress' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                        Site URL
                      </label>
                      <Input
                        placeholder="https://yoursite.com"
                        className="border-[#b0b0d8] focus:border-[#6658f4]"
                        value={cmsCredentials.siteUrl || ''}
                        onChange={(e) => setCmsCredentials({ ...cmsCredentials, siteUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                        Username
                      </label>
                      <Input
                        placeholder="your_username"
                        className="border-[#b0b0d8] focus:border-[#6658f4]"
                        value={cmsCredentials.username || ''}
                        onChange={(e) => setCmsCredentials({ ...cmsCredentials, username: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                        Application Password
                      </label>
                      <Input
                        type="password"
                        placeholder="your_app_password"
                        className="border-[#b0b0d8] focus:border-[#6658f4]"
                        value={cmsCredentials.applicationPassword || ''}
                        onChange={(e) => setCmsCredentials({ ...cmsCredentials, applicationPassword: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Webflow Fields */}
                {cmsPlatform === 'webflow' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                        API Key
                      </label>
                      <Input
                        placeholder="your_api_key"
                        className="border-[#b0b0d8] focus:border-[#6658f4]"
                        value={cmsCredentials.apiKey || ''}
                        onChange={(e) => setCmsCredentials({ ...cmsCredentials, apiKey: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                        Site ID
                      </label>
                      <Input
                        placeholder="your_site_id"
                        className="border-[#b0b0d8] focus:border-[#6658f4]"
                        value={cmsCredentials.siteId || ''}
                        onChange={(e) => setCmsCredentials({ ...cmsCredentials, siteId: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Shopify Fields */}
                {cmsPlatform === 'shopify' && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                      <div className="text-xs text-blue-800">
                        <strong>Shopify Setup Instructions:</strong><br/>
                        • Shop Domain: Enter your shop domain (e.g., yourshop.myshopify.com)<br/>
                        • Access Token: Use a private app access token from your Shopify admin
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                        Shop Domain
                      </label>
                      <Input
                        placeholder="yourshop.myshopify.com"
                        className="border-[#b0b0d8] focus:border-[#6658f4]"
                        value={cmsCredentials.shopDomain || ''}
                        onChange={(e) => setCmsCredentials({ ...cmsCredentials, shopDomain: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Don't include https:// - just the domain
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                        Access Token
                      </label>
                      <Input
                        type="password"
                        placeholder="your_access_token"
                        className="border-[#b0b0d8] focus:border-[#6658f4]"
                        value={cmsCredentials.accessToken || ''}
                        onChange={(e) => setCmsCredentials({ ...cmsCredentials, accessToken: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Create a private app in Shopify Admin → Apps → Develop apps
                      </p>
                    </div>
                  </div>
                )}

                {/* Wix Fields */}
                {cmsPlatform === 'wix' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                        Site ID
                      </label>
                      <Input
                        placeholder="your_site_id"
                        className="border-[#b0b0d8] focus:border-[#6658f4]"
                        value={cmsCredentials.siteId || ''}
                        onChange={(e) => setCmsCredentials({ ...cmsCredentials, siteId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                        API Key
                      </label>
                      <Input
                        placeholder="your_api_key"
                        className="border-[#b0b0d8] focus:border-[#6658f4]"
                        value={cmsCredentials.apiKey || ''}
                        onChange={(e) => setCmsCredentials({ ...cmsCredentials, apiKey: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4a4a6a] mb-2">
                        Access Token
                      </label>
                      <Input
                        type="password"
                        placeholder="your_access_token"
                        className="border-[#b0b0d8] focus:border-[#6658f4]"
                        value={cmsCredentials.accessToken || ''}
                        onChange={(e) => setCmsCredentials({ ...cmsCredentials, accessToken: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCmsSetup(false)}
                    className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveCMSCredentials} 
                    className="gradient-primary"
                    disabled={!cmsPlatform || isSavingCredentials}
                  >
                    {isSavingCredentials ? 'Saving...' : 'Save & Test Connection'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rich Text Editor Modal */}
      <RichTextEditor
        content={richTextContent}
        onSave={handleRichTextSave}
        onCancel={handleRichTextCancel}
        isOpen={showRichTextEditor}
      />

      {/* Rich Text Editor for Content Editing */}
      <RichTextEditor
        content={contentRichText}
        onSave={handleContentRichTextSave}
        onCancel={handleContentRichTextCancel}
        isOpen={showContentRichTextEditor}
      />
    </div>
  );
};

export default ContentCalendarView;
