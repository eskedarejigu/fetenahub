import React from 'react';

interface State {
  hasError: boolean;
  error?: Error | null;
}

export class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log the error to console (could be extended to send to server)
    // Keep logging minimal to avoid privacy issues.
    // eslint-disable-next-line no-console
    console.error('Unhandled error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Something went wrong</h2>
          <p>Sorry — an unexpected error occurred. You can try reloading the app.</p>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => window.location.reload()}>Reload</button>
          </div>
          {this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
              {String(this.state.error)}
            </details>
          )}
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;
