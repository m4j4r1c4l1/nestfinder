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
                    background: 'rgba(15, 23, 42, 0.95)',
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
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '100%'
                    }}>
                        <h2 style={{
                            color: '#ef4444',
                            fontSize: '1.5rem',
                            marginBottom: '0.5rem',
                            fontFamily: 'inherit'
                        }}>
                            ⚠️ Application Crashed
                        </h2>
                        <p style={{
                            color: 'var(--color-text-secondary, #94a3b8)',
                            fontSize: '0.9rem',
                            marginBottom: '1.5rem',
                            wordBreak: 'break-word'
                        }}>
                            {errorMsg}
                        </p>

                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: '0.75rem 1rem',
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
                                    padding: '0.75rem 1rem',
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
                                {this.state.sendingReport ? 'Sending...' : this.state.reportSent ? 'Sent ✅' : 'Report'}
                            </button>

                            <button
                                onClick={() => {
                                    this.setState({ hasError: false, error: null });
                                }}
                                style={{
                                    padding: '0.75rem 1rem',
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
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
