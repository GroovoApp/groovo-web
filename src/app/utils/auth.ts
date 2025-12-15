"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { fetchUserInfo } from "./api"

export interface DecodedToken {
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"?: string
  userType?: string
  role?: string
  id?: string
  name?: string
  email?: string
  exp?: number
  [key: string]: any
}

export function isAuthValid(): boolean {
  try {
    if (typeof window === "undefined") return false
    const token = localStorage.getItem("accessToken")
    if (!token) return false

    let expiresAt = localStorage.getItem("expiresAt")
    const now = Date.now()

    // If an expiresAt is stored, prefer that.
    if (expiresAt) {
      let exp = Number(expiresAt)
      if (Number.isNaN(exp)) {
        const parsed = Date.parse(expiresAt)
        if (!Number.isNaN(parsed)) exp = parsed
        else exp = NaN
      }

      if (!Number.isNaN(exp)) {
        if (exp > 0 && exp < 1e12) exp = exp * 1000
        return now < exp
      }
    }
    return true
  } catch (err) {
    return false
  }
}

export async function getUserType(): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null
    
    const userData = await fetchUserInfo()
    const raw = userData?.data?.role;
    if (!raw) return null
    const s = Number(raw);
    return s === 1 ? 'artist' : 'user';
  } catch (err) {
    console.warn("Failed to fetch user type from API", err)
    return null
  }
}

export async function getUserName(): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null
    
    const userData = await fetchUserInfo()
    return userData?.name || null
  } catch (err) {
    console.warn("Failed to fetch user name from API", err)
    return null
  }
}

export async function getUserId(): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null
    
    const userData = await fetchUserInfo()
    return userData?.id || null
  } catch (err) {
    console.warn("Failed to fetch user ID from API", err)
    return null
  }
}

export function useUserType() {
  const [userType, setUserType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        setLoading(true)
        const type = await getUserType()
        setUserType(type)
      } catch (err) {
        console.warn("Failed to fetch user type", err)
        setUserType(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserType()
  }, [])

  return userType
}

export function useUserName() {
  const [userName, setUserName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        setLoading(true)
        const name = await getUserName()
        setUserName(name)
      } catch (err) {
        console.warn("Failed to fetch user name", err)
        setUserName(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserName()
  }, [])

  return userName
}

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        setLoading(true)
        const id = await getUserId()
        setUserId(id)
      } catch (err) {
        console.warn("Failed to fetch user ID", err)
        setUserId(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserId()
  }, [])

  return userId
}

export function useAuthGuard() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!isAuthValid()) {
      //router.push("/auth/login")
    } else {
      setIsChecking(false)
    }
  }, [router])

  return isChecking
}

// Route-based guard: redirect if current pathname doesn't start with `prefix`.
// Useful for internal areas (e.g. `/artist`) where pages should be accessible
// only under that route, without relying on userType checks.
export function useRouteRedirect(prefix: string, fallback: string = "/") {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!pathname) return
    if (!pathname.startsWith(prefix)) {
      router.push(fallback)
    } else {
      setIsChecking(false)
    }
  }, [pathname, prefix, fallback, router])

  return isChecking
}
