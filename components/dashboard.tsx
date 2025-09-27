"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Mail,
  LogOut,
  Send,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  User,
} from "lucide-react"
import { makeAuthenticatedRequest, parseEmailList } from "@/lib/gmail-utils"

interface Draft {
  id: string
  subject: string
  snippet: string
}

interface SendingStatus {
  email: string
  status: "pending" | "sending" | "success" | "error"
  error?: string
}

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [selectedDraft, setSelectedDraft] = useState<string>("")
  const [emailList, setEmailList] = useState<string>("")
  const [sendInterval, setSendInterval] = useState<number>(5)
  const [senderName, setSenderName] = useState<string>("")
  const [enableReplyTo, setEnableReplyTo] = useState<boolean>(false)
  const [replyToEmail, setReplyToEmail] = useState<string>("")
  const [noReply, setNoReply] = useState<boolean>(false)
  const [isSending, setIsSending] = useState(false)
  const [sendingStatus, setSendingStatus] = useState<SendingStatus[]>([])
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true)
  const [error, setError] = useState<string>("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadDrafts()
  }, [])

  const loadDrafts = async () => {
    try {
      setIsLoadingDrafts(true)
      setError("")

      const response = await makeAuthenticatedRequest("/api/gmail/drafts")

      if (response.ok) {
        const data = await response.json()
        setDrafts(data.drafts || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to load drafts")
      }
    } catch (error) {
      console.error("Error loading drafts:", error)
      setError("Failed to connect to Gmail. Please try refreshing.")
    } finally {
      setIsLoadingDrafts(false)
    }
  }

  const handleRefreshDrafts = async () => {
    setIsRefreshing(true)
    await loadDrafts()
    setIsRefreshing(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("gmail_access_token")
    localStorage.removeItem("gmail_refresh_token")
    onLogout()
  }

  const handleSendEmails = async () => {
    if (!selectedDraft || !emailList.trim()) {
      setError("Please select a draft and enter email addresses")
      return
    }

    const validEmails = parseEmailList(emailList)

    if (validEmails.length === 0) {
      setError("Please enter valid email addresses (one per line)")
      return
    }

    // Check for invalid emails and show warning
    const allEmails = emailList
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e.length > 0)
    const invalidEmails = allEmails.filter((email) => !validEmails.includes(email))

    if (invalidEmails.length > 0) {
      const proceed = confirm(
        `Found ${invalidEmails.length} invalid email address(es). Continue with ${validEmails.length} valid emails?`,
      )
      if (!proceed) return
    }

    setError("")
    setIsSending(true)
    const initialStatus: SendingStatus[] = validEmails.map((email) => ({
      email,
      status: "pending",
    }))
    setSendingStatus(initialStatus)

    try {
      for (let i = 0; i < validEmails.length; i++) {
        const email = validEmails[i]

        // Update status to sending
        setSendingStatus((prev) => prev.map((item) => (item.email === email ? { ...item, status: "sending" } : item)))

        try {
          const response = await makeAuthenticatedRequest("/api/gmail/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              draftId: selectedDraft,
              to: email,
              senderName: senderName.trim() || undefined,
              replyTo: enableReplyTo && !noReply ? replyToEmail.trim() || undefined : undefined,
              noReply: noReply,
            }),
          })

          if (response.ok) {
            setSendingStatus((prev) =>
              prev.map((item) => (item.email === email ? { ...item, status: "success" } : item)),
            )
          } else {
            const errorData = await response.json()
            setSendingStatus((prev) =>
              prev.map((item) =>
                item.email === email
                  ? {
                      ...item,
                      status: "error",
                      error: errorData.error || "Failed to send",
                    }
                  : item,
              ),
            )
          }
        } catch (error) {
          setSendingStatus((prev) =>
            prev.map((item) =>
              item.email === email
                ? {
                    ...item,
                    status: "error",
                    error: "Network error",
                  }
                : item,
            ),
          )
        }

        // Wait for the specified interval before sending the next email
        if (i < validEmails.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, sendInterval * 1000))
        }
      }
    } catch (error) {
      console.error("Sending error:", error)
      setError("An error occurred while sending emails")
    } finally {
      setIsSending(false)
    }
  }

  const getStats = () => {
    const total = sendingStatus.length
    const success = sendingStatus.filter((s) => s.status === "success").length
    const error = sendingStatus.filter((s) => s.status === "error").length
    const pending = sendingStatus.filter((s) => s.status === "pending").length
    const sending = sendingStatus.filter((s) => s.status === "sending").length

    return { total, success, error, pending, sending }
  }

  const stats = getStats()
  const progress = stats.total > 0 ? ((stats.success + stats.error) / stats.total) * 100 : 0
  const validEmailCount = parseEmailList(emailList).length
  const totalEmailCount = emailList.split("\n").filter((e) => e.trim()).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">Mail Merge</span>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-destructive/50 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sender Configuration Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Sender Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sender-name">From Name (Optional)</Label>
                  <Input
                    id="sender-name"
                    placeholder="Your Name or Company Name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">Display name that recipients will see as the sender</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="no-reply"
                      checked={noReply}
                      onCheckedChange={(checked) => {
                        setNoReply(checked)
                        if (checked) {
                          setEnableReplyTo(false)
                        }
                      }}
                    />
                    <Label htmlFor="no-reply">No Reply</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Prevent recipients from replying to this email</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-reply-to"
                      checked={enableReplyTo}
                      disabled={noReply}
                      onCheckedChange={setEnableReplyTo}
                    />
                    <Label htmlFor="enable-reply-to" className={noReply ? "opacity-50" : ""}>
                      Custom Reply-To Address
                    </Label>
                  </div>

                  {enableReplyTo && !noReply && (
                    <div className="space-y-2">
                      <Input
                        placeholder="reply@yourcompany.com"
                        value={replyToEmail}
                        onChange={(e) => setReplyToEmail(e.target.value)}
                        type="email"
                      />
                      <p className="text-sm text-muted-foreground">
                        Replies will be sent to this address instead of your Gmail
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Email List Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Email Recipients</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {validEmailCount} valid / {totalEmailCount} total
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter email addresses (one per line)&#10;example1@email.com&#10;example2@email.com&#10;example3@email.com"
                  value={emailList}
                  onChange={(e) => setEmailList(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                {totalEmailCount > validEmailCount && (
                  <p className="text-sm text-destructive mt-2">
                    {totalEmailCount - validEmailCount} invalid email address(es) will be skipped
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Draft Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5" />
                    <span>Email Template</span>
                  </div>
                  <Button onClick={handleRefreshDrafts} variant="outline" size="sm" disabled={isRefreshing}>
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingDrafts ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading drafts...</span>
                  </div>
                ) : (
                  <Select value={selectedDraft} onValueChange={setSelectedDraft}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Gmail draft to use as template" />
                    </SelectTrigger>
                    <SelectContent>
                      {drafts.map((draft) => (
                        <SelectItem key={draft.id} value={draft.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{draft.subject || "No Subject"}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {draft.snippet}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {drafts.length === 0 && !isLoadingDrafts && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No drafts found. Create a draft in Gmail to use as a template.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Send Interval */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Send Interval</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={sendInterval.toString()}
                  onValueChange={(value) => setSendInterval(Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="600">10 minutes</SelectItem>
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">Delay between each email to avoid spam filters</p>
              </CardContent>
            </Card>

            {/* Send Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleSendEmails}
                  disabled={!selectedDraft || validEmailCount === 0 || isSending}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending Emails...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send {validEmailCount} Email{validEmailCount !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Progress & Stats */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                  <div className="text-sm text-muted-foreground">Success</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.error}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.pending + stats.sending}</div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            {stats.total > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={progress} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {Math.round(progress)}% complete ({stats.success + stats.error} of {stats.total})
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Live Status */}
            {sendingStatus.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Live Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {sendingStatus.map((status, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 rounded border">
                        <span className="truncate flex-1 mr-2" title={status.email}>
                          {status.email}
                        </span>
                        <div className="flex items-center space-x-1">
                          {status.status === "pending" && <Clock className="w-4 h-4 text-gray-400" />}
                          {status.status === "sending" && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                          {status.status === "success" && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {status.status === "error" && (
                            <XCircle className="w-4 h-4 text-red-500" title={status.error} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
