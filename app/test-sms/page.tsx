"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestSMSPage() {
  const [phone, setPhone] = useState("01271211171")
  const [message, setMessage] = useState("Test message from CrumbledCookies")
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testSMS = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/sms/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/sms/debug", {
        method: "GET",
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-pink-200 rounded-3xl shadow-xl">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-3xl">
            <CardTitle className="text-pink-800 text-2xl">SMS Service Test</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01271211171"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Test message"
                className="mt-2"
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={testSMS} disabled={isLoading} className="flex-1">
                {isLoading ? "Sending..." : "Send Test SMS"}
              </Button>
              <Button onClick={testConnection} disabled={isLoading} variant="outline" className="flex-1">
                {isLoading ? "Testing..." : "Test Connection"}
              </Button>
            </div>

            {result && (
              <Alert className="mt-6">
                <AlertDescription>
                  <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
