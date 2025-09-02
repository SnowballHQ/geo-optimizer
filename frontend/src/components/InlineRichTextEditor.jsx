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
        HTMLAttributes: { class: 'max-w-full h-auto rounded-lg' },
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
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
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
    </div>
  );
};

export default InlineRichTextEditor;
