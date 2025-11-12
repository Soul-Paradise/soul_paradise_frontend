'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface GoogleSignInButtonProps {
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({
  disabled = false,
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const { googleAuth } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (isInitialized.current || disabled) return;

    const initializeGoogleSignIn = () => {
      if (!window.google || !buttonRef.current) return;

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error('Google Client ID not found');
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: buttonRef.current.offsetWidth || 350,
        });

        isInitialized.current = true;
      } catch (error) {
        console.error('Failed to initialize Google Sign-In:', error);
      }
    };

    const handleCredentialResponse = async (response: { credential: string }) => {
      try {
        await googleAuth(response.credential);

        if (onSuccess) {
          onSuccess();
        }
        // AuthContext handles redirect to dashboard automatically
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to sign in with Google';
        console.error('Google auth error:', errorMessage);

        if (onError) {
          onError(errorMessage);
        }
      }
    };

    // Check if Google script is loaded
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.google) {
          initializeGoogleSignIn();
          clearInterval(checkInterval);
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);

      return () => clearInterval(checkInterval);
    }
  }, [disabled, googleAuth, onSuccess, onError]);

  return (
    <div
      ref={buttonRef}
      className={disabled ? 'opacity-50 pointer-events-none' : ''}
      style={{ minHeight: '40px' }}
    />
  );
}
