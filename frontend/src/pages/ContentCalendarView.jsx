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
import { CalendarIcon, Edit, CheckCircle, Clock, Send, Plus, Image, FileText, Calendar, Grid, List, ChevronLeft, ChevronRight, ChevronDown, Upload, X, Eye, RefreshCw, ArrowLeft, Sparkles, Brain, Zap } from 'lucide-react';

const ContentCalendarView = ({ inline = false, onClose, shouldAutoLoad = false, onEditorStateChange }) => {
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
  const [currentView, setCurrentView] = useState('month'); // week, month, list - default is month
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

  // Status dropdown state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null); // stores item _id

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

    // Notify Dashboard that we're exiting editor mode
    if (onEditorStateChange) {
      onEditorStateChange(false);
    }
  };

  // Handle clicking empty date cell to create new content
  const handleCreateContentForDate = (date) => {
    const newContent = {
      _id: `temp-${Date.now()}`, // Temporary ID
      date: date.toISOString().split('T')[0],
      title: '',
      description: '',
      keywords: [],
      targetAudience: '',
      content: '',
      outline: '',
      status: 'draft'
    };

    setSelectedContent(newContent);
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
    setActiveEditorTool('content-editor');

    // Notify Dashboard that we're entering editor mode
    if (onEditorStateChange) {
      onEditorStateChange(true);
    }
  };

  // Handle quick status change
  const handleQuickStatusChange = async (item, newStatus) => {
    try {
      // Update in backend
      await apiService.updateContentCalendarEntry(item._id, { status: newStatus });

      // Update local state
      setContentPlan(prevPlan =>
        prevPlan.map(content =>
          content._id === item._id ? { ...content, status: newStatus } : content
        )
      );

      setStatusDropdownOpen(null);
      // toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
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

    // Notify Dashboard that we're entering editor mode
    if (onEditorStateChange) {
      onEditorStateChange(true);
    }
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

  // ============ Helper Functions for Calendar Date Calculations ============

  // Helper function to get start of week (Sunday)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // Helper function to get all dates for current week view
  const getWeekDates = (date) => {
    const startOfWeek = getStartOfWeek(date);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      dates.push(day);
    }
    return dates;
  };

  // Helper function to get all dates for month calendar (including prev/next month padding)
  const getMonthCalendarDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const lastDate = lastDay.getDate();

    const dates = [];

    // Add previous month's days to fill the first week
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      dates.push({ date: prevDate, isCurrentMonth: false });
    }

    // Add current month's days
    for (let i = 1; i <= lastDate; i++) {
      const currentDate = new Date(year, month, i);
      dates.push({ date: currentDate, isCurrentMonth: true });
    }

    // Add next month's days to fill the last week
    const remainingDays = 42 - dates.length; // 6 rows × 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      dates.push({ date: nextDate, isCurrentMonth: false });
    }

    return dates;
  };

  // Helper function to get content for a specific date
  const getContentForDate = (date) => {
    if (!contentPlan || !Array.isArray(contentPlan)) return [];

    const dateStr = date.toISOString().split('T')[0];
    return contentPlan.filter(item => {
      const itemDateStr = new Date(item.date).toISOString().split('T')[0];
      return itemDateStr === dateStr;
    });
  };

  // Helper function to check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Navigate to today
  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  // Navigate weeks/months
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 35)); // Navigate by 5 weeks
    } else if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  // Helper function to get 5 weeks of dates (35 days total)
  const getMultiWeekDates = (date) => {
    const startOfWeek = getStartOfWeek(date);
    const dates = [];
    for (let i = 0; i < 35; i++) { // 5 weeks × 7 days = 35 days
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      dates.push(day);
    }
    return dates;
  };

  // ============ End Helper Functions ============

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
                <div className="w-8 h-8 bg-gradient-to-r from-[#7c77ff] to-[#6658f4] rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white animate-pulse" />
                </div>
                <span className="bg-gradient-to-r from-[#7c77ff] to-[#6658f4] bg-clip-text text-transparent font-semibold">
                  AI Content Calendar
                </span>
              </CardTitle>
              <CardDescription className="text-[#4a4a6a]">
                <span className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-[#6658f4]" />
                  <span>Setting up your <strong>AI-powered</strong> personalized content calendar...</span>
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#7765e3] mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-[#4a4a6a] flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-[#6658f4] animate-pulse" />
                    <span>AI Creating Your Content Calendar...</span>
                  </p>
                  <p className="text-sm text-[#6b7280] mt-2 flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-[#6658f4]" />
                    <span>Using your brand profile to generate <strong>AI-powered</strong> personalized content</span>
                  </p>
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
              <div className="w-8 h-8 bg-gradient-to-r from-[#7c77ff] to-[#6658f4] rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-[#7c77ff] to-[#6658f4] bg-clip-text text-transparent font-semibold">
                🚀 AI-Powered Content Calendar
              </span>
            </CardTitle>
            <CardDescription className="text-[#4a4a6a]">
              Generate a <span className="font-semibold text-[#6658f4]">30-day AI-powered</span> content plan tailored to your company
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
              className="w-full gradient-primary text-white"
            >
              {isGenerating ? (
                <>
                  <Brain className="w-4 h-4 mr-2 animate-pulse" />
                  AI Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI-Powered Calendar
                </>
              )}
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
      <div className="min-h-screen bg-gray-50">
        {/* Shopify-style Header Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleCloseInlineEditor}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Content Editor</h1>
                <div className="flex items-center space-x-3">
                  <p className="text-sm text-gray-500">Edit and generate content for your calendar</p>
                  {selectedContent?.date && (
                    <span className="text-xs text-gray-500">
                      {new Date(selectedContent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleCloseInlineEditor}
                className="border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveInlineContent}
                className="gradient-primary text-white shadow-md hover:shadow-lg transition-shadow"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Shopify-style Two-Column Layout */}
        <div className="flex flex-col lg:flex-row">
          {/* Main Content Area (70%) */}
          <div className="flex-1 lg:max-w-4xl p-6">
            {/* Large Title Input - Shopify Style */}
            <div className="mb-8">
              <input
                type="text"
                value={editorFormData.title}
                onChange={(e) => setEditorFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-3xl font-semibold text-gray-900 border-none focus:outline-none focus:ring-0 placeholder-gray-400 bg-transparent"
                placeholder="Enter your blog title..."
              />
              <div className="h-px bg-gray-200 mt-2"></div>
              <div className="flex items-center justify-between mt-2">
                <p className={`text-xs font-medium ${
                  editorFormData.title.length === 0 ? 'text-gray-400' :
                  editorFormData.title.length < 40 ? 'text-yellow-600' :
                  editorFormData.title.length <= 60 ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {editorFormData.title.length} / 60
                </p>
              </div>
            </div>

            {/* Content Outline Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Content Outline</h3>
                <Button
                  onClick={handleGenerateInlineOutline}
                  disabled={isGeneratingOutline || !editorFormData.title.trim()}
                  size="sm"
                  className="bg-[#6658f4] hover:bg-[#5547e3] text-white"
                >
                  {isGeneratingOutline ? (
                    <>
                      <Brain className="w-4 h-4 mr-2 animate-pulse" />
                      AI Generating...
                    </>
                  ) : editorFormData.outline ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Regenerate
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      Generate Outline
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={editorFormData.outline || ''}
                onChange={(e) => setEditorFormData(prev => ({ ...prev, outline: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg focus:border-[#6658f4] focus:ring-2 focus:ring-[#6658f4]/20 min-h-[150px] font-mono text-sm"
                placeholder="Your content outline will appear here..."
              />
              {!editorFormData.outline && (
                <p className="text-sm text-gray-500 mt-2">
                  Generate an AI-powered outline to structure your content
                </p>
              )}
            </div>

            {/* Main Content Editor */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Blog Content</h3>
                <Button
                  onClick={handleGenerateInlineBlog}
                  disabled={isGeneratingBlog || !editorFormData.outline}
                  size="sm"
                  className="gradient-primary text-white"
                >
                  {isGeneratingBlog ? (
                    <>
                      <Brain className="w-4 h-4 mr-2 animate-pulse" />
                      AI Creating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-1" />
                      Generate Content
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-white border border-gray-300 rounded-lg overflow-hidden h-[400px] overflow-y-auto">
                <InlineRichTextEditor
                  content={contentRichText || editorFormData.content || ''}
                  onChange={(htmlContent) => {
                    setContentRichText(htmlContent);
                    setEditorFormData(prev => ({ ...prev, content: htmlContent }));
                  }}
                  placeholder="Start writing your blog post here, or generate content from your outline..."
                />
              </div>
              <div className="mt-2">
                {contentRichText || editorFormData.content ? (
                  <p className="text-xs text-gray-500">
                    {(contentRichText || editorFormData.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length} words • ~{Math.ceil((contentRichText || editorFormData.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length / 200)} min read
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Create an outline first, then generate content
                  </p>
                )}
              </div>

              {/* Save Changes Button Below Editor */}
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleSaveInlineContent}
                  className="gradient-primary text-white shadow-md hover:shadow-lg transition-shadow px-8 py-2"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>

          {/* Settings Sidebar (30%) */}
          <div className="w-full lg:w-80 bg-white lg:border-l border-gray-200 lg:border-t-0 border-t p-6 overflow-y-auto lg:max-h-screen">
            {/* Publishing Card */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Publishing
              </h4>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editorFormData.status}
                    onChange={(e) => setEditorFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#6658f4] focus:ring-2 focus:ring-[#6658f4]/20 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SEO Card */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                SEO & Targeting
              </h4>
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <Textarea
                    value={editorFormData.description}
                    onChange={(e) => setEditorFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md focus:border-[#6658f4] focus:ring-2 focus:ring-[#6658f4]/20 text-sm"
                    rows={3}
                    placeholder="Brief description for SEO..."
                  />
                  <p className={`text-xs mt-1 font-medium ${
                    editorFormData.description.length === 0 ? 'text-gray-400' :
                    editorFormData.description.length < 120 ? 'text-yellow-600' :
                    editorFormData.description.length <= 160 ? 'text-green-600' :
                    'text-red-600'
                  }`}>
                    {editorFormData.description.length} / 160
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <Input
                    type="text"
                    value={editorFormData.keywords}
                    onChange={(e) => setEditorFormData(prev => ({ ...prev, keywords: e.target.value }))}
                    className="border-gray-300 focus:border-[#6658f4] focus:ring-2 focus:ring-[#6658f4]/20 text-sm"
                    placeholder="keyword1, keyword2, keyword3..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <Input
                    type="text"
                    value={editorFormData.targetAudience}
                    onChange={(e) => setEditorFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="border-gray-300 focus:border-[#6658f4] focus:ring-2 focus:ring-[#6658f4]/20 text-sm"
                    placeholder="Who is this for?"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            {currentView === 'week' && `Calendar View - Starting ${currentDate.toLocaleDateString()}`}
            {currentView === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {currentView === 'list' && 'All Content - List View'}
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
            variant={currentView === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('week')}
            className={currentView === 'week' ? 'gradient-primary text-white' : 'border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]'}
          >
            <Grid className="w-4 h-4 mr-1" />
            Calendar
          </Button>
          <Button
            variant={currentView === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('month')}
            className={currentView === 'month' ? 'gradient-primary text-white' : 'border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]'}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Month
          </Button>
          <Button
            variant={currentView === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('list')}
            className={currentView === 'list' ? 'gradient-primary text-white' : 'border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]'}
          >
            <List className="w-4 h-4 mr-1" />
            List
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshCalendar}
            className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
            title="Refresh calendar data"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
       {currentView === 'week' && contentPlan && (
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-[#4a4a6a] p-2 border-b border-[#e0e0e0]">
            {day}
          </div>
        ))}

        {/* Calendar Cells - 35 days (5 weeks) */}
        {getMultiWeekDates(currentDate).map((date, index) => {
          const dayContent = getContentForDate(date);
          const isCurrentDay = isToday(date);

          return (
            <div
              key={index}
              className={`relative min-h-[180px] border rounded-lg p-3 transition-all duration-200 bg-white ${
                isCurrentDay
                  ? 'border-[#6658f4] border-2 bg-[#f8f9ff]'
                  : 'border-[#b0b0d8] hover:border-[#6658f4]'
              }`}
            >
              {/* Date Number */}
              <div className={`text-sm font-semibold mb-2 ${isCurrentDay ? 'text-[#6658f4]' : 'text-[#4a4a6a]'}`}>
                {date.getDate()}
                {isCurrentDay && (
                  <span className="ml-1 text-xs bg-[#6658f4] text-white px-1.5 py-0.5 rounded">Today</span>
                )}
              </div>

              {/* Content Items */}
              <div className="space-y-2">
                {dayContent.length > 0 ? (
                  dayContent.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative border border-[#e0e0e0] rounded-md p-2 hover:border-[#6658f4] hover:shadow-sm transition-all duration-200 cursor-pointer group bg-white"
                      onClick={() => handleCardClick(item)}
                    >
                      {/* Status Color Bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${
                        item.status === 'draft' ? 'bg-gray-400' :
                        item.status === 'approved' ? 'bg-blue-500' :
                        item.status === 'published' ? 'bg-green-500' : 'bg-gray-300'
                      }`} />

                      {/* Content Type Icon */}
                      <div className="absolute top-1 right-1">
                        {item.contentType === 'blog' || !item.contentType ? (
                          <FileText className="w-3 h-3 text-[#6658f4]" title="Blog Post" />
                        ) : item.contentType === 'social' ? (
                          <Image className="w-3 h-3 text-blue-500" title="Social Media" />
                        ) : item.contentType === 'newsletter' ? (
                          <Send className="w-3 h-3 text-green-500" title="Newsletter" />
                        ) : item.contentType === 'case-study' ? (
                          <Brain className="w-3 h-3 text-purple-500" title="Case Study" />
                        ) : (
                          <FileText className="w-3 h-3 text-[#6658f4]" title="Content" />
                        )}
                      </div>

                      <div className="pl-2 space-y-1 pr-5">
                        {/* Title */}
                        <div className="text-xs font-medium text-[#4a4a6a] line-clamp-2 leading-tight">
                          {item.title}
                        </div>

                        {/* Status Badge with Dropdown */}
                        <div className="relative">
                          <Badge
                            className={`text-xs cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(item.status)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusDropdownOpen(statusDropdownOpen === item._id ? null : item._id);
                            }}
                          >
                            <span className="flex items-center space-x-1">
                              {getStatusIcon(item.status)}
                              <span className="capitalize">{item.status}</span>
                              <ChevronDown className="w-3 h-3 ml-0.5" />
                            </span>
                          </Badge>

                          {/* Status Dropdown */}
                          {statusDropdownOpen === item._id && (
                            <div className="absolute z-50 mt-1 bg-white border border-[#b0b0d8] rounded-md shadow-lg py-1 min-w-[120px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickStatusChange(item, 'draft');
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <FileText className="w-3 h-3 text-gray-500" />
                                <span>Draft</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickStatusChange(item, 'approved');
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <CheckCircle className="w-3 h-3 text-blue-600" />
                                <span>Approved</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickStatusChange(item, 'published');
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center space-x-2"
                              >
                                <Send className="w-3 h-3 text-green-600" />
                                <span>Published</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Keywords */}
                        {item.keywords && item.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.keywords.slice(0, 2).map((keyword, kidx) => (
                              <span key={kidx} className="text-xs bg-[#f0f0ff] text-[#6658f4] px-1.5 py-0.5 rounded">
                                {keyword}
                              </span>
                            ))}
                            {item.keywords.length > 2 && (
                              <span className="text-xs text-gray-500">+{item.keywords.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-md flex items-center justify-center space-x-2 z-10">
                        {item.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePublishSingleContent(item);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Publish
                          </Button>
                        )}
                        <div className="text-xs text-[#6658f4]">Click to edit</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    onClick={() => handleCreateContentForDate(date)}
                    className="text-center py-6 text-xs text-gray-400 hover:text-[#6658f4] hover:bg-[#f8f9ff] rounded cursor-pointer transition-all group"
                  >
                    <Plus className="w-5 h-5 mx-auto mb-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="font-medium">Click to add content</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
       )}

      {/* Month View */}
      {currentView === 'month' && contentPlan && (
        <div className="bg-white border border-[#b0b0d8] rounded-lg p-2">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-[#4a4a6a] p-2 border-b border-[#e0e0e0]">
                {day}
              </div>
            ))}
          </div>

          {/* Month Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {getMonthCalendarDates(currentDate).map((dateObj, index) => {
              const dayContent = getContentForDate(dateObj.date);
              const isCurrentDay = isToday(dateObj.date);
              const isCurrentMonth = dateObj.isCurrentMonth;

              return (
                <div
                  key={index}
                  className={`relative min-h-[120px] border rounded-md p-2 transition-all duration-200 ${
                    isCurrentDay
                      ? 'border-[#6658f4] border-2 bg-[#f8f9ff]'
                      : isCurrentMonth
                      ? 'border-[#d0d0e0] bg-white hover:border-[#6658f4]'
                      : 'border-[#e8e8f0] bg-gray-50'
                  }`}
                >
                  {/* Date Number */}
                  <div className={`text-xs font-semibold mb-1 ${
                    isCurrentDay
                      ? 'text-[#6658f4]'
                      : isCurrentMonth
                      ? 'text-[#4a4a6a]'
                      : 'text-gray-400'
                  }`}>
                    {dateObj.date.getDate()}
                    {isCurrentDay && (
                      <span className="ml-1 text-xs bg-[#6658f4] text-white px-1 py-0.5 rounded">Today</span>
                    )}
                  </div>

                  {/* Content Items */}
                  <div className="space-y-1">
                    {dayContent.length > 0 ? (
                      <>
                        {dayContent.slice(0, 2).map((item, idx) => (
                          <div
                            key={idx}
                            className="relative border border-[#e0e0e0] rounded p-1 hover:border-[#6658f4] transition-all duration-150 cursor-pointer group bg-white text-xs"
                            onClick={() => handleCardClick(item)}
                          >
                            {/* Status Color Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l ${
                              item.status === 'draft' ? 'bg-gray-400' :
                              item.status === 'approved' ? 'bg-blue-500' :
                              item.status === 'published' ? 'bg-green-500' : 'bg-gray-300'
                            }`} />

                            {/* Content Type Icon */}
                            <div className="absolute top-0.5 right-0.5">
                              {item.contentType === 'blog' || !item.contentType ? (
                                <FileText className="w-2.5 h-2.5 text-[#6658f4]" title="Blog" />
                              ) : item.contentType === 'social' ? (
                                <Image className="w-2.5 h-2.5 text-blue-500" title="Social" />
                              ) : item.contentType === 'newsletter' ? (
                                <Send className="w-2.5 h-2.5 text-green-500" title="Newsletter" />
                              ) : item.contentType === 'case-study' ? (
                                <Brain className="w-2.5 h-2.5 text-purple-500" title="Case Study" />
                              ) : (
                                <FileText className="w-2.5 h-2.5 text-[#6658f4]" />
                              )}
                            </div>

                            <div className="pl-1.5 pr-4">
                              {/* Title */}
                              <div className="font-medium text-[#4a4a6a] line-clamp-1 text-xs leading-tight">
                                {item.title}
                              </div>

                              {/* Status Icon */}
                              <div className="flex items-center space-x-1 mt-0.5">
                                <span className={`text-xs ${
                                  item.status === 'draft' ? 'text-gray-500' :
                                  item.status === 'approved' ? 'text-blue-600' :
                                  item.status === 'published' ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                  {getStatusIcon(item.status)}
                                </span>
                                <span className="text-xs capitalize text-gray-600">{item.status}</span>
                              </div>
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-[#6658f4]/10 opacity-0 group-hover:opacity-100 transition-opacity rounded" />
                          </div>
                        ))}
                        {dayContent.length > 2 && (
                          <div className="text-xs text-center text-[#6658f4] font-medium cursor-pointer hover:underline">
                            +{dayContent.length - 2} more
                          </div>
                        )}
                      </>
                    ) : (
                      isCurrentMonth && (
                        <div
                          onClick={() => handleCreateContentForDate(dateObj.date)}
                          className="text-center py-3 text-xs text-gray-300 hover:text-[#6658f4] hover:bg-[#f8f9ff] rounded cursor-pointer transition-all group"
                        >
                          <Plus className="w-4 h-4 mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {currentView === 'list' && contentPlan && (
        <div className="space-y-3">
          {/* List Items */}
          {contentPlan.map((item, index) => (
            <Card
              key={index}
              className="border border-[#b0b0d8] bg-white hover:border-[#6658f4] transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-[#4a4a6a]">{item.title}</h4>

                      {/* Content Type Badge */}
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 flex items-center space-x-1">
                        {item.contentType === 'blog' || !item.contentType ? (
                          <>
                            <FileText className="w-3 h-3" />
                            <span>Blog</span>
                          </>
                        ) : item.contentType === 'social' ? (
                          <>
                            <Image className="w-3 h-3" />
                            <span>Social</span>
                          </>
                        ) : item.contentType === 'newsletter' ? (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Newsletter</span>
                          </>
                        ) : item.contentType === 'case-study' ? (
                          <>
                            <Brain className="w-3 h-3" />
                            <span>Case Study</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3" />
                            <span>Content</span>
                          </>
                        )}
                      </span>

                      {/* Status Badge with Dropdown */}
                      <div className="relative">
                        <Badge
                          className={`cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(item.status)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusDropdownOpen(statusDropdownOpen === item._id ? null : item._id);
                          }}
                        >
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(item.status)}
                            <span className="capitalize">{item.status}</span>
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                          </span>
                        </Badge>

                        {/* Status Dropdown */}
                        {statusDropdownOpen === item._id && (
                          <div className="absolute z-50 mt-1 left-0 bg-white border border-[#b0b0d8] rounded-md shadow-lg py-1 min-w-[120px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickStatusChange(item, 'draft');
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span>Draft</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickStatusChange(item, 'approved');
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                              <span>Approved</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickStatusChange(item, 'published');
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2"
                            >
                              <Send className="w-4 h-4 text-green-600" />
                              <span>Published</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <span className="text-sm text-[#4a4a6a]">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#4a4a6a] line-clamp-2">{item.description}</p>

                    {/* Keywords */}
                    {item.keywords && item.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.keywords.slice(0, 5).map((keyword, kidx) => (
                          <span key={kidx} className="text-xs bg-[#f0f0ff] text-[#6658f4] px-2 py-0.5 rounded">
                            {keyword}
                          </span>
                        ))}
                        {item.keywords.length > 5 && (
                          <span className="text-xs text-gray-500">+{item.keywords.length - 5} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCardClick(item)}
                      className="border-[#b0b0d8] text-[#4a4a6a] hover:border-[#6658f4]"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {item.status === 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => handlePublishSingleContent(item)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Publish
                      </Button>
                    )}
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
                  className="gradient-primary text-white"
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
                     className="gradient-primary text-white"
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
                    <Button className="gradient-primary text-white cursor-pointer">
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
                    className="gradient-primary text-white"
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
