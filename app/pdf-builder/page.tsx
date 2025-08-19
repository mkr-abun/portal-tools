'use client'

import { useState, useEffect, useRef } from 'react'

export default function PDFBuilderPage() {
  const [htmlContent, setHtmlContent] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Document</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        h1, h2, h3 {
            color: #2c3e50;
            margin-top: 0;
        }
        
        h1 {
            border-bottom: 2px solid #007acc;
            padding-bottom: 10px;
        }
        
        .highlight {
            background-color: #f0f8ff;
            padding: 15px;
            border-left: 4px solid #007acc;
            margin: 20px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>Sample Document</h1>
    
    <p>This is a sample document created with the HTML PDF Builder. You can edit the HTML on the left and see the preview on the right.</p>
    
    <div class="highlight">
        <h3>Key Features</h3>
        <ul>
            <li>Real-time HTML preview</li>
            <li>PDF generation</li>
            <li>Syntax highlighting</li>
            <li>Responsive design</li>
        </ul>
    </div>
    
    <h2>Sample Table</h2>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>John Doe</td>
                <td>Developer</td>
                <td>Engineering</td>
            </tr>
            <tr>
                <td>Jane Smith</td>
                <td>Designer</td>
                <td>Creative</td>
            </tr>
        </tbody>
    </table>
    
    <div class="footer">
        Generated on: ${new Date().toLocaleDateString()}
    </div>
</body>
</html>`)

  const [filename, setFilename] = useState('document.pdf')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewKey, setPreviewKey] = useState(0)
  const [showPreview, setShowPreview] = useState(true)
  const [editorHeight, setEditorHeight] = useState('600px')

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update preview when HTML content changes
  useEffect(() => {
    if (showPreview && iframeRef.current) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(htmlContent)
        doc.close()
      }
    }
  }, [htmlContent, showPreview, previewKey])

  const generatePDF = async () => {
    if (!htmlContent.trim()) {
      setError('Please provide HTML content')
      return
    }

    setIsGenerating(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/pdf-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlContent,
          filename,
          options: {
            format: 'A4',
            printBackground: true,
            margin: {
              top: '20px',
              right: '20px',
              bottom: '20px',
              left: '20px',
            },
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate PDF')
      }

      // Download the PDF
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      setSuccess('PDF generated and downloaded successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const refreshPreview = () => {
    setPreviewKey((prev) => prev + 1)
  }

  const insertTemplate = (template: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = htmlContent.substring(0, start) + template + htmlContent.substring(end)
    setHtmlContent(newContent)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + template.length, start + template.length)
    }, 0)
  }

  const templates = {
    heading: '<h2>New Heading</h2>',
    paragraph: '<p>Your paragraph text here...</p>',
    table: `<table>
    <thead>
        <tr>
            <th>Header 1</th>
            <th>Header 2</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
        </tr>
    </tbody>
</table>`,
    list: `<ul>
    <li>First item</li>
    <li>Second item</li>
    <li>Third item</li>
</ul>`,
    highlight: `<div class="highlight">
    <p>This is a highlighted section</p>
</div>`,
    image: '<img src="https://via.placeholder.com/300x200" alt="Placeholder image">',
    link: '<a href="https://example.com">Link text</a>',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">HTML to PDF Builder</h1>
          <p className="text-gray-600">
            Create HTML content and instantly preview it before generating PDF
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filename Input */}
            <div className="flex items-center space-x-2">
              <label htmlFor="filename" className="text-sm font-medium text-gray-700">
                Filename:
              </label>
              <input
                type="text"
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="document.pdf"
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showPreview"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showPreview" className="text-sm font-medium text-gray-700">
                Show Preview
              </label>
            </div>

            {/* Editor Height */}
            <div className="flex items-center space-x-2">
              <label htmlFor="editorHeight" className="text-sm font-medium text-gray-700">
                Editor Height:
              </label>
              <select
                id="editorHeight"
                value={editorHeight}
                onChange={(e) => setEditorHeight(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="400px">Small (400px)</option>
                <option value="600px">Medium (600px)</option>
                <option value="800px">Large (800px)</option>
                <option value="100vh">Full Height</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 ml-auto">
              <button
                onClick={refreshPreview}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              >
                Refresh Preview
              </button>
              <button
                onClick={generatePDF}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isGenerating ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Insert Templates */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Insert:</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(templates).map(([name, template]) => (
              <button
                key={name}
                onClick={() => insertTemplate(template)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              >
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`grid gap-4 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* HTML Editor */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-900">HTML Editor</h2>
              <span className="text-xs text-gray-500">
                Lines: {htmlContent.split('\n').length} | Chars: {htmlContent.length}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Enter your HTML content here..."
              style={{ height: editorHeight }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
                <span className="text-xs text-gray-500">Auto-updates as you type</span>
              </div>
              <div className="border border-gray-300 rounded-md overflow-hidden">
                <iframe
                  ref={iframeRef}
                  key={previewKey}
                  style={{ height: editorHeight }}
                  className="w-full bg-white"
                  sandbox="allow-same-origin"
                  title="HTML Preview"
                />
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-gray-50 rounded-lg p-6 mt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips & Shortcuts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2">Editor Features:</h4>
              <ul className="space-y-1">
                <li>• Real-time preview updates</li>
                <li>• Quick template insertion</li>
                <li>• Adjustable editor height</li>
                <li>• Character and line count</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">PDF Features:</h4>
              <ul className="space-y-1">
                <li>• A4 format with margins</li>
                <li>• Background colors included</li>
                <li>• High-quality rendering</li>
                <li>• Custom filename support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
