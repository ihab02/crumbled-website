"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertTriangle, MessageSquare, Send, Code, Server, Globe } from "lucide-react"

export default function SMSToolkitPage() {
  const [phone, setPhone] = useState("01271211171")
  const [message, setMessage] = useState("This is a test message from CrumbledCookies")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [connectivityData, setConnectivityData] = useState<any>(null)
  const [connectivityLoading, setConnectivityLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("send")

  const sendTestSMS = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/sms/debug", {
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
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
    setLoading(false)
  }

  const checkConnectivity = async () => {
    setConnectivityLoading(true)
    try {
      const response = await fetch("/api/sms/connectivity-test")
      const data = await response.json()
      setConnectivityData(data)
    } catch (error) {
      console.error("Failed to check connectivity:", error)
    }
    setConnectivityLoading(false)
  }

  const generateCurlCommand = () => {
    return `curl -X POST "http://3.250.91.63:1880/sendSMS" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{
    "senderName": "Manex",
    "recipients": "${formatPhoneForDisplay(phone)}",
    "messageText": "${message}"
  }'`
  }

  const formatPhoneForDisplay = (phoneNumber: string) => {
    // Clean the phone number
    let cleaned = phoneNumber.replace(/[^\d+]/g, "")

    // Handle country code
    if (cleaned.startsWith("+20")) {
      cleaned = cleaned.substring(3)
    } else if (cleaned.startsWith("20")) {
      cleaned = cleaned.substring(2)
    }

    // Ensure it starts with 0
    if (!cleaned.startsWith("0")) {
      cleaned = "0" + cleaned
    }

    return cleaned
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 p-4">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-pink-200 rounded-3xl shadow-xl bg-white">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-3xl text-center p-8">
              <CardTitle className="flex items-center justify-center gap-3 text-pink-800 text-2xl font-bold">
                <MessageSquare className="h-8 w-8" />
                SMS Testing Toolkit
              </CardTitle>
              <CardDescription className="text-pink-600 mt-3 text-base">
                Comprehensive tools for testing and debugging SMS functionality
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="send" className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send Test SMS
                  </TabsTrigger>
                  <TabsTrigger value="connectivity" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Check Connectivity
                  </TabsTrigger>
                  <TabsTrigger value="curl" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Curl Command
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="send" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="border-gray-300"
                      />
                      <p className="text-xs text-gray-500 mt-1">Will be formatted to: {formatPhoneForDisplay(phone)}</p>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter message"
                        rows={3}
                        className="border-gray-300"
                      />
                    </div>

                    <Button
                      onClick={sendTestSMS}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send Test SMS
                    </Button>
                  </div>

                  {result && (
                    <div className="mt-6 space-y-4">
                      <Separator />
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        Result
                      </h3>

                      <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={result.success ? "default" : "destructive"}
                            className={result.success ? "bg-green-500" : ""}
                          >
                            {result.success ? "Success" : "Failed"}
                          </Badge>
                          <span className="text-sm text-gray-500">{new Date().toLocaleTimeString()}</span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <strong>Message:</strong> {result.message}
                          </div>
                          {result.endpoint && (
                            <div>
                              <strong>Endpoint:</strong> {result.endpoint}
                            </div>
                          )}
                          {result.error && (
                            <div className="text-red-600">
                              <strong>Error:</strong> {result.error}
                            </div>
                          )}
                        </div>

                        {result.rawResponse && (
                          <div className="mt-3">
                            <strong className="text-sm">Raw Response:</strong>
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-40">
                              {JSON.stringify(result.rawResponse, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="connectivity" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">SMS Endpoint Connectivity</h3>
                    <Button
                      onClick={checkConnectivity}
                      disabled={connectivityLoading}
                      variant="outline"
                      className="border-pink-200 text-pink-700 hover:bg-pink-50"
                    >
                      {connectivityLoading ? (
                        <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <Globe className="mr-2 h-4 w-4" />
                      )}
                      Check Connectivity
                    </Button>
                  </div>

                  {!connectivityData && !connectivityLoading && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertTitle className="text-blue-800">No connectivity data</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        Click the "Check Connectivity" button to test SMS endpoints.
                      </AlertDescription>
                    </Alert>
                  )}

                  {connectivityLoading && (
                    <div className="flex justify-center items-center p-8">
                      <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-3 text-pink-700">Testing connectivity...</span>
                    </div>
                  )}

                  {connectivityData && (
                    <>
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertTitle className="text-blue-800 font-semibold">Connectivity Summary</AlertTitle>
                        <AlertDescription className="text-blue-700 mt-2">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                {connectivityData.summary.reachable}
                              </div>
                              <div className="text-sm">Reachable</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-red-600">
                                {connectivityData.summary.unreachable}
                              </div>
                              <div className="text-sm">Unreachable</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-blue-600">
                                {connectivityData.summary.totalTested}
                              </div>
                              <div className="text-sm">Total Tested</div>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-3 mt-4">
                        {connectivityData.results.map((result: any, index: number) => (
                          <Card key={index} className="border rounded-lg overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {result.reachable ? (
                                    result.status === 200 ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                    )
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{result.endpoint}</code>
                                </div>
                                {result.reachable ? (
                                  result.status === 200 ? (
                                    <Badge className="bg-green-500">OK</Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                                      {result.status}
                                    </Badge>
                                  )
                                ) : (
                                  <Badge variant="destructive">Failed</Badge>
                                )}
                              </div>

                              {result.reachable ? (
                                <div className="text-xs text-gray-600 mt-1">
                                  {result.response && (
                                    <div className="mt-1">
                                      <strong>Response:</strong>
                                      <pre className="text-xs bg-gray-50 p-1 rounded mt-1 overflow-auto max-h-20">
                                        {result.response}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-red-600 mt-1">{result.error}</div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="curl" className="space-y-4">
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTitle className="text-amber-800">Test with curl</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      Run this command on your server to test SMS connectivity directly.
                    </AlertDescription>
                  </Alert>

                  <div className="rounded-lg border bg-gray-900 p-4">
                    <pre className="text-xs text-gray-100 overflow-auto whitespace-pre-wrap">
                      {generateCurlCommand()}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Alternative Endpoints</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <code className="text-xs bg-gray-100 p-2 rounded">http://3.250.91.63:1880/sendSMS</code>
                      <code className="text-xs bg-gray-100 p-2 rounded">http://3.250.91.63/sendSMS</code>
                      <code className="text-xs bg-gray-100 p-2 rounded">https://3.250.91.63:1880/sendSMS</code>
                      <code className="text-xs bg-gray-100 p-2 rounded">https://3.250.91.63/sendSMS</code>
                    </div>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertTitle className="text-blue-800">Troubleshooting Tips</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                        <li>Check if your server can reach the SMS endpoint IP (3.250.91.63)</li>
                        <li>Verify firewall rules allow outbound connections to the SMS service</li>
                        <li>Try both HTTP and HTTPS protocols</li>
                        <li>Check if the SMS service requires authentication</li>
                        <li>Verify the correct port is being used (1880 or default 80/443)</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="bg-gray-50 p-6 rounded-b-3xl border-t border-gray-100">
              <div className="w-full text-center text-gray-500 text-sm">
                <p>
                  SMS verification will continue to work with displayed codes while you resolve connectivity issues.
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
