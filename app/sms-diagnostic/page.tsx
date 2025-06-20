"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Server,
  Globe,
  MessageSquare,
  Settings,
  Lightbulb,
} from "lucide-react"

interface DiagnosticResult {
  step: string
  status: "success" | "failed" | "warning"
  message: string
  details?: any
  suggestion?: string
}

interface DiagnosticData {
  success: boolean
  overallStatus: string
  overallMessage: string
  summary: {
    total: number
    success: number
    warnings: number
    failures: number
    timestamp: string
  }
  results: DiagnosticResult[]
  recommendations: string[]
}

export default function SMSDiagnosticPage() {
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const runDiagnostic = async () => {
    setIsLoading(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 500)

    try {
      const response = await fetch("/api/sms/diagnose")
      const data = await response.json()
      setDiagnosticData(data)
      setProgress(100)
    } catch (error) {
      console.error("Failed to run diagnostic:", error)
      setProgress(100)
    }

    clearInterval(progressInterval)
    setIsLoading(false)
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Success</Badge>
      case "warning":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            Warning
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStepIcon = (step: string) => {
    if (step.includes("Environment")) return <Settings className="h-4 w-4" />
    if (step.includes("DNS")) return <Globe className="h-4 w-4" />
    if (step.includes("Port")) return <Server className="h-4 w-4" />
    if (step.includes("SMS")) return <MessageSquare className="h-4 w-4" />
    return <Search className="h-4 w-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 p-4">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-pink-200 rounded-3xl shadow-xl bg-white">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-3xl text-center p-8">
              <CardTitle className="flex items-center justify-center gap-3 text-pink-800 text-2xl font-bold">
                <Search className="h-8 w-8" />
                SMS Service Diagnostic
              </CardTitle>
              <CardDescription className="text-pink-600 mt-3 text-base">
                Comprehensive analysis of SMS service configuration and connectivity
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Header Controls */}
              <div className="flex justify-between items-center">
                <div>
                  {diagnosticData && (
                    <p className="text-sm text-gray-600">
                      Last run: {new Date(diagnosticData.summary.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button
                  onClick={runDiagnostic}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Run Diagnostic
                </Button>
              </div>

              {/* Progress Bar */}
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Running diagnostic tests...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {diagnosticData && (
                <>
                  {/* Overall Status */}
                  <Alert
                    className={`border-2 ${
                      diagnosticData.overallStatus === "success"
                        ? "border-green-200 bg-green-50"
                        : diagnosticData.overallStatus === "warning"
                          ? "border-yellow-200 bg-yellow-50"
                          : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(diagnosticData.overallStatus)}
                      <AlertTitle
                        className={`font-semibold ${
                          diagnosticData.overallStatus === "success"
                            ? "text-green-800"
                            : diagnosticData.overallStatus === "warning"
                              ? "text-yellow-800"
                              : "text-red-800"
                        }`}
                      >
                        {diagnosticData.overallMessage}
                      </AlertTitle>
                    </div>
                    <AlertDescription
                      className={`mt-2 ${
                        diagnosticData.overallStatus === "success"
                          ? "text-green-700"
                          : diagnosticData.overallStatus === "warning"
                            ? "text-yellow-700"
                            : "text-red-700"
                      }`}
                    >
                      <div className="grid grid-cols-4 gap-4 text-center mt-3">
                        <div>
                          <div className="text-2xl font-bold">{diagnosticData.summary.total}</div>
                          <div className="text-sm">Total Tests</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{diagnosticData.summary.success}</div>
                          <div className="text-sm">Passed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600">{diagnosticData.summary.warnings}</div>
                          <div className="text-sm">Warnings</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{diagnosticData.summary.failures}</div>
                          <div className="text-sm">Failed</div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {/* Test Results */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Diagnostic Results</h3>

                    {diagnosticData.results.map((result, index) => (
                      <Card key={index} className="border rounded-xl overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getStepIcon(result.step)}
                              <span className="font-medium">{result.step}</span>
                            </div>
                            {getStatusBadge(result.status)}
                          </div>

                          <p className="text-sm text-gray-700 mb-2">{result.message}</p>

                          {result.suggestion && (
                            <Alert className="bg-blue-50 border-blue-200 mt-2">
                              <Lightbulb className="h-4 w-4 text-blue-600" />
                              <AlertDescription className="text-blue-700 text-sm">
                                <strong>Suggestion:</strong> {result.suggestion}
                              </AlertDescription>
                            </Alert>
                          )}

                          {result.details && (
                            <details className="mt-3">
                              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                View Details
                              </summary>
                              <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-auto max-h-32">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Recommendations */}
                  {diagnosticData.recommendations.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-yellow-500" />
                          Recommendations
                        </h3>
                        <div className="space-y-2">
                          {diagnosticData.recommendations.map((rec, index) => (
                            <Alert key={index} className="bg-amber-50 border-amber-200">
                              <AlertDescription className="text-amber-800">
                                <strong>{index + 1}.</strong> {rec}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
