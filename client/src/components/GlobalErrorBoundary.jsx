import React, { Component } from 'react';

export class GlobalErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.95)',
                    color: '#ff4444',
                    padding: '2rem',
                    zIndex: 99999,
                    overflow: 'auto',
                    fontFamily: 'monospace'
                }}>
                    <h2>⚠️ Application Crashed</h2>
                    <p><strong>Error:</strong> {this.state.error?.toString()}</p>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: '#ccc' }}>
                        {this.state.errorInfo?.componentStack}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            background: '#333',
                            color: 'white',
                            border: '1px solid #666',
                            borderRadius: '5px'
                        }}
                    >
                        Reload App
                    </button>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            // Optional: navigate away?
                        }}
                        style={{
                            marginTop: '1rem',
                            marginLeft: '1rem',
                            padding: '1rem',
                            background: '#333',
                            color: 'white',
                            border: '1px solid #666',
                            borderRadius: '5px'
                        }}
                    >
                        Try to Dismiss
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
