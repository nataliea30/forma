"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ApiTestPage() {
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const testApi = async () => {
    setLoading(true)
    setResult("Testing API connection...")
    
    try {
      const response = await fetch("http://localhost:3001/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "provider@demo.com",
          password: "password123"
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult(`✅ API Test Successful!\n\nResponse: ${JSON.stringify(data, null, 2)}`)
      } else {
        setResult(`❌ API Test Failed!\n\nStatus: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ Network Error!\n\nError: ${error}`)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
          <p className="text-gray-600 mb-6">
            This page tests the direct connection between frontend and backend API.
          </p>
          
          <Button 
            onClick={testApi} 
            disabled={loading}
            className="mb-4"
          >
            {loading ? "Testing..." : "Test API Connection"}
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Demo Credentials:</h3>
            <p className="text-sm">
              <strong>Provider:</strong> provider@demo.com / password123<br/>
              <strong>Patient:</strong> patient@demo.com / password123
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
