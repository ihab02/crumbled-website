"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, MessageSquare } from "lucide-react"

export default function SMSStatusPage() {
  const [connectivityData, setConnectivityData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const checkConnectivity = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/sms/connectivity-test")
      const data = await response.json()
      setConnectivityData(data)
      setLastUpdated(new Date().toLocaleString())
    } catch (error) {
      console.error("Failed to check connectivity:", error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    checkConnectivity()
  }, [])

  const getStatusIcon = (result: any) => {
    if (!result.reachable) return <XCircle className="h-4 w-4 text-red-500" />
    if (result.status === 200) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  }

  const getStatusBadge = (result: any) => {
    if (!result.reachable) return <Badge variant="destructive">Unreachable</Badge>
    if (result.status === 200)
      return (
        <Badge variant="default" className="bg-green-500">
          OK
        </Badge>
      )
    if (result.status >= 400) return <Badge variant="destructive">Error</Badge>
    return <Badge variant="secondary">Unknown</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 p-4">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-pink-200 rounded-3xl shadow-xl bg-white">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-3xl text-center p-8">
              <CardTitle className="flex items-center justify-center gap-3 text-pink-800 text-2xl font-bold">
                <MessageSquare className="h-8 w-8" />
                SMS Service Status
              </CardTitle>
              <p className="text-pink-600 mt-3 text-base">Real-time connectivity status for SMS endpoints</p>
            </CardHeader>

            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div>{lastUpdated && <p className="text-sm text-gray-600">Last updated: {lastUpdated}</p>}</div>
                <Button
                  onClick={checkConnectivity}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh Status
                </Button>
              </div>

              {connectivityData && (
                <>
                  {/* Summary */}
                  <Alert className="border-blue-200 bg-blue-50 rounded-xl">
                    <AlertTitle className="text-blue-800 font-semibold">Connectivity Summary</AlertTitle>
                    <AlertDescription className="text-blue-700 mt-2">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">{connectivityData.summary.reachable}</div>
                          <div className="text-sm">Reachable</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{connectivityData.summary.unreachable}</div>
                          <div className="text-sm">Unreachable</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{connectivityData.summary.totalTested}</div>
                          <div className="text-sm">Total Tested</div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {/* Endpoint Results */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Endpoint Test Results:</h3>
                    {connectivityData.results.map((result: any, index: number) => (
                      <Card key={index} className="border rounded-xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(result)}
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">{result.endpoint}</code>
                            </div>
                            {getStatusBadge(result)}
                          </div>

                          {result.reachable ? (
                            <div className="space-y-2 text-sm">
                              <div>
                                <strong>Status:</strong> {result.status} {result.statusText}
                              </div>
                              {result.response && (
                                <div>
                                  <strong>Response:</strong>
                                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                                    {result.response}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-red-600">
                              <strong>Error:</strong> {result.error}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* Current Workaround */}
              <Alert className="border-green-200 bg-green-50 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800 font-semibold">Current Status: Working</AlertTitle>
                <AlertDescription className="text-green-700 mt-2">
                  <p className="mb-2">
                    <strong>✅ Verification System:</strong> Fully functional - codes are generated and displayed
                  </p>
                  <p className="mb-2">
                    <strong>📱 SMS Delivery:</strong> Currently showing codes on screen due to SMS service connectivity
                  </p>
                  <p>
                    <strong>🔧 Workaround:</strong> Users can complete verification using the displayed code
                  </p>
                </AlertDescription>
              </Alert>

              {/* Next Steps */}
              <Alert className="border-yellow-200 bg-yellow-50 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <AlertTitle className="text-yellow-800 font-semibold">Next Steps</AlertTitle>
                <AlertDescription className="text-yellow-700 mt-2">
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>1. Check Network:</strong> Verify your server can reach 3.250.91.63
                    </p>
                    <p>
                      <strong>2. Contact SMS Provider:</strong> Confirm the correct endpoint and credentials
                    </p>
                    <p>
                      <strong>3. Test Locally:</strong> Try the curl command from your server directly
                    </p>
                    <p>
                      <strong>4. Alternative Provider:</strong> Consider using a different SMS service
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
