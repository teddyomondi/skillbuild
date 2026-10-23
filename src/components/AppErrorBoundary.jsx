import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Upskill application render error caught:', error, errorInfo);
  }

  handleClearCacheAndReload = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('codepulse_learner_state_v1');
        window.localStorage.removeItem('upskill_learner_state_v1');
      }
    } catch {
      // ignore
    }
    window.location.href = '/subjects';
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-background dark:bg-[#18181b] text-foreground flex items-center justify-center p-6 font-sans">
          <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-xl">
              ⚡
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Upskill ran into an issue</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Don't worry—your lesson progress is saved. You can reload the page or return to your subject dashboard.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition shadow-sm"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/subjects';
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-xs hover:bg-secondary/80 border border-border transition"
              >
                Go to Subjects
              </button>
            </div>
            <div className="mt-5 pt-4 border-t border-border/60">
              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="text-xs text-muted-foreground hover:text-foreground underline decoration-muted-foreground/40 underline-offset-4"
              >
                Clear local workspace cache & restart
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
