'use client'

import { useState } from 'react'
import { PDFGenerationRequest } from '../utils/pdf.utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FileText, Download, Activity, RotateCcw } from 'lucide-react'

export default function PDFGeneratorDemo() {
  const [htmlContent, setHtmlContent] = useState(`
<h1>Sample PDF Document</h1>
<p>This is a sample HTML content that will be converted to PDF.</p>
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Age</th>
      <th>City</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>30</td>
      <td>New York</td>
    </tr>
    <tr>
      <td>Jane Smith</td>
      <td>25</td>
      <td>Los Angeles</td>
    </tr>
  </tbody>
</table>
  `)

  const [url, setUrl] = useState('')
  const [filename, setFilename] = useState('sample-document.pdf')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mode, setMode] = useState<'html' | 'url'>('html')

  const generatePDF = async () => {
    if (!htmlContent.trim() && !url.trim()) {
      setError('Please provide either HTML content or a URL')
      return
    }

    setIsGenerating(true)
    setError('')
    setSuccess('')

    try {
      const requestBody: PDFGenerationRequest = {
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
      }

      if (mode === 'html') {
        requestBody.html = htmlContent
      } else {
        requestBody.url = url
      }

      const response = await fetch('/api/pdf-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

  const checkServiceStatus = async () => {
    try {
      const response = await fetch('/api/pdf-generator')
      const data = await response.json()
      alert(
        `Service Status: ${data.status}\nBrowser Connected: ${data.browser.connected}\nBrowser Is Connected: ${data.browser.isConnected}`
      )
    } catch (error) {
      console.error('Service status check failed:', error)
      alert('Failed to check service status')
    }
  }

  const restartBrowserService = async () => {
    try {
      setError('')
      const response = await fetch('/api/pdf-generator?action=restart')
      const data = await response.json()
      alert(
        `${data.message}\nNew Status: ${data.status}\nBrowser Connected: ${data.browser.connected}`
      )
    } catch (error) {
      console.error('Browser restart failed:', error)
      alert('Failed to restart browser service')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Generator Service
          </CardTitle>
          <CardDescription>
            Generate PDF documents from HTML content or URLs with customizable options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Generation Mode</label>
            <RadioGroup
              value={mode}
              onValueChange={(value) => setMode(value as 'html' | 'url')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="html" id="html-mode" />
                <label htmlFor="html-mode" className="text-sm">
                  HTML Content
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="url" id="url-mode" />
                <label htmlFor="url-mode" className="text-sm">
                  URL
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* HTML Content Input */}
          {mode === 'html' && (
            <div className="space-y-2">
              <label htmlFor="html-content" className="text-sm font-medium">
                HTML Content
              </label>
              <Textarea
                id="html-content"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Enter your HTML content here..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* URL Input */}
          {mode === 'url' && (
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">
                URL
              </label>
              <Input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          )}

          {/* Filename Input */}
          <div className="space-y-2">
            <label htmlFor="filename" className="text-sm font-medium">
              Filename
            </label>
            <Input
              type="text"
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="document.pdf"
            />
          </div>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              variant="default"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate PDF'}
            </Button>

            <Button
              onClick={checkServiceStatus}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Check Service Status
            </Button>

            <Button
              onClick={restartBrowserService}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restart Browser Service
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage</CardTitle>
          <CardDescription>Examples of how to use the PDF generation API endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium text-sm mb-2">Generate PDF from HTML:</h3>
            <pre className="p-3 bg-muted rounded border overflow-x-auto text-xs">
              {`POST /api/pdf-generator
Content-Type: application/json

{
  "html": "<h1>Hello World</h1>",
  "filename": "document.pdf",
  "options": {
    "format": "A4",
    "printBackground": true
  }
}`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-sm mb-2">Generate PDF from URL:</h3>
            <pre className="p-3 bg-muted rounded border overflow-x-auto text-xs">
              {`POST /api/pdf-generator
Content-Type: application/json

{
  "url": "https://example.com",
  "filename": "webpage.pdf"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
