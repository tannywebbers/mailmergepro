"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Send, Users, Clock, CheckCircle, ArrowRight } from "lucide-react"
import { Dashboard } from "@/components/dashboard"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem("gmail_access_token")
    if (token) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      const response = await fetch("/api/oauth/auth-url")
      const data = await response.json()

      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        console.error("Failed to get OAuth URL:", data.error)
      }
    } catch (error) {
      console.error("OAuth URL fetch error:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Dashboard onLogout={() => setIsAuthenticated(false)} />
  }

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
            <Button onClick={handleGoogleSignIn} className="bg-primary hover:bg-primary/90">
              Sign in with Google
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground text-balance">
                Email automation
                <span className="text-primary"> made simple</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Send personalized emails at scale using your Gmail drafts. Professional email automation without the
                complexity.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGoogleSignIn}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
              >
                Get started with Gmail
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need for email automation
            </h2>
            <p className="text-xl text-muted-foreground">Simple, powerful tools to streamline your email campaigns</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Gmail Integration</h3>
                <p className="text-muted-foreground text-sm">Use your existing Gmail drafts as email templates</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Bulk Recipients</h3>
                <p className="text-muted-foreground text-sm">Add multiple email addresses with simple copy-paste</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Smart Timing</h3>
                <p className="text-muted-foreground text-sm">Control send intervals to avoid spam filters</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Live Tracking</h3>
                <p className="text-muted-foreground text-sm">Monitor sending progress and success rates in real-time</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How it works</h2>
            <p className="text-xl text-muted-foreground">Get started in minutes with our simple 4-step process</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Connect Gmail</h3>
                  <p className="text-muted-foreground">Sign in with your Google account to access your Gmail drafts</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Choose Template</h3>
                  <p className="text-muted-foreground">Select any Gmail draft to use as your email template</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Add Recipients</h3>
                  <p className="text-muted-foreground">Paste your email list - one email address per line</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Send & Track</h3>
                  <p className="text-muted-foreground">Monitor progress as emails are sent with smart intervals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Ready to automate your emails?</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of professionals who trust Mail Merge for their email campaigns
            </p>
            <Button
              onClick={handleGoogleSignIn}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
            >
              Start sending emails now
              <Send className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-muted-foreground">Mail Merge - Professional Email Automation</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
