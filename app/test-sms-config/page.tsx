"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Send, Copy, CheckCircle, XCircle, Server } from "lucide-react"

export default function TestSMSConfigPage() {
  const [phone, setPhone] = useState("01271211171")
  const [message, setMessage] = useState("Test message from CrumbledCookies")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testSMSConfig = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/sms/test-exact-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, message }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to test SMS configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    setIsLoading(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 p-4">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-pink-200 rounded-3xl shadow-xl bg-white">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-3xl text-center p-8">
              <CardTitle className="flex items-center justify-center gap-3 text-pink-800 text-2xl font-bold">
                <Server className="h-8 w-8" />
                Test Your Node-RED SMS Configuration
              </CardTitle>
              <p className="text-pink-600 mt-3 text-base">
                Testing: https://nodered.crumbled-eg.com/sendSMS with sender "Manex"
              </p>
            </CardHeader>

            <CardContent className="p-8 space-y-6">
              {/* Configuration Display */}
              <Alert className="border-blue-200 bg-blue-50">
                <Server className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Current Configuration</AlertTitle>
                <AlertDescription className="text-blue-700 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>SMS URL:</strong> https://nodered.crumbled-eg.com/sendSMS
                    </div>
                    <div>
                      <strong>Sender Name:</strong> Manex
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Test Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-pink-700 font-semibold">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01271211171"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-pink-700 font-semibold">
                    Test Message
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your test message"
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={testSMSConfig}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl h-12"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Test Node-RED SMS Configuration
                </Button>
              </div>

              {/* Results */}
              {result && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">Test Results</h3>
                    {result.success ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                  </div>

                  <Alert className={`${result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                    <div className="space-y-3">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <strong>Status:</strong> {result.status || "N/A"}
                        </div>
                        <div>
                          <strong>Response Time:</strong> {result.responseTime || "N/A"}
                        </div>
                        <div>
                          <strong>Endpoint:</strong> Node-RED
                        </div>
                        <div>
                          <strong>Success:</strong> {result.success ? "Yes" : "No"}
                        </div>
                      </div>

                      {/* Error Details */}
                      {!result.success && result.error && (
                        <Alert className="bg-red-100 border-red-300">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <AlertTitle className="text-red-800">Error Details</AlertTitle>
                          <AlertDescription className="text-red-700">
                            <strong>Error:</strong> {result.error}
                            {result.errorType && (
                              <div className="mt-1">
                                <strong>Type:</strong> {result.errorType}
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Troubleshooting */}
                      {result.troubleshooting && (
                        <Alert className="bg-yellow-50 border-yellow-300">
                          <AlertTitle className="text-yellow-800">Troubleshooting</AlertTitle>
                          <AlertDescription className="text-yellow-700">
                            <div className="space-y-2">
                              <div>
                                <strong>Possible Causes:</strong>
                                <ul className="list-disc list-inside ml-2 text-sm">
                                  {result.troubleshooting.possibleCauses.map((cause: string, index: number) => (
                                    <li key={index}>{cause}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <strong>Next Steps:</strong>
                                <ul className="list-disc list-inside ml-2 text-sm">
                                  {result.troubleshooting.nextSteps.map((step: string, index: number) => (
                                    <li key={index}>{step}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Curl Command */}
                      {result.curlCommand && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <strong className="text-sm">Test with curl:</strong>
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.curlCommand)}>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <pre className="text-xs bg-gray-100 p-3 rounded border overflow-auto">
                            {result.curlCommand}
                          </pre>
                        </div>
                      )}

                      {/* Raw Response */}
                      <details className="cursor-pointer">
                        <summary className="text-sm font-medium">View Raw Response</summary>
                        <pre className="text-xs bg-gray-50 p-3 rounded mt-2 overflow-auto max-h-40">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
