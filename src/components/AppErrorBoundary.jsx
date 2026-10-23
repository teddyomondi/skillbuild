import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application render failed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-background dark:bg-[#1F1F1F] text-foreground flex items-center justify-center p-6">
          <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold">This screen ran into a problem</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your saved course progress is still here. Reload the page to try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Reload
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
