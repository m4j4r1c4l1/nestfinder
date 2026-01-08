import React, { Component } from 'react';
import { api } from '../utils/api';

export class GlobalErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null, sendingReport: false, reportSent: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    componentDidMount() {
        // Catch unhandled errors (async, event handlers, etc.)
        window.onerror = (message, source, lineno, colno, error) => {
            this.setState({
                hasError: true,
                error: error || new Error(message),
                errorInfo: { componentStack: `at ${source}:${lineno}:${colno}` }
            });
            return true; // Prevent default browser error handling
        };

        // Catch unhandled promise rejections
        window.onunhandledrejection = (event) => {
            this.setState({
                hasError: true,
                error: event.reason || new Error('Unhandled Promise Rejection'),
                errorInfo: { componentStack: 'Promise rejection - no stack available' }
            });
        };
    }

    componentWillUnmount() {
        window.onerror = null;
        window.onunhandledrejection = null;
    }

    handleSendReport = async () => {
        if (this.state.sendingReport || this.state.reportSent) return;

        this.setState({ sendingReport: true });
        try {
            const errorMsg = this.state.error?.toString() || 'Unknown Error';
            const shortSummary = errorMsg.length > 50 ? errorMsg.substring(0, 50) + '...' : errorMsg;
            const title = `Zero Day: ${shortSummary}`;

            const detailedReport = [
                title,
                '',
                '--- CRASH REPORT ---',
                `Error: ${errorMsg}`,
                '',
                '--- STACK TRACE ---',
                this.state.errorInfo?.componentStack || 'No component stack available',
                '',
                '--- DEVICE INFO ---',
                `User Agent: ${navigator.userAgent}`,
                `Time: ${new Date().toISOString()}`,
                `URL: ${window.location.href}`
            ].join('\n');

            // Send as 'bug' with 5 star rating (high priority)
            await api.submitFeedback('bug', detailedReport, 5);

            this.setState({ reportSent: true, sendingReport: false });
        } catch (e) {
            console.error("Failed to send crash report", e);
            this.setState({ sendingReport: false });
            alert("Failed to send report. Please try again.");
        }
    };

    render() {
        if (this.state.hasError) {
            const errorMsg = this.state.error?.toString() || 'Unknown Error';
            return (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: 'var(--radius-lg, 12px)',
                        padding: '1.25rem',
                        maxWidth: '400px',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        {/* Title - Single Line */}
                        <h2 style={{
                            color: '#ef4444',
                            fontSize: '1.3rem',
                            marginBottom: '1rem',
                            fontFamily: 'inherit',
                            whiteSpace: 'nowrap'
                        }}>
                            ⚠️ Application Crashed
                        </h2>

                        {/* Error Badge - Red Transparent */}
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: 'var(--radius-md, 8px)',
                            padding: '0.75rem 1rem',
                            marginBottom: '1.5rem',
                            width: '100%',
                            maxWidth: '100%'
                        }}>
                            <p style={{
                                color: '#3b82f6',
                                fontSize: '0.85rem',
                                margin: 0,
                                wordBreak: 'break-word',
                                fontWeight: 500
                            }}>
                                {errorMsg}
                            </p>
                        </div>

                        {/* Buttons - Horizontal, Equal, Centered */}
                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            justifyContent: 'space-between',
                            width: '100%'
                        }}>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 0.5rem',
                                    background: 'var(--color-bg-tertiary, #334155)',
                                    color: 'white',
                                    border: '1px solid rgba(148, 163, 184, 0.3)',
                                    borderRadius: 'var(--radius-md, 8px)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 500
                                }}
                            >
                                Reload
                            </button>

                            <button
                                onClick={this.handleSendReport}
                                disabled={this.state.sendingReport || this.state.reportSent}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 0.5rem',
                                    background: this.state.reportSent ? '#16a34a' : 'var(--color-primary, #3b82f6)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md, 8px)',
                                    cursor: (this.state.sendingReport || this.state.reportSent) ? 'default' : 'pointer',
                                    opacity: this.state.sendingReport ? 0.7 : 1,
                                    fontSize: '0.85rem',
                                    fontWeight: 600
                                }}
                            >
                                {this.state.sendingReport ? 'Sending...' : this.state.reportSent ? '✓' : 'Send Report'}
                            </button>

                            <button
                                onClick={() => {
                                    this.setState({ hasError: false, error: null });
                                }}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 0.5rem',
                                    background: 'var(--color-bg-tertiary, #334155)',
                                    color: 'white',
                                    border: '1px solid rgba(148, 163, 184, 0.3)',
                                    borderRadius: 'var(--radius-md, 8px)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 500
                                }}
                            >
                                Dismiss
                            </button>
                        </div>

                        {/* Footer - Nest + Nestfinder */}
                        <div style={{
                            marginTop: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            color: 'var(--color-text-secondary, #64748b)',
                            fontSize: '1.3rem'
                        }}>
                            <span>🪹</span>
                            <span style={{ fontWeight: 500 }}>Nestfinder</span>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
