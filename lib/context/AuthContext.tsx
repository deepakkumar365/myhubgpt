"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import CryptoJS from "crypto-js";
import { useMemo } from "react";
// Removed direct import of server-only functions
interface User {
  username: string;
  email?: string;
}

interface AuthContextType {
  userInfo: any;
  updateUser: Function;
  reloadAllTabs: Function;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const BROADCAST_CHANNEL = "UserInfo";

const APP_CONSTANT = {
  Crypto: {
    key: CryptoJS.enc.Utf8.parse("2b7e151628aed2a6abf7158809cf4f3c"), // replace with 32-byte key
    iv: CryptoJS.enc.Utf8.parse("3ad77bb40d7a3660a89ecaf32466ef97"),   // replace with 16-byte IV
  },
};

// Allowed origins
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_EMBEDDED_URL || 'http://10.8.0.238:8080',
];

// Helper functions to call API routes
async function getUserFromAPI(email: string) {
  try {
    const response = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      // Read the response text for error details before throwing
      const errorText = await response.text();
      throw new Error(`Failed to get user: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // If not JSON, return the text response
      const textResponse = await response.text();
      return { message: textResponse };
    }
  } catch (error) {
    console.error('Error getting user from API:', error);
    throw error;
  }
}

async function createUserFromAPI(email: string, password: string) {
  try {
    const input = {
      email: email,
      password: password,
    };
    
    console.log('Creating user with payload:', { input, Action: 'CreateUser' });
    
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input, Action: 'CreateUser' }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Clone the response so we can read it multiple times if needed
    const responseClone = response.clone();
    
    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (textError) {
        errorText = 'Unable to read error response';
      }
      throw new Error(`Failed to create user: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        // Try to get the text from the cloned response
        const textResponse = await responseClone.text();
        return { message: textResponse };
      }
    } else {
      // If not JSON, return the text response
      const textResponse = await response.text();
      return { message: textResponse };
    }
  } catch (error) {
    console.error('Error creating user from API:', error);
    throw error;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [userInfo, setUserInfo] = useState({});

  // Inside your AuthProvider component
  const channel = useMemo(() => {
    return typeof window !== "undefined" ? new BroadcastChannel(BROADCAST_CHANNEL) : null;
  }, []); // This will only run once when the component mounts
  // Check localStorage on initial load
  useEffect(() => {
    // Load user from localStorage on mount
    const encrypted = localStorage.getItem("UserInfo");
    if (encrypted) {
      try {
        const decrypted = decryptData(encrypted);
        const userData = JSON.parse(decrypted);
        setUserInfo(userData);
        setIsAuthenticated(true);

        let userMailId = userData.MailId?userData.MailId: userData.EmailId;
        // Postgres Check if user exists in database and create if not found
        getUserFromAPI(userMailId).then((res) => {
          if (res.length == 0) {
            // Generate a random password for the user since createUser requires email and password
            const randomPassword = Math.random().toString(36).substring(2, 15);
            createUserFromAPI(userMailId, randomPassword).catch((error) => {
              console.error("Failed to create user:", error);
            });
          }
        }).catch((error) => {
          console.error("Failed to get user:", error);
        })

      } catch (err) {
        console.error("Failed to decrypt local user data:", err);
        localStorage.removeItem("UserInfo");
      }
    }

    // Setup BroadcastChannel listener (if available)
    if (channel) {
      channel.onmessage = (event) => {
        if (event.data === "ReloadPage") {
          const handleFocus = () => {
            window.location.reload();
          };
          window.addEventListener("focus", handleFocus, { once: true });
        } else {
          try {
            const decrypted = decryptData(event.data);
            const user = JSON.parse(decrypted);
            localStorage.setItem("UserInfo", event.data); // Save encrypted data
            setUserInfo(user);
            setIsAuthenticated(true);
          } catch (err) {
            console.error("Failed to process broadcasted user data:", err);
          }
        }
      };
    }

    // Post "READY" to parent for all allowed origins
    ALLOWED_ORIGINS.forEach((origin) => {
      window?.parent.postMessage("READY", origin);
    });

    // Message handler from parent
    const handleMessage = (event: MessageEvent) => {
      console.log("Received message:", event);

      // Check if the origin is allowed
      if (!ALLOWED_ORIGINS.includes(event.origin)) {
        console.warn(`Invalid origin: ${event.origin}`);
        return;
      }

      const { type, payload } = event.data;
      if (type === "SET_STATE") {
        try {
          // Assume payload is encrypted string
          const encrypted = encryptData(payload);
          const decrypted = decryptData(encrypted);
          const user = JSON.parse(decrypted);
          localStorage.setItem("UserInfo", encrypted); // Store encrypted data
          setUserInfo(user);
          setIsAuthenticated(true);
          // console.log("Received user from parent:", user);
        } catch (err) {
          console.error("Failed to process parent message user data:", err);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup listeners
    return () => {
      window.removeEventListener("message", handleMessage);
      if (channel) channel.close();
    };
  }, [channel]);



  // In a real app, this would call an API
  const login = async (username: string, password: string): Promise<boolean> => {
    // Simple validation for demo purposes
    if (username.trim() && password.trim()) {
      // In a real app, you would validate credentials with a backend
      const user = { username };
      setUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('chatbot_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.clear();
    setUserInfo({});
  };

  const updateUser = (dataObj: object) => {
    const stringified = JSON.stringify(dataObj);
    const encrypted = encryptData(stringified);
    localStorage.setItem("UserInfo", encrypted);
    channel?.postMessage(encrypted);
    setUserInfo(dataObj);
  };

  const reloadAllTabs = () => {
    channel?.postMessage("ReloadPage");
  };

  return (
    <AuthContext.Provider value={{ userInfo, updateUser, reloadAllTabs, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
// Encryption functions
function encryptData(input: any) {
  var _convertToStr = input;
  if (typeof input == "object") {
    _convertToStr = JSON.stringify(input);
  }

  var encrypted = CryptoJS.AES.encrypt(
    _convertToStr,
    APP_CONSTANT.Crypto.key, {
    iv: APP_CONSTANT.Crypto.iv
  });
  var _cipherText = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
  return _cipherText;
}

function decryptData(cipherText: any) {

  let cipherParams
  cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Hex.parse(cipherText)
  });
  cipherParams = CryptoJS.AES.decrypt(
    cipherParams,
    APP_CONSTANT.Crypto.key, {
    iv: APP_CONSTANT.Crypto.iv
  });
  var _descrString = cipherParams.toString(CryptoJS.enc.Utf8);

  return _descrString;
}