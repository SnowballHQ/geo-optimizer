import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserInfo } from '../utils/auth';
import RichTextEditor from '../components/RichTextEditor';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ShoppingBag, Layers, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { apiService } from '../utils/api';
import { toast } from 'react-toastify';

const BlogEditor = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [showRichTextEditor, setShowRichTextEditor] = useState(false);
  const [richTextContent, setRichTextContent] = useState('');
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [generatedBlogContent, setGeneratedBlogContent] = useState('');
  const [contentUpdateKey, setContentUpdateKey] = useState(0);
  const [shopifyConnection, setShopifyConnection] = useState({ status: 'checking', shop: null });
  const [webflowConnection, setWebflowConnection] = useState({ status: 'checking', userEmail: null });
  const [showPublishOptions, setShowPublishOptions] = useState(false);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    keywords: '',
    targetAudience: '',
    content: '',
    outline: '',
    publishDate: '',
    status: 'draft'
  });

  // Get user info on component mount
  useEffect(() => {
    const userInfo = getUserInfo();
    console.log('User info from token:', userInfo);
    if (userInfo) {
      setUser(userInfo);
    } else {
      console.error('No user info found, redirecting to login');
      navigate('/login');
    }
  }, [navigate]);

  // Check CMS connection status
  useEffect(() => {
    checkShopifyConnection();
    checkWebflowConnection();
  }, []);

  const checkShopifyConnection = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/shopify/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth')}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.status === 'connected') {
        setShopifyConnection({
          status: 'connected',
          shop: data.shop,
          connectedAt: data.connectedAt
        });
      } else {
        setShopifyConnection({
          status: 'disconnected',
          shop: null
        });
      }
    } catch (error) {
      console.error('Error checking Shopify connection:', error);
      setShopifyConnection({
        status: 'error',
        shop: null
      });
    }
  };

  const checkWebflowConnection = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/webflow/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth')}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.status === 'connected') {
        setWebflowConnection({
          status: 'connected',
          userEmail: data.userEmail,
          connectedAt: data.connectedAt
        });
      } else {
        setWebflowConnection({
          status: 'disconnected',
          userEmail: null
        });
      }
    } catch (error) {
      console.error('Error checking Webflow connection:', error);
      setWebflowConnection({
        status: 'error',
        userEmail: null
      });
    }
  };

  // Fetch blog post data on component mount
  useEffect(() => {
    console.log('useEffect triggered with postId:', postId);
    if (postId && postId !== 'new') {
      console.log('Fetching post data for ID:', postId);
      fetchPostData();
    } else {
      console.log('Setting up new post form');
      setLoading(false);
      setFormData({
        title: '',
        description: '',
        keywords: '',
        targetAudience: '',
        content: '',
        outline: '',
        publishDate: new Date().toISOString().split('T')[0],
        status: 'draft'
      });
    }
  }, [postId]);

  // Debug: Log postId changes
  useEffect(() => {
    console.log('postId changed to:', postId);
  }, [postId]);

  const fetchPostData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContentCalendarEntry(postId);
      console.log('API Response:', response); // Debug log
      
      if (response.data && response.data.success && response.data.data) {
        const postData = response.data.data;
        setPost(postData);
        setFormData({
          title: postData.title || '',
          description: postData.description || '',
          keywords: Array.isArray(postData.keywords) ? postData.keywords.join(', ') : postData.keywords || '',
          targetAudience: postData.targetAudience || '',
          content: postData.content || '',
          outline: postData.outline || '',
          publishDate: postData.publishDate ? new Date(postData.publishDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: postData.status || 'draft'
        });
        setRichTextContent(postData.content || '');
        
        // Log if outline exists
        if (postData.outline) {
          console.log('Existing outline found:', postData.outline);
        }
      } else {
        console.error('Invalid response structure:', response);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      // Handle error - could show toast notification
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRichTextSave = (htmlContent) => {
    setRichTextContent(htmlContent);
    setFormData(prev => ({ 
      ...prev, 
      content: htmlContent,
      description: htmlContent // Also sync to description field
    }));
    setShowRichTextEditor(false);
  };

  const handleRichTextCancel = () => {
    setShowRichTextEditor(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Sync Rich Text Editor content to description field
      const updatedFormData = {
        ...formData,
        description: richTextContent || formData.content || formData.description,
        content: richTextContent || formData.content,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        userId: user.id,
        companyName: user.companyName
      };

      if (postId && postId !== 'new') {
        // Update existing post
        await apiService.updateContentCalendarEntry(postId, updatedFormData);
        
        // Update local state to reflect the changes
        setFormData(prev => ({
          ...prev,
          description: updatedFormData.description,
          content: updatedFormData.content
        }));
        
        console.log('Post updated successfully');
        alert('Post saved successfully!');
      } else {
        // Create new post
        const response = await apiService.createContentCalendarEntry(updatedFormData);
        // Redirect to the new post's editor
        if (response.data && response.data.data && response.data.data._id) {
          navigate(`/editor/${response.data.data._id}`);
        } else {
          console.error('Invalid response structure for new post:', response);
        }
        return;
      }

      // Show success message or toast
      console.log('Post saved successfully');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateOutline = async () => {
    if (!formData.title) {
      toast.error('Please enter a title first');
      return;
    }

    try {
      setGeneratingOutline(true);

      let actualPostId = postId;

      // If this is a new post, save it first to get a real ID
      if (postId === 'new') {
        console.log('New post detected - saving draft first to get ID...');

        const draftData = {
          date: new Date().toISOString().split('T')[0],
          title: formData.title,
          description: formData.description || '',
          keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) : [],
          targetAudience: formData.targetAudience || '',
          status: 'draft'
        };

        const saveResponse = await apiService.createContentCalendarEntry(draftData);

        if (saveResponse.data && saveResponse.data.data && saveResponse.data.data._id) {
          actualPostId = saveResponse.data.data._id;
          console.log('Draft saved with ID:', actualPostId);

          // Update URL to reflect saved post
          navigate(`/editor/${actualPostId}`, { replace: true });

          toast.success('Draft saved! Generating outline...');
        } else {
          throw new Error('Failed to save draft');
        }
      }

      const outlineData = {
        title: formData.title,
        description: formData.description,
        keywords: formData.keywords,
        targetAudience: formData.targetAudience
      };

      console.log('Generating outline for post:', actualPostId);
      const response = await apiService.generateContentOutline(actualPostId, outlineData);
      console.log('Outline generation response:', response);
      
      if (response.data && response.data.success && response.data.data && response.data.data.outline) {
        setFormData(prev => ({
          ...prev,
          outline: response.data.data.outline
        }));
        console.log('Outline generated successfully:', response.data.data.outline);
        
        // Enhanced success message with brand context information
        const brandContextInfo = response.data.brandContext === 'Applied' 
          ? ' with your brand voice and style applied! 🎯'
          : ' (brand settings not found - using default style)';
        
        alert(`Content outline generated successfully${brandContextInfo}`);
      } else {
        console.error('Invalid response structure for outline:', response);
        alert('Failed to generate outline. Please try again.');
      }
    } catch (error) {
      console.error('Error generating outline:', error);
      alert(`Error generating outline: ${error.message || 'Unknown error'}`);
    } finally {
      setGeneratingOutline(false);
    }
  };

  const handleCreateBlog = async () => {
    if (!formData.outline) {
      alert('Please generate an outline first!');
      return;
    }

    if (!formData.title.trim()) {
      alert('Please enter a title first!');
      return;
    }

    setIsGeneratingBlog(true);
    try {
      let actualPostId = postId;

      // If this is a new post, save it first to get a real ID
      if (postId === 'new') {
        console.log('New post detected - saving draft first to get ID...');

        const draftData = {
          date: new Date().toISOString().split('T')[0],
          title: formData.title,
          description: formData.description || '',
          keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) : [],
          targetAudience: formData.targetAudience || '',
          outline: formData.outline,
          status: 'draft'
        };

        const saveResponse = await apiService.createContentCalendarEntry(draftData);

        if (saveResponse.data && saveResponse.data.data && saveResponse.data.data._id) {
          actualPostId = saveResponse.data.data._id;
          console.log('Draft saved with ID:', actualPostId);

          // Update URL to reflect saved post
          navigate(`/editor/${actualPostId}`, { replace: true });

          toast.success('Draft saved! Generating blog content...');
        } else {
          throw new Error('Failed to save draft');
        }
      }

      const blogData = {
        title: formData.title,
        description: formData.description,
        keywords: formData.keywords,
        targetAudience: formData.targetAudience,
        outline: formData.outline
      };

      console.log('Generating blog content for post:', actualPostId);
      const response = await apiService.createBlogFromOutline(actualPostId, blogData);
      console.log('Blog creation response:', response);
      
      if (response.data && response.data.success && response.data.data && response.data.data.blogContent) {
        const generatedContent = response.data.data.blogContent;
        
        console.log('🎯 Blog content generated, updating UI immediately:', {
          contentLength: generatedContent.length,
          contentPreview: generatedContent.substring(0, 100) + '...'
        });
        
        // Update richTextContent FIRST to ensure it's immediately available
        setRichTextContent(generatedContent);
        
        // Update formData.content SECOND - like outline does with formData.outline
        setFormData(prev => {
          console.log('📝 Setting formData.content:', { 
            contentLength: generatedContent.length,
            hasContent: !!generatedContent
          });
          return {
            ...prev,
            content: generatedContent,
            description: generatedContent
          };
        });
        
        // Force UI update by incrementing content update key
        setContentUpdateKey(prev => prev + 1);
        
        // Update post state for consistency
        setPost(prev => prev ? {
          ...prev,
          content: generatedContent,
          description: generatedContent
        } : null);
        
        console.log('✅ UI state updated synchronously, content should now be visible');
        
        // Save to database AFTER UI update to avoid interference
        setTimeout(async () => {
          try {
            await apiService.updateContentCalendarEntry(postId, {
              content: generatedContent,
              description: generatedContent
            });
            console.log('💾 Auto-saved generated content to database');
          } catch (saveError) {
            console.warn('Failed to auto-save generated content:', saveError);
          }
        }, 100);
        
        // Show success message
        const brandContextInfo = response.data.brandContext === 'Applied' 
          ? ' with your brand voice and style applied! 🎯'
          : ' (brand settings not found - using default style)';
        
        alert(`Blog created successfully${brandContextInfo} Content is now visible in the editor below.`);
        
        // Scroll to editor after a brief delay to ensure content is rendered
        setTimeout(() => {
          document.getElementById('rich-text-editor')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 300);
      } else {
        console.error('Invalid response structure for blog creation:', response);
        alert('Failed to create blog. Please try again.');
      }
    } catch (error) {
      console.error('Error creating blog:', error);
      alert(`Error creating blog: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  const handlePublishToShopify = async () => {
    try {
      setSaving(true);
      
      // Sync Rich Text Editor content to description field before publishing
      // Use the actual blog content from rich text editor or formData.content
      const actualContent = richTextContent || formData.content || formData.description || '';
      
      const publishData = {
        ...formData,
        description: actualContent,
        content: actualContent,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        status: 'published',
        publishedAt: new Date().toISOString()
      };

      // Check if Shopify is connected
      if (shopifyConnection.status !== 'connected') {
        toast.error('Please connect your Shopify store first in Settings');
        setSaving(false);
        return;
      }

      // First update the database with published status
      await apiService.updateContentCalendarEntry(postId, publishData);
      
      // Update local state to reflect the changes
      setFormData(prev => ({
        ...prev,
        description: publishData.description,
        content: publishData.content,
        status: 'published'
      }));

      // Debug content being sent
      console.log('🚀 Publishing to Shopify with data:', {
        title: publishData.title,
        actualContentLength: actualContent ? actualContent.length : 0,
        actualContentPreview: actualContent ? actualContent.substring(0, 200) + '...' : 'NO ACTUAL CONTENT',
        richTextContentLength: richTextContent ? richTextContent.length : 0,
        formDataContentLength: formData.content ? formData.content.length : 0,
        formDataDescriptionLength: formData.description ? formData.description.length : 0
      });

      // Now publish to Shopify using our new API
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/shopify/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth')}`
          },
          body: JSON.stringify({
            title: publishData.title,
            content: actualContent,
            keywords: publishData.keywords,
            targetAudience: publishData.targetAudience
          })
        });

        const result = await response.json();
        
        if (result.success) {
          toast.success(`Successfully published to ${shopifyConnection.shop}!`);
          setShowPublishOptions(false);
          // Navigate back to calendar
          navigate('/dashboard', { state: { showContentCalendar: true } });
        } else {
          toast.error(`Failed to publish to Shopify: ${result.error}`);
        }
      } catch (publishError) {
        console.error('Error publishing to Shopify:', publishError);
        toast.error('Failed to publish to Shopify. Please try again.');
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error('Error publishing post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToWebflow = async () => {
    try {
      setSaving(true);
      
      // Sync Rich Text Editor content to description field before publishing
      // Use the actual blog content from rich text editor or formData.content
      const actualContent = richTextContent || formData.content || formData.description || '';
      
      const publishData = {
        ...formData,
        description: actualContent,
        content: actualContent,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        status: 'published',
        publishedAt: new Date().toISOString()
      };

      // Check if Webflow is connected
      if (webflowConnection.status !== 'connected') {
        toast.error('Please connect your Webflow site first in Settings');
        setSaving(false);
        return;
      }

      // First update the database with published status
      await apiService.updateContentCalendarEntry(postId, publishData);
      
      // Update local state to reflect the changes
      setFormData(prev => ({
        ...prev,
        ...publishData
      }));
      
      setPost(prev => prev ? {
        ...prev,
        ...publishData
      } : null);

      console.log('📤 Publishing to Webflow with content:', {
        title: publishData.title,
        actualContentLength: actualContent ? actualContent.length : 0,
        actualContentPreview: actualContent ? actualContent.substring(0, 200) + '...' : 'NO ACTUAL CONTENT',
        richTextContentLength: richTextContent ? richTextContent.length : 0,
        formDataContentLength: formData.content ? formData.content.length : 0,
        formDataDescriptionLength: formData.description ? formData.description.length : 0
      });

      // For now, we need to get the site ID from the user
      // TODO: Add site selection UI or get from user preferences
      const siteId = prompt('Please enter your Webflow Site ID (you can find this in your Webflow dashboard URL):');
      
      if (!siteId) {
        toast.error('Site ID is required to publish to Webflow');
        setSaving(false);
        return;
      }

      // Now publish to Webflow using our new API
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/webflow/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth')}`
          },
          body: JSON.stringify({
            title: publishData.title,
            content: actualContent,
            keywords: publishData.keywords,
            targetAudience: publishData.targetAudience,
            siteId: siteId
          })
        });

        const result = await response.json();
        
        if (result.success) {
          toast.success(`Successfully published to Webflow site!`);
          setShowPublishOptions(false);
          // Navigate back to calendar
          navigate('/dashboard', { state: { showContentCalendar: true } });
        } else {
          toast.error(`Failed to publish to Webflow: ${result.error}`);
        }
      } catch (publishError) {
        console.error('Error publishing to Webflow:', publishError);
        toast.error('Failed to publish to Webflow. Please try again.');
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error('Error publishing post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth')}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success && result.data.url) {
        // Insert image into content
        const imageHtml = `<img src="${result.data.url}" alt="Uploaded image" class="max-w-full h-auto rounded-lg my-4" />`;
        const currentContent = richTextContent || formData.content || '';
        const newContent = currentContent + imageHtml;
        
        setRichTextContent(newContent);
        setFormData(prev => ({ 
          ...prev, 
          content: newContent,
          description: newContent
        }));
        
        setShowImageUploadModal(false);
        toast.success('Image uploaded and added to content!');
        console.log('Image uploaded successfully:', result.data.url);
      } else {
        toast.error('Failed to upload image: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUrlSubmit = () => {
    if (imageUrl) {
      // Insert image into content
      const imageHtml = `<img src="${imageUrl}" alt="Image" class="max-w-full h-auto rounded-lg my-4" />`;
      const currentContent = richTextContent || formData.content || '';
      const newContent = currentContent + imageHtml;
      
      setRichTextContent(newContent);
      setFormData(prev => ({ 
        ...prev, 
        content: newContent,
        description: newContent
      }));
      
      setImageUrl('');
      setShowImageUploadModal(false);
      toast.success('Image added to content!');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      setSaving(true);
      
      const draftData = {
        ...formData,
        description: richTextContent || formData.content || formData.description,
        content: richTextContent || formData.content,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        status: 'draft'
      };

      if (postId === 'new') {
        const response = await apiService.createContentCalendarEntry(draftData);
        if (response.data && response.data.data && response.data.data._id) {
          navigate(`/editor/${response.data.data._id}`);
        }
      } else {
        await apiService.updateContentCalendarEntry(postId, draftData);
      }
      
      setFormData(prev => ({
        ...prev,
        description: draftData.description,
        content: draftData.content,
        status: 'draft'
      }));

      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Error saving draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7765e3] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
                         <button
               onClick={() => {
                 console.log('Back button clicked, navigating to dashboard with content calendar...');
                 navigate('/dashboard', { state: { showContentCalendar: true } });
               }}
               className="text-gray-500 hover:text-gray-700 transition-colors"
             >
               ← Back to Calendar
             </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">
              {postId === 'new' ? 'Create New Blog Post' : 'Edit Blog Post'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleSaveAsDraft}
              disabled={saving}
              className="bg-[#7765e3] hover:bg-[#6658f4] text-white"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            
            {postId !== 'new' && (
              <>
                {shopifyConnection.status === 'connected' ? (
                  <Button
                    onClick={handlePublishToShopify}
                    disabled={saving}
                    className="bg-[#95BF47] hover:bg-[#7a9c3a] text-white flex items-center space-x-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{saving ? 'Publishing...' : `Publish to ${shopifyConnection.shop?.split('.')[0]}`}</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/dashboard?section=settings')}
                    disabled={saving}
                    variant="outline"
                    className="border-[#95BF47] text-[#95BF47] hover:bg-[#95BF47] hover:text-white flex items-center space-x-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Connect Shopify to Publish</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

             {/* Main Content */}
       <div className="max-w-7xl mx-auto px-6 py-8">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Left Column - Form Fields */}
           <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter blog post title"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter blog post description"
                    rows={3}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <Input
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleInputChange}
                    placeholder="Enter keywords separated by commas"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <Input
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    placeholder="e.g., Marketing professionals, Small business owners"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Date
                  </label>
                  <Input
                    type="date"
                    name="publishDate"
                    value={formData.publishDate}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7765e3] focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Shopify Connection Status */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-[#95BF47]" />
                  <span>Publishing Destination</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shopifyConnection.status === 'connected' ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{shopifyConnection.shop}</p>
                        <p className="text-sm text-green-600">Connected & ready to publish</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => window.open(`https://${shopifyConnection.shop}/admin/blogs`, '_blank')}
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Store
                    </Button>
                  </div>
                ) : shopifyConnection.status === 'disconnected' ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-700">No store connected</p>
                        <p className="text-sm text-gray-500">Connect your Shopify store to publish</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate('/dashboard?section=settings')}
                      size="sm"
                      className="bg-[#95BF47] hover:bg-[#7a9c3a] text-white"
                    >
                      Connect Store
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-blue-600">Checking connection status...</p>
                  </div>
                )}
              </CardContent>
            </Card>

                         {/* Content Outline */}
             <div className="bg-white rounded-lg border border-gray-200 p-6">
               {/* Brand Context Indicator */}
               <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                 <div className="flex items-center space-x-2">
                   <div className="w-2 h-2 bg-[#7765e3] rounded-full animate-pulse"></div>
                   <span className="text-sm font-medium text-[#7765e3]">
                     🎯 Brand Context Active
                   </span>
                 </div>
                 <p className="text-xs text-gray-600 mt-1">
                   Your brand tonality and information will automatically be applied to generated content
                 </p>
               </div>
               
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-semibold text-gray-900">Content Outline</h2>
                 <Button
                   onClick={handleGenerateOutline}
                   disabled={generatingOutline || !formData.title}
                   className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 disabled:opacity-50"
                 >
                   {generatingOutline ? (
                     <>
                       <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                       Generating...
                     </>
                   ) : (
                     formData.outline ? '🔄 Regenerate' : '✨ Generate Outline'
                   )}
                 </Button>
               </div>
               
               <div className="w-full">
                 {formData.outline ? (
                   <div className="bg-gray-50 rounded-md p-4 w-full">
                     <h3 className="font-medium text-gray-900 mb-3">Generated Outline:</h3>
                     <div className="outline-content w-full prose prose-sm max-w-none">
                       <div 
                         dangerouslySetInnerHTML={{ __html: formData.outline }} 
                         className="outline-html-content w-full"
                       />
                     </div>
                     
                     {/* Create Blog Button */}
                     <div className="mt-4 pt-4 border-t border-gray-200">
                       <Button
                         onClick={handleCreateBlog}
                         disabled={isGeneratingBlog || !formData.title.trim()}
                         className="w-full bg-[#7765e3] hover:bg-[#6658f4] text-white"
                       >
                         {isGeneratingBlog ? (
                           <>
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                             Creating Blog...
                           </>
                         ) : (
                           <>
                             📝 Create Blog from Outline
                           </>
                         )}
                       </Button>
                       <p className="text-xs text-gray-500 mt-2 text-center">
                         Generate full blog content based on this outline
                       </p>
                     </div>
                   </div>
                 ) : (
                   <div className="text-center py-8 text-gray-500 w-full">
                     <p>No outline generated yet.</p>
                     <p className="text-sm mt-1">Click "Generate Outline" to create one based on your title and description.</p>
                   </div>
                 )}
               </div>
             </div>
          </div>

                     {/* Right Column - Content Editor */}
           <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6" id="rich-text-editor">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Content Editor</h2>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => setShowImageUploadModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    🖼️ Add Image
                  </Button>
                  <Button
                    onClick={() => setShowRichTextEditor(true)}
                    className="bg-[#7765e3] hover:bg-[#6658f4] text-white"
                  >
                    ✏️ Rich Text Editor
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <div className="border border-gray-300 rounded-md p-4 min-h-[400px] bg-gray-50">
                    {(richTextContent || formData.content) ? (
                      <div className="prose prose-lg max-w-none" key={`content-${contentUpdateKey}`}>
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: richTextContent || formData.content 
                          }} 
                        />
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-500">
                        <p>No content yet.</p>
                        <p className="text-sm mt-1">Generate a blog from the outline or click "Rich Text Editor" to start writing.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Preview */}
                {(richTextContent || formData.content) && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Content Preview</h3>
                    <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                      <div className="prose prose-sm max-w-none" key={`preview-${contentUpdateKey}`}>
                        <div dangerouslySetInnerHTML={{ __html: richTextContent || formData.content }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rich Text Editor Modal */}
      <RichTextEditor
        content={richTextContent}
        onSave={handleRichTextSave}
        onCancel={handleRichTextCancel}
        isOpen={showRichTextEditor}
      />

      {/* Image Upload Modal */}
      {showImageUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Image to Content</h3>
            
            <div className="space-y-4">
              {/* Upload File */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="main-image-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="main-image-upload"
                    className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
                      uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        📁 Choose File
                      </>
                    )}
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Supports: JPEG, PNG, GIF, WebP (max 5MB)
                  </p>
                </div>
              </div>

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={uploadingImage}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowImageUploadModal(false);
                  setImageUrl('');
                }}
                variant="outline"
                disabled={uploadingImage}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImageUrlSubmit}
                disabled={!imageUrl || uploadingImage}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Add Image
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogEditor;
