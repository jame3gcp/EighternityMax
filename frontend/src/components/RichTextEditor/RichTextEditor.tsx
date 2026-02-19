import React from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image', 'code-block'],
      ['clean'],
    ],
  }

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'link',
    'image',
    'code-block',
  ]

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden min-h-[300px]"
      />
      <style>{`
        .ql-toolbar.ql-snow {
          border-color: #e5e7eb;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background-color: #f9fafb;
        }
        .dark .ql-toolbar.ql-snow {
          border-color: #374151;
          background-color: #1f2937;
        }
        .ql-container.ql-snow {
          border-color: #e5e7eb;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          min-height: 250px;
        }
        .dark .ql-container.ql-snow {
          border-color: #374151;
        }
        .dark .ql-editor {
          color: #f3f4f6;
        }
        .dark .ql-stroke {
          stroke: #9ca3af;
        }
        .dark .ql-fill {
          fill: #9ca3af;
        }
        .dark .ql-picker {
          color: #9ca3af;
        }
      `}</style>
    </div>
  )
}

export default RichTextEditor
