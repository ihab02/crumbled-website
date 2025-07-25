"use client"

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const redirectUrl = searchParams.get('redirect') || '/flavors';
      router.push(redirectUrl);
    }
  }, [status, session, router, searchParams]);

  // Handle email verification success
  useEffect(() => {
    const verified = searchParams.get('verified');
    const verifiedEmail = searchParams.get('email');
    
    if (verified === 'true' && verifiedEmail) {
      toast.success('Email verified successfully! Please log in to continue.');
      setEmail(verifiedEmail);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowResend(false);

    console.log('Customer login attempt for email:', email);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('NextAuth signIn result:', result);
      console.log('NextAuth error details:', result?.error);

      if (result?.error) {
        console.log('NextAuth error received:', result.error);
        
        // Handle email verification errors - check for multiple variations
        if (
          result.error.includes('not verified') ||
          result.error.toLowerCase().includes('verify your email') ||
          result.error.includes('email address is not verified') ||
          result.error.includes('email is not verified') ||
          result.error.toLowerCase().includes('verification')
        ) {
          console.log('Email verification error detected, showing resend option');
          setShowResend(true);
          toast.error('Please verify your email before logging in. Check your inbox for the verification link.');
          return;
        }
        
        // Handle CredentialsSignin error (NextAuth's default when authorize returns null)
        if (result.error === 'CredentialsSignin') {
          console.log('🔍 CREDENTIALS SIGNIN ERROR DETECTED - checking credentials first...');
          
          // First, check if the credentials are correct by attempting to verify them
          try {
            console.log('🔐 Checking credentials for email:', email);
            const credentialsCheckRes = await fetch('/api/auth/check-credentials', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });
            const credentialsData = await credentialsCheckRes.json();
            console.log('🔐 Credentials check response:', credentialsData);
            
            if (credentialsData.credentialsValid && !credentialsData.emailVerified) {
              console.log('✅ Credentials correct but email not verified - SHOWING RESEND OPTION');
              setShowResend(true);
              toast.error('Please verify your email before logging in. Check your inbox for the verification link.');
              return;
            } else if (!credentialsData.credentialsValid) {
              console.log('❌ Invalid credentials - showing generic error');
              toast.error('Invalid email or password. Please check your credentials.');
              return;
            } else {
              console.log('❌ Other error - showing generic error');
            }
          } catch (checkError) {
            console.log('❌ Could not check credentials:', checkError);
          }
        }
        
        // Handle other specific errors with clear messages
        let errorMessage = 'Login failed. Please try again.';
        
        if (result.error.includes('Invalid credentials') || result.error.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (result.error.includes('Email and password are required')) {
          errorMessage = 'Please enter both email and password.';
        } else if (result.error.includes('Invalid email format')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (result.error.includes('Password requirements not met')) {
          errorMessage = 'Password does not meet requirements.';
        } else if (result.error.includes('Internal server error')) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          // For any other errors, check if it might be email verification related
          if (result.error.toLowerCase().includes('email') || result.error.toLowerCase().includes('verify')) {
            console.log('Possible email verification error, showing resend option');
            setShowResend(true);
            toast.error('Please verify your email before logging in. Check your inbox for the verification link.');
            return;
          }
          // For any other errors, use a generic but helpful message
          errorMessage = 'Unable to log in. Please check your credentials and try again.';
        }
        
        console.error('NextAuth error:', result.error);
        toast.error(errorMessage);
        return;
      }

      // If login failed without any error (edge case), show generic message
      if (!result?.ok && !result?.error) {
        console.log('Login failed without error - showing generic message');
        toast.error('Login failed. Please check your credentials and try again.');
        return;
      }

      if (result?.ok) {
        console.log('Login successful, redirecting');
        
        // Check if user just verified their email
        const verified = searchParams.get('verified');
        const redirectUrl = verified === 'true' ? '/flavors' : (searchParams.get('redirect') || '/flavors');
        
        const successMessage = verified === 'true' 
          ? 'Welcome! Redirecting to our delicious flavors...' 
          : 'Welcome back! Redirecting...';
        
        toast.success(successMessage);
        
        // Small delay to ensure session is updated
        setTimeout(() => {
          router.push(redirectUrl);
        }, 500);
      } else {
        console.log('Login successful');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Show toast for unexpected errors
      toast.error('Connection error. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Verification email sent! Please check your inbox and spam folder.');
        setShowResend(false);
      } else {
        const errorMessage = data.error || 'Unable to send verification email. Please try again.';
        toast.error(errorMessage);
      }
    } catch (err) {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGuestContinue = () => {
    // Get redirect URL from query param
    const redirectUrl = searchParams.get('redirect') || '/shop';
    
    // If the redirect URL is a reset password page, redirect to shop instead
    // to avoid token validation errors
    if (redirectUrl.includes('/auth/reset-password')) {
      router.push('/shop');
    } else {
      router.push(redirectUrl);
    }
  };

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show login form if already authenticated
  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-pink-200 rounded-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-pink-800">Welcome Back!</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-pink-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-pink-200"
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-pink-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-pink-200"
                placeholder="Enter your password"
              />
              <div className="text-right">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-pink-600 hover:text-pink-800"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {showResend && (
            <div className="mt-4 text-center">
              <div className="text-pink-700 mb-3 text-sm leading-relaxed">
                📧 Email not verified. Check your inbox and click the verification link to continue.
              </div>
              <Button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-sm"
              >
                {resendLoading ? 'Sending...' : '📧 Resend Verification Email'}
              </Button>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-pink-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-pink-600">Or</span>
              </div>
            </div>

            <Button
              onClick={handleGuestContinue}
              variant="outline"
              className="w-full border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              Continue as Guest
            </Button>

            <p className="text-center text-sm text-pink-600">
              Don't have an account?{' '}
              <Link 
                href={`/auth/register?redirect=${encodeURIComponent(searchParams.get('redirect') || '/account')}`} 
                className="font-semibold hover:text-pink-800"
              >
                Register here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
