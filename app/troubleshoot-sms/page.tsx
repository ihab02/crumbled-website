"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Send, MessageSquare, Info, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function TroubleshootSMSPage() {
  const [phone, setPhone] = useState("01271211171")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const addResult = (step: string, success: boolean, data: any) => {
    setResults((prev) => [...prev, { step, success, data, timestamp: new Date().toISOString() }])
  }

  const clearResults = () => {
    setResults([])
  }

  const runFullDiagnostic = async () => {
    setIsLoading(true)
    clearResults()

    // Step 1: Test environment variables
    try {
      console.log("🔧 Step 1: Testing environment variables...")
      const envResponse = await fetch("/api/sms/debug", { method: "GET" })
      const envData = await envResponse.json()
      addResult("Environment Variables", envResponse.ok, envData)
    } catch (error) {
      addResult("Environment Variables", false, { error: error instanceof Error ? error.message : "Unknown error" })
    }

    // Step 2: Test direct SMS service connection
    try {
      console.log("🔧 Step 2: Testing SMS service connection...")
      const testResponse = await fetch("/api/sms/test-connection", { method: "POST" })
      const testData = await testResponse.json()
      addResult("SMS Service Connection", testResponse.ok, testData)
    } catch (error) {
      addResult("SMS Service Connection", false, { error: error instanceof Error ? error.message : "Unknown error" })
    }

    // Step 3: Test phone number formatting
    try {
      console.log("🔧 Step 3: Testing phone number formatting...")
      const formatResponse = await fetch("/api/sms/format-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const formatData = await formatResponse.json()
      addResult("Phone Number Formatting", formatResponse.ok, formatData)
    } catch (error) {
      addResult("Phone Number Formatting", false, { error: error instanceof Error ? error.message : "Unknown error" })
    }

    // Step 4: Test verification code generation
    try {
      console.log("🔧 Step 4: Testing verification code generation...")
      const verifyResponse = await fetch("/api/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const verifyData = await verifyResponse.json()
      addResult("Verification Code Generation", verifyResponse.ok, verifyData)
    } catch (error) {
      addResult("Verification Code Generation", false, {
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Step 5: Test custom message sending
    try {
      console.log("🔧 Step 5: Testing custom message sending...")
      const customResponse = await fetch("/api/sms/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          message: "Test message from CrumbledCookies troubleshooting tool",
        }),
      })
      const customData = await customResponse.json()
      addResult("Custom Message Sending", customResponse.ok, customData)
    } catch (error) {
      addResult("Custom Message Sending", false, { error: error instanceof Error ? error.message : "Unknown error" })
    }

    setIsLoading(false)
  }

  const testSingleStep = async (stepName: string) => {
    setIsLoading(true)

    try {
      let response, data

      switch (stepName) {
        case "env":
          response = await fetch("/api/sms/debug", { method: "GET" })
          data = await response.json()
          addResult("Environment Check", response.ok, data)
          break

        case "connection":
          response = await fetch("/api/sms/test-connection", { method: "POST" })
          data = await response.json()
          addResult("Connection Test", response.ok, data)
          break

        case "verify":
          response = await fetch("/api/sms/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone }),
          })
          data = await response.json()
          addResult("Send Verification", response.ok, data)
          break
      }
    } catch (error) {
      addResult(stepName, false, { error: error instanceof Error ? error.message : "Unknown error" })
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 p-4">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-pink-200 rounded-3xl shadow-xl bg-white">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-3xl text-center p-8">
              <CardTitle className="flex items-center justify-center gap-3 text-pink-800 text-2xl font-bold">
                <MessageSquare className="h-8 w-8" />
                SMS Troubleshooting Tool
              </CardTitle>
              <p className="text-pink-600 mt-3 text-base">
                Comprehensive diagnostics to find out why SMS messages aren't being received
              </p>
            </CardHeader>

            <CardContent className="p-8 space-y-6">
              {/* Phone Number Input */}
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-pink-700 font-semibold text-base">
                  Your Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number (e.g., 01271211171)"
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl h-12 text-base"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  onClick={runFullDiagnostic}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl h-12 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <MessageSquare className="mr-2 h-4 w-4" />
                  )}
                  Run Full SMS Diagnostic
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => testSingleStep("env")}
                    disabled={isLoading}
                    variant="outline"
                    className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold rounded-xl h-12"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    Check Config
                  </Button>
                  <Button
                    onClick={() => testSingleStep("connection")}
                    disabled={isLoading}
                    variant="outline"
                    className="border-2 border-green-200 text-green-700 hover:bg-green-50 font-semibold rounded-xl h-12"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Test Connection
                  </Button>
                  <Button
                    onClick={() => testSingleStep("verify")}
                    disabled={isLoading}
                    variant="outline"
                    className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold rounded-xl h-12"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Test SMS
                  </Button>
                </div>

                <Button
                  onClick={clearResults}
                  variant="outline"
                  className="w-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl h-10"
                >
                  Clear Results
                </Button>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Diagnostic Results:</h3>
                  {results.map((result, index) => (
                    <Alert
                      key={index}
                      className={`rounded-xl ${
                        result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <AlertTitle className={`font-semibold ${result.success ? "text-green-800" : "text-red-800"}`}>
                          {result.step} - {result.success ? "Success" : "Failed"}
                        </AlertTitle>
                      </div>
                      <AlertDescription className={`mt-2 ${result.success ? "text-green-700" : "text-red-700"}`}>
                        <details className="cursor-pointer">
                          <summary className="font-medium mb-2">
                            {result.success ? "✅ Test passed" : "❌ Test failed"} - Click to view details
                          </summary>
                          <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-40">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Common Issues */}
              <Alert className="border-yellow-200 bg-yellow-50 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <AlertTitle className="text-yellow-800 font-semibold">Common Issues & Solutions</AlertTitle>
                <AlertDescription className="text-yellow-700 mt-2">
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>1. SMS Service Protocol:</strong> Now using HTTP first (http://3.250.91.63:1880)
                    </p>
                    <p>
                      <strong>2. Wrong Phone Format:</strong> Ensure your number is in Egyptian format (01xxxxxxxxx)
                    </p>
                    <p>
                      <strong>3. Network Issues:</strong> Check your internet connection and firewall settings
                    </p>
                    <p>
                      <strong>4. SMS Provider Issues:</strong> The SMS gateway might be experiencing problems
                    </p>
                    <p>
                      <strong>5. Phone Number Issues:</strong> Verify your phone number is correct and active
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Expected Curl Command */}
              <Alert className="border-blue-200 bg-blue-50 rounded-xl">
                <AlertTitle className="text-blue-800 font-semibold">Expected SMS Request (HTTP)</AlertTitle>
                <AlertDescription className="text-blue-700 mt-2">
                  <p className="mb-2">This is the exact curl command being sent to your SMS service:</p>
                  <pre className="text-xs bg-white p-3 rounded border overflow-auto">
                    {`curl -X POST "http://3.250.91.63:1880/sendSMS" \\
-H "Content-Type: application/json" \\
-H "Accept: application/json" \\
-d '{
  "senderName": "Manex",
  "recipients": "${phone.replace(/[^\d+]/g, "").replace(/^(\+?20)?0?/, "0")}",
  "messageText": "Your CrumbledCookies verification code is: 123456. Valid for 10 minutes. Do not share this code with anyone."
}'`}
                  </pre>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
