"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Phone, Send, MessageSquare, Info } from "lucide-react"

export default function DebugSMSPage() {
  const [phone, setPhone] = useState("01271211171")
  const [customMessage, setCustomMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const sendTestSMS = async (messageType: "verification" | "custom") => {
    setIsLoading(true)
    setResult(null)

    try {
      let endpoint = ""
      let payload: any = {}

      if (messageType === "verification") {
        // Use the verification API
        endpoint = "/api/sms/verify"
        payload = { phone }
      } else {
        // Use the debug API for custom messages
        endpoint = "/api/sms/debug"
        payload = {
          phone,
          message: customMessage || "Test message from CrumbledCookies",
        }
      }

      console.log("📱 Sending request to:", endpoint)
      console.log("📱 Payload:", payload)

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("📱 Response status:", response.status)
      console.log("📱 Response headers:", Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()
      console.log("📱 Response text:", responseText)

      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse response:", parseError)
        responseData = {
          rawResponse: responseText,
          parseError: "Response was not valid JSON",
        }
      }

      setResult({
        success: response.ok,
        status: response.status,
        endpoint: endpoint,
        payload: payload,
        response: responseData,
        messageType: messageType,
      })
    } catch (error) {
      console.error("❌ Request Error:", error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        messageType: messageType,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testSMSService = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      console.log("🧪 Testing SMS service connection...")

      const response = await fetch("/api/sms/debug", {
        method: "GET",
      })

      const responseData = await response.json()

      setResult({
        success: response.ok,
        status: response.status,
        endpoint: "/api/sms/debug",
        response: responseData,
        messageType: "connection_test",
      })
    } catch (error) {
      console.error("❌ Connection Test Error:", error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        messageType: "connection_test",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 p-4">
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-pink-200 rounded-3xl shadow-xl bg-white">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-3xl text-center p-8">
              <CardTitle className="flex items-center justify-center gap-3 text-pink-800 text-2xl font-bold">
                <MessageSquare className="h-8 w-8" />
                SMS Debug Tool
              </CardTitle>
              <p className="text-pink-600 mt-3 text-base">
                Test your SMS service and see exactly what messages are sent
              </p>
            </CardHeader>

            <CardContent className="p-8 space-y-6">
              {/* Phone Number Input */}
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-pink-700 font-semibold text-base">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number (e.g., 01271211171)"
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl h-12 text-base"
                />
              </div>

              {/* Custom Message Input */}
              <div className="space-y-3">
                <Label htmlFor="message" className="text-pink-700 font-semibold text-base">
                  Custom Message (Optional)
                </Label>
                <Input
                  id="message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter custom message to test"
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl h-12 text-base"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    onClick={() => sendTestSMS("verification")}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl h-12 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <Phone className="mr-2 h-4 w-4" />
                    )}
                    Send Verification SMS
                  </Button>
                  <Button
                    onClick={() => sendTestSMS("custom")}
                    disabled={isLoading || !customMessage.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl h-12 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Custom SMS
                  </Button>
                </div>

                <Button
                  onClick={testSMSService}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold rounded-xl h-12 transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Info className="mr-2 h-4 w-4" />
                  )}
                  Test SMS Service Connection
                </Button>
              </div>

              {/* Results */}
              {result && (
                <div className="space-y-4">
                  <Alert
                    className={`rounded-xl ${
                      result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                    }`}
                  >
                    <AlertTitle className={`font-semibold ${result.success ? "text-green-800" : "text-red-800"}`}>
                      {result.success ? "✅ Success!" : "❌ Failed"}
                    </AlertTitle>
                    <AlertDescription className={`mt-2 ${result.success ? "text-green-700" : "text-red-700"}`}>
                      <div className="space-y-2">
                        <p>
                          <strong>Test Type:</strong> {result.messageType}
                        </p>
                        <p>
                          <strong>Status:</strong> {result.status || "Network Error"}
                        </p>
                        <p>
                          <strong>Endpoint:</strong> {result.endpoint}
                        </p>
                        {result.error && (
                          <p>
                            <strong>Error:</strong> {result.error}
                          </p>
                        )}
                        {result.response?.message && (
                          <p>
                            <strong>Message:</strong> {result.response.message}
                          </p>
                        )}
                        {result.response?.code && (
                          <p className="bg-blue-100 p-2 rounded border">
                            <strong>Verification Code:</strong> {result.response.code}
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>

                  {/* Technical Details */}
                  <Alert className="border-gray-200 bg-gray-50 rounded-xl">
                    <AlertTitle className="text-gray-800 font-semibold">Technical Details</AlertTitle>
                    <AlertDescription className="text-gray-700 mt-2">
                      <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-64">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Message Preview */}
              <Alert className="border-purple-200 bg-purple-50 rounded-xl">
                <AlertTitle className="text-purple-800 font-semibold">📱 Verification Message Preview</AlertTitle>
                <AlertDescription className="text-purple-700 mt-2">
                  <div className="bg-white p-4 rounded border font-mono text-sm">
                    "Your CrumbledCookies verification code is: [CODE]. Valid for 10 minutes. Do not share this code
                    with anyone."
                  </div>
                  <p className="mt-2 text-sm">This is the exact message format sent during phone verification.</p>
                </AlertDescription>
              </Alert>

              {/* SMS Service Info */}
              <Alert className="border-blue-200 bg-blue-50 rounded-xl">
                <AlertTitle className="text-blue-800 font-semibold">🔧 SMS Service Configuration</AlertTitle>
                <AlertDescription className="text-blue-700 mt-2">
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Endpoint:</strong> http://3.250.91.63:1880/sendSMS
                    </p>
                    <p>
                      <strong>Sender Name:</strong> Manex
                    </p>
                    <p>
                      <strong>Method:</strong> POST (via Next.js API)
                    </p>
                    <p>
                      <strong>Format:</strong> JSON
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Instructions */}
              <Alert className="border-yellow-200 bg-yellow-50 rounded-xl">
                <AlertTitle className="text-yellow-800 font-semibold">📋 How to Use</AlertTitle>
                <AlertDescription className="text-yellow-700 mt-2">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>First, click "Test SMS Service Connection" to verify your SMS service is working</li>
                    <li>Enter your phone number (Egyptian format: 01271211171)</li>
                    <li>Click "Send Verification SMS" to test the actual verification flow</li>
                    <li>Check your phone for the SMS message</li>
                    <li>Look at the "Technical Details" to see what was sent/received</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
