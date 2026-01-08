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

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '1rem',
                                background: '#333',
                                color: 'white',
                                border: '1px solid #666',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Reload App
                        </button>

                        <button
                            onClick={this.handleSendReport}
                            disabled={this.state.sendingReport || this.state.reportSent}
                            style={{
                                padding: '1rem',
                                background: this.state.reportSent ? '#16a34a' : '#2563eb', // Green if sent, Blue otherwise
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: (this.state.sendingReport || this.state.reportSent) ? 'default' : 'pointer',
                                opacity: this.state.sendingReport ? 0.7 : 1,
                                fontWeight: 'bold'
                            }}
                        >
                            {this.state.sendingReport ? 'Sending...' : this.state.reportSent ? 'Report Sent ✅' : 'Send Crash Report to Admin'}
                        </button>

                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                            }}
                            style={{
                                padding: '1rem',
                                background: '#333',
                                color: 'white',
                                border: '1px solid #666',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Try to Dismiss
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
