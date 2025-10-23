/**
 * Simple in-memory database for demo purposes
 * Uses global reference to survive Next.js hot-reloading in development
 * In production, use a real database like PostgreSQL, MongoDB, etc.
 */

import type {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
} from "@simplewebauthn/server/script/deps";

export interface User {
  id: string;
  username: string;
  credentials: Authenticator[];
}

export interface Authenticator {
  credentialID: Uint8Array;
  credentialPublicKey: Uint8Array;
  counter: number;
  credentialDeviceType: CredentialDeviceType;
  credentialBackedUp: boolean;
  transports?: AuthenticatorTransportFuture[];
}

export interface Challenge {
  challenge: string;
  username?: string;
  timestamp: number;
}

// Use global namespace to preserve state across hot-reloads in development
declare global {
  var dbInstance: {
    users: User[];
    challenges: Map<string, Challenge>;
  };
}

// Initialize global database if it doesn't exist
if (!global.dbInstance) {
  global.dbInstance = {
    users: [],
    challenges: new Map(),
  };
}

// Challenge expiration time (5 minutes)
const CHALLENGE_TIMEOUT = 5 * 60 * 1000;

/**
 * Clean up expired challenges
 */
function cleanupExpiredChallenges() {
  const now = Date.now();
  for (const [key, challenge] of global.dbInstance.challenges.entries()) {
    if (now - challenge.timestamp > CHALLENGE_TIMEOUT) {
      global.dbInstance.challenges.delete(key);
    }
  }
}

export const db = {
  // User operations
  findUserByUsername(username: string): User | undefined {
    return global.dbInstance.users.find((user) => user.username === username);
  },

  findUserById(id: string): User | undefined {
    return global.dbInstance.users.find((user) => user.id === id);
  },

  createUser(username: string): User {
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username,
      credentials: [],
    };
    global.dbInstance.users.push(user);
    return user;
  },

  addCredentialToUser(userId: string, credential: Authenticator): void {
    const user = this.findUserById(userId);
    if (user) {
      user.credentials.push(credential);
    }
  },

  updateCredentialCounter(userId: string, credentialID: Uint8Array, newCounter: number): void {
    const user = this.findUserById(userId);
    if (user) {
      const credential = user.credentials.find((c) =>
        this.areBuffersEqual(c.credentialID, credentialID)
      );
      if (credential) {
        credential.counter = newCounter;
      }
    }
  },

  // Challenge operations
  saveChallenge(sessionId: string, challenge: string, username?: string): void {
    cleanupExpiredChallenges();
    global.dbInstance.challenges.set(sessionId, {
      challenge,
      username,
      timestamp: Date.now(),
    });
    console.log("💾 [DB] Saved challenge to global database:", sessionId);
  },

  getChallenge(sessionId: string): Challenge | undefined {
    cleanupExpiredChallenges();
    const challenge = global.dbInstance.challenges.get(sessionId);
    console.log("📖 [DB] Retrieved challenge from global database:", sessionId, challenge ? "FOUND" : "NOT FOUND");
    return challenge;
  },

  deleteChallenge(sessionId: string): void {
    global.dbInstance.challenges.delete(sessionId);
    console.log("🗑️  [DB] Deleted challenge from global database:", sessionId);
  },

  // Helper function
  areBuffersEqual(buf1: Uint8Array, buf2: Uint8Array): boolean {
    if (buf1.length !== buf2.length) return false;
    for (let i = 0; i < buf1.length; i++) {
      if (buf1[i] !== buf2[i]) return false;
    }
    return true;
  },

  // For demo purposes - get all users (don't do this in production!)
  getAllUsers(): User[] {
    return global.dbInstance.users;
  },
};

