import React from 'react';

// React error boundaries must be class components — there's no hook
// equivalent. Without this, any uncaught rendering error anywhere in the
// tree unmounts the entire app to a blank white screen, which is a
// genuinely bad experience with no explanation and no way to recover
// short of reloading manually.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Uncaught rendering error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
            background: 'var(--paper)',
          }}
        >
          <span className="eyebrow">Something went wrong</span>
          <h2 style={{ marginBottom: 'var(--space-3)' }}>This page hit an unexpected error</h2>
          <p style={{ maxWidth: 420, marginBottom: 'var(--space-6)' }}>
            Your data is safe — this was just a display error. Reloading usually fixes it.
          </p>
          <button type="button" className="btn btn-primary" onClick={this.handleReload}>
            Reload the page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
