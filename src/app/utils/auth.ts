"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"

export interface DecodedToken {
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"?: string
  userType?: string
  role?: string
  exp?: number
  [key: string]: any
}

export function isAuthValid(): boolean {
  try {
    if (typeof window === "undefined") return false
    const token = localStorage.getItem("accessToken")
    const expiresAt = localStorage.getItem("expiresAt")

    if (!token || !expiresAt) return false

    let exp = Number(expiresAt)
    if (Number.isNaN(exp)) {
      const parsed = Date.parse(expiresAt)
      if (Number.isNaN(parsed)) return false
      exp = parsed
    }

    if (exp > 0 && exp < 1e12) {
      exp = exp * 1000
    }

    return Date.now() < exp
  } catch (err) {
    console.warn("isAuthValid check failed", err)
    return false
  }
}

export function getUserType(): string | null {
  try {
    if (typeof window === "undefined") return null
    const token = localStorage.getItem("accessToken")
    if (!token) return null

    const decoded = jwtDecode<DecodedToken>(token)
    return decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.userType || decoded.role || null
    
  } catch (err) {
    console.warn("Failed to decode token", err)
    return null
  }
}

export function getUserName(): string | null {
  try {
    if (typeof window === "undefined") return null
    const token = localStorage.getItem("accessToken")
    if (!token) return null

    const decoded = jwtDecode<DecodedToken>(token)
    return decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || null
    
  } catch (err) {
    console.warn("Failed to decode token", err)
    return null
  }
}

export function getUserId(): string | null {
  try {
    if (typeof window === "undefined") return null
    const token = localStorage.getItem("accessToken")
    if (!token) return null

    const decoded = jwtDecode<DecodedToken>(token)
    return decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || null
    
  } catch (err) {
    console.warn("Failed to decode token", err)
    return null
  }
}

export function isUserType(type: string): boolean {
  const userType = getUserType()
  return userType?.toLowerCase() === type.toLowerCase()
}

export function useUserType() {
  const [userType, setUserType] = useState<string | null>(null)

  useEffect(() => {
    setUserType(getUserType())
  }, [])

  return userType
}

export function useUserName() {
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    setUserName(getUserName())
  }, [])

  return userName
}

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setUserId(getUserId())
  }, [])

  return userId
}

export function useAuthGuard() {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthValid()) {
      router.push("/auth/login")
    }
  }, [])
}
