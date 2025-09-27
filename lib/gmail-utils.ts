export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem("gmail_refresh_token")
    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    const response = await fetch("/api/oauth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      throw new Error("Failed to refresh token")
    }

    const data = await response.json()

    if (data.access_token) {
      localStorage.setItem("gmail_access_token", data.access_token)
      return data.access_token
    }

    throw new Error("No access token in response")
  } catch (error) {
    console.error("Token refresh failed:", error)
    // Clear tokens and redirect to login
    localStorage.removeItem("gmail_access_token")
    localStorage.removeItem("gmail_refresh_token")
    window.location.href = "/"
    return null
  }
}

export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem("gmail_access_token")

  if (!token) {
    throw new Error("No access token available")
  }

  // Add authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  }

  let response = await fetch(url, { ...options, headers })

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      const newHeaders = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      }
      response = await fetch(url, { ...options, headers: newHeaders })
    }
  }

  return response
}

export const validateEmailAddress = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

export const parseEmailList = (emailText: string): string[] => {
  return emailText
    .split("\n")
    .map((email) => email.trim())
    .filter((email) => email.length > 0 && validateEmailAddress(email))
}
