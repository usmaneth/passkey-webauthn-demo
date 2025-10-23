/**
 * WebAuthn configuration and utilities
 */

import { NextRequest } from "next/server";

// Your site's domain (without protocol)
export const RP_NAME = "Passkey Login Demo";
export const RP_ID = process.env.NEXT_PUBLIC_RP_ID || "localhost";

// Base ORIGIN - will be overridden by getOrigin() if not explicitly set
export const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000";

/**
 * Get the actual origin from the request
 * This allows the same build to work on localhost:3000, localhost:3001, or any deployed URL
 * 
 * @param request - NextRequest object
 * @returns The correct origin (e.g., "http://localhost:3001" or "https://myapp.netlify.app")
 */
export function getOrigin(request: NextRequest): string {
  // If ORIGIN is explicitly set in env, use it
  if (process.env.NEXT_PUBLIC_ORIGIN) {
    return process.env.NEXT_PUBLIC_ORIGIN;
  }

  // Otherwise, detect from request headers
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  
  return `${protocol}://${host}`;
}

/**
 * Generate a random session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert base64url to Uint8Array
 */
export function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binStr = atob(base64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64url
 */
export function uint8ArrayToBase64url(bytes: Uint8Array): string {
  let binStr = '';
  for (let i = 0; i < bytes.length; i++) {
    binStr += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binStr);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

