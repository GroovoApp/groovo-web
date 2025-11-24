"use client";

import { ReactNode } from "react";
import { useUserType } from "@/src/app/utils/auth";

interface UserTypeGuardProps {
  allowedTypes: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user type.
 * 
 * @param allowedTypes - Array of user types that are allowed to see the content
 * @param children - Content to show if user type matches
 * @param fallback - Optional content to show if user type doesn't match
 * 
 * @example
 * <UserTypeGuard allowedTypes={["artist"]}>
 *   <UploadButton />
 * </UserTypeGuard>
 */
export default function UserTypeGuard({ 
  allowedTypes, 
  children, 
  fallback = null 
}: UserTypeGuardProps) {
  const userType = useUserType();

  if (!userType) return <>{fallback}</>;

  const isAllowed = allowedTypes.some(
    type => type.toLowerCase() === userType.toLowerCase()
  );

  return isAllowed ? <>{children}</> : <>{fallback}</>;
}
