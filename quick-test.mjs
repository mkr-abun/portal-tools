#!/usr/bin/env node

async function testPDFGeneration() {
  console.log('🧪 Testing improved PDF service...\n')

  try {
    // Test simple HTML to PDF
    const response = await fetch('http://localhost:3000/api/pdf-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: '<h1>Test PDF</h1><p>This is a simple test to verify the PDF service is working.</p>',
        filename: 'test.pdf',
      }),
    })

    if (response.ok) {
      const buffer = await response.arrayBuffer()
      console.log('✅ PDF generated successfully!')
      console.log(`📄 PDF size: ${buffer.byteLength} bytes`)
    } else {
      const errorText = await response.text()
      console.log('❌ PDF generation failed:', errorText)
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

testPDFGeneration()
