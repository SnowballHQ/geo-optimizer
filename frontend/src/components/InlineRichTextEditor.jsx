import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

const InlineRichTextEditor = ({ content, onChange, placeholder = "Start writing your content here..." }) => {
  // Image upload modal state
  const [showImageModal, setShowImageModal] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [showImageResizeModal, setShowImageResizeModal] = React.useState(false);
  const [selectedImageNode, setSelectedImageNode] = React.useState(null);
  const [imageWidth, setImageWidth] = React.useState('');
  const [imageHeight, setImageHeight] = React.useState('');
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-disc pl-5 space-y-1',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-decimal pl-5 space-y-1',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'leading-relaxed',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-600 hover:text-blue-800 underline' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'max-w-full h-auto rounded-lg cursor-pointer' },
        inline: false,
        allowBase64: true,
      }),
      Underline,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 w-full',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 font-semibold text-left p-2 border border-gray-300',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: { 
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] p-4 border border-gray-200 rounded-md',
        placeholder: placeholder
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image/'));
        
        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            handleImageUpload(file);
          }
          return true;
        }
        return false;
      },
      handleClick: (view, pos, event) => {
        const target = event.target;
        if (target.tagName === 'IMG') {
          setSelectedImageNode(target);
          const currentWidth = target.style.width || target.width || '';
          const currentHeight = target.style.height || target.height || '';
          setImageWidth(currentWidth.toString().replace('px', ''));
          setImageHeight(currentHeight.toString().replace('px', ''));
          setShowImageResizeModal(true);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    setShowImageModal(true);
  };

  const handleImageUrlSubmit = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageModal(false);
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
        editor.chain().focus().setImage({ src: result.data.url }).run();
        setShowImageModal(false);
        console.log('Image uploaded successfully:', result.data.url);
      } else {
        alert('Failed to upload image: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleImageResize = () => {
    if (selectedImageNode) {
      // Apply resize to the selected image
      if (imageWidth) {
        selectedImageNode.style.width = imageWidth + (imageWidth.includes('px') || imageWidth.includes('%') ? '' : 'px');
      }
      if (imageHeight) {
        selectedImageNode.style.height = imageHeight + (imageHeight.includes('px') || imageHeight.includes('%') ? '' : 'px');
      }
      
      // Trigger editor update
      if (onChange && editor) {
        onChange(editor.getHTML());
      }
      
      setShowImageResizeModal(false);
      setSelectedImageNode(null);
      setImageWidth('');
      setImageHeight('');
    }
  };

  const handleImageDelete = () => {
    if (selectedImageNode) {
      selectedImageNode.remove();
      
      // Trigger editor update
      if (onChange && editor) {
        onChange(editor.getHTML());
      }
      
      setShowImageResizeModal(false);
      setSelectedImageNode(null);
      setImageWidth('');
      setImageHeight('');
    }
  };

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="border border-[#b0b0d8] rounded-lg bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 rounded-t-lg">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded text-xs ${editor?.isActive('bold') ? 'bg-blue-200 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded text-xs ${editor?.isActive('italic') ? 'bg-blue-200 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded text-xs ${editor?.isActive('heading', { level: 1 }) ? 'bg-blue-200 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded text-xs ${editor?.isActive('heading', { level: 2 }) ? 'bg-blue-200 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded text-xs ${editor?.isActive('heading', { level: 3 }) ? 'bg-blue-200 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            title="Heading 3"
          >
            H3
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded text-xs ${editor?.isActive('underline') ? 'bg-blue-200 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            title="Underline"
          >
            <u>U</u>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded text-xs ${editor?.isActive('bulletList') ? 'bg-blue-200 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            title="Bullet List"
          >
            •
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded text-xs ${editor?.isActive('orderedList') ? 'bg-blue-200 text-blue-800' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            title="Numbered List"
          >
            1.
          </button>
          <button
            onClick={addLink}
            className="p-1.5 rounded text-xs bg-white text-gray-700 hover:bg-gray-100"
            title="Add Link"
          >
            🔗
          </button>
          <button
            onClick={addImage}
            className="p-1.5 rounded text-xs bg-white text-gray-700 hover:bg-gray-100"
            title="Add Image"
          >
            🖼️
          </button>
          <button
            onClick={insertTable}
            className="p-1.5 rounded text-xs bg-white text-gray-700 hover:bg-gray-100"
            title="Insert Table"
          >
            📊
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[300px]">
        <EditorContent editor={editor} />
      </div>
      
      {/* Helper Text */}
      <div className="px-2 py-1 text-xs text-gray-500 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        💡 <strong>Image Tips:</strong> Paste images from clipboard (Ctrl+V) • Click on images to resize/delete • Upload via 🖼️ button
      </div>

      {/* Image Upload Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Image</h3>
            
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
                    id="inline-image-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="inline-image-upload"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={uploadingImage}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setImageUrl('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={uploadingImage}
              >
                Cancel
              </button>
              <button
                onClick={handleImageUrlSubmit}
                disabled={!imageUrl || uploadingImage}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Add Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Resize Modal */}
      {showImageResizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resize Image</h3>
            
            <div className="space-y-4">
              {/* Width Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (px or %)
                </label>
                <input
                  type="text"
                  value={imageWidth}
                  onChange={(e) => setImageWidth(e.target.value)}
                  placeholder="e.g., 300, 50%, auto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Height Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (px or %)
                </label>
                <input
                  type="text"
                  value={imageHeight}
                  onChange={(e) => setImageHeight(e.target.value)}
                  placeholder="e.g., 200, 25%, auto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Quick Size Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setImageWidth('25%'); setImageHeight('auto'); }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    25% Width
                  </button>
                  <button
                    onClick={() => { setImageWidth('50%'); setImageHeight('auto'); }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    50% Width
                  </button>
                  <button
                    onClick={() => { setImageWidth('75%'); setImageHeight('auto'); }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    75% Width
                  </button>
                  <button
                    onClick={() => { setImageWidth('100%'); setImageHeight('auto'); }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Full Width
                  </button>
                  <button
                    onClick={() => { setImageWidth('300'); setImageHeight('auto'); }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    300px
                  </button>
                  <button
                    onClick={() => { setImageWidth('500'); setImageHeight('auto'); }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    500px
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between mt-6">
              <button
                onClick={handleImageDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                🗑️ Delete Image
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowImageResizeModal(false);
                    setSelectedImageNode(null);
                    setImageWidth('');
                    setImageHeight('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImageResize}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineRichTextEditor;
