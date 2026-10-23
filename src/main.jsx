import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';
import './index.css';

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const SIGN_IN_URL = import.meta.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in';
const SIGN_UP_URL = import.meta.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up';
const SIGN_IN_FALLBACK_REDIRECT_URL =
  import.meta.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || '/subjects';
const SIGN_UP_FALLBACK_REDIRECT_URL =
  import.meta.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || '/subjects';

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key in .env');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInUrl={SIGN_IN_URL}
      signUpUrl={SIGN_UP_URL}
      signInFallbackRedirectUrl={SIGN_IN_FALLBACK_REDIRECT_URL}
      signUpFallbackRedirectUrl={SIGN_UP_FALLBACK_REDIRECT_URL}
      afterSignOutUrl="/welcome"
    >
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
    </ClerkProvider>
  </React.StrictMode>,
);
