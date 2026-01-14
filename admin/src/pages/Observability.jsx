import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { adminApi } from '../api';
import dbIcon from '../assets/db-icon.png';
import { useWebSocket } from '../hooks/useWebSocket';




const API_URL = import.meta.env.VITE_API_URL || '';
const APP_URL = 'https://m4j4r1c4l1.github.io/nestfinder/';




// Reusable CountUp Animation Component
const CountUp = ({ end, duration = 2000, decimals = 0, separator = null }) => {
    const [count, setCount] = useState(0);
    const endVal = parseFloat(end) || 0;

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Ease Out Quart for smooth deceleration
            const ease = 1 - Math.pow(1 - progress, 4);

            setCount(ease * endVal);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [endVal, duration]);

    if (separator) {
        let fixed = count.toFixed(decimals);
        let [int, dec] = fixed.split('.');
        int = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
        return <>{dec ? `${int}.${dec}` : int}</>;
    }

    if (decimals > 0) {
        // For floats (Rating), use Dot decimal (standard JS toFixed)
        return <>{count.toFixed(decimals)}</>;
    }

    // For integers (Messages), use Dot thousands (German locale)
    return <>{count.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</>;
};

// Reusable Commit ID Reveal Component
const CommitReveal = ({ text, duration = 2000 }) => {
    const [display, setDisplay] = useState(text || '-');
    const chars = '0123456789abcdef';

    useEffect(() => {
        if (!text || text === '-') {
            setDisplay('-');
            return;
        }

        let startTime;
        let lastUpdate = 0;
        let animationFrame;
        const len = text.length;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            // Sequential Logic: First char locks at 0s, next at 0.5s, etc.
            // Wait, request is: "begins stopping... with 1/2 second of delay".
            // Let's say we scramble for 1s globally, THEN start locking.
            // Char i locks at: 1000ms + (i * 500ms).

            // Build the string frame
            if (timestamp - lastUpdate > 50) { // Throttle scramble speed ~20fps
                let str = '';
                for (let i = 0; i < len; i++) {
                    // Start locking sequence after 1.5s of initial chaos
                    const lockTime = 1500 + (i * 500);

                    if (elapsed > lockTime) {
                        str += text[i]; // Locked
                    } else {
                        str += chars[Math.floor(Math.random() * 16)]; // Scrambling
                    }
                }
                setDisplay(str);
                lastUpdate = timestamp;
            }

            // Continue until all chars are locked
            // Last char locks at 1000 + (len-1)*500
            const totalDuration = 1500 + (len * 500) + 100;

            if (elapsed < totalDuration) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setDisplay(text); // Ensure final consistency
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [text]);

    return <>{display}</>;
};

// Barrel/Slot Machine Digit Component
// Barrel/Slot Machine Digit Component
const BarrelDigit = ({ value, trigger }) => {
    const [display, setDisplay] = useState(value);
    const [prev, setPrev] = useState(null);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        // If value changed OR trigger fired (even if value is same), animate!
        // For forced trigger with same value: setPrev to current, setDisplay to current, force re-render/animate
        if (value !== display || trigger) {
            setPrev(display);
            setDisplay(value);
            setAnimating(true);
            const timer = setTimeout(() => setAnimating(false), 600);
            return () => clearTimeout(timer);
        }
    }, [value, trigger]); // removed display from deps to avoid loop, though logic handles it

    return (
        <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            verticalAlign: 'baseline',
            height: '1.2em', // Standard text height
            overflow: 'hidden',
            width: /^[0-9]$/.test(display) ? '0.62em' : 'auto',
            minWidth: /^[0-9]$/.test(display) ? '0.62em' : '0.15em',
            margin: 0,
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'center'
        }}>
            <div key={`${display}-${trigger || 'init'}`} style={{
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                animation: animating ? 'barrelDrop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
                transform: 'translateY(0)'
            }}>
                <div style={{ height: '1.2em', lineHeight: '1.2em' }}>{display}</div>
                {animating && <div style={{ height: '1.2em', lineHeight: '1.2em' }}>{prev || display}</div>}
            </div>
        </div>
    );
};

// Barrel Counter Container
const BarrelCounter = ({ value, trigger }) => {
    const styles = `
        @keyframes barrelDrop {
            0% { transform: translateY(-50%); filter: blur(0); }
            20% { filter: blur(1.5px); }
            50% { filter: blur(3.5px); } /* Peak Velocity */
            80% { filter: blur(1.2px); } /* Deceleration */
            92% { filter: blur(0.4px); } /* Snap-back Velocity */
            100% { transform: translateY(0); filter: blur(0); }
        }
    `;

    const str = typeof value === 'string' ? value : Math.round(value || 0).toString();
    return (
        <div style={{ display: 'inline-flex', alignItems: 'baseline' }}>
            <style>{styles}</style>
            {str.split('').map((char, i) => (
                <BarrelDigit key={i} value={char} trigger={trigger} />
            ))}
        </div>
    );
};

// Rolling Barrel Counter (CountUp + Barrel)
const RollingBarrelCounter = ({ end, duration = 2000, separator = null, trigger = null, decimals = 0 }) => {
    const [count, setCount] = useState(0);
    const endVal = parseFloat(end) || 0;
    const isInitial = React.useRef(true);

    useEffect(() => {
        // If it's an update (not initial load), don't roll everything!
        // Just set the value directly so BarrelDigit can handle the specific digit transition.
        if (!isInitial.current) {
            setCount(endVal); // Direct update -> BarrelDigit handles the "slot" drop
            return;
        }

        // Initial Load: Roll from 0 to Target
        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Ease Out Quint (Faster start)
            const ease = 1 - Math.pow(1 - progress, 5);
            setCount(ease * endVal);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                isInitial.current = false; // Mark initial animation complete
                setCount(endVal); // Ensure exact final value
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [endVal, duration, trigger]);

    // Format the count for display
    let displayValue = count.toFixed(decimals);
    if (separator) {
        const [int, dec] = displayValue.split('.');
        const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
        displayValue = dec ? `${intFormatted}.${dec}` : intFormatted;
    } else if (decimals === 0) {
        // Default to dot separator for integers (Messages)
        displayValue = displayValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    return <BarrelCounter value={displayValue} trigger={trigger} />;
};

// Randomly chooses between Barrel and CountUp for variety
const RandomCounter = (props) => {
    // Stable random choice on mount
    const useBarrel = React.useRef(Math.random() > 0.5).current;

    if (useBarrel) {
        return <RollingBarrelCounter {...props} />;
    }
    return <CountUp {...props} />;
};

export default function Observability() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalReceived: 0,
        avgDeliveryTime: '0ms',
        systemHealth: 100,
        uptime: '99.9%',
        errorRate: '0.0%',
        mapPoints: { total: 0, confirmed: 0, pending: 0, rejected: 0 },
        notificationMetrics: { total: 0, sent: 0, delivered: 0, read: 0, unread: 0 },
        feedbackMetrics: { total: 0, pending: 0, read: 0 },
        devMetrics: { loc: 0, components: 0, commits: 0, files: 0, apiEndpoints: 0, socketEvents: 0, listeners: 0, hooks: 0 },
        broadcastMetrics: { total: 0, active: 0, delivered: 0, read: 0 },
        connectedClients: 0,
        serverStatus: 'Online',
        lastHeartbeat: Date.now()
    });

    const [activeTab, setActiveTab] = useState('notifications');
    const [timeRange, setTimeRange] = useState('7d');
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedRating, setSelectedRating] = useState(null); // For rating breakdown modal

    // WebSocket for real-time updates (handled by custom hook)
    const wsUrl = API_URL.replace(/^http/, 'ws') || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

    useWebSocket(wsUrl, (message) => {
        if (message.type === 'commit-update') {
            console.log(`Real-time commit update: ${message.data.lastCommit} - refreshing stats`);

            // Apply full dev metrics from broadcast if available
            if (message.data.devMetrics) {
                setStats(prev => ({
                    ...prev,
                    devMetrics: message.data.devMetrics
                }));
            } else {
                // Fallback for older broadcasts
                setTimeout(loadData, 1000);
            }
        } else if (message.type === 'clients-update') {
            setStats(prev => ({
                ...prev,
                connectedClients: message.count
            }));
        } else if (message.type === 'system-status') {
            // Real-time System Stats from Backend
            const { memory, cpu, uptime, db } = message.data;
            const loadPercent = cpu && cpu.load ? Math.round(cpu.load * 10) : 0; // Simple scaling

            setStats(prev => ({
                ...prev,
                connectedClients: message.clientCount || prev.connectedClients,
                systemHealth: {
                    uptime: uptime,
                    load: loadPercent,
                    ram: memory ? memory.usage : 0,
                    db: db
                }
            }));
        }
    });

    // Helper to format uptime seconds into Dd HHh MMm
    const formatUptime = (seconds) => {
        if (!seconds) return '0m';
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor(seconds % (3600 * 24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);

        let str = '';
        if (d > 0) str += `${d}d `;
        if (h > 0) str += `${h}h `;
        str += `${m}m`;
        return str;
    };

    useEffect(() => {
        loadData();
    }, [timeRange]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('nestfinder_admin_token');
            const res = await fetch(`${API_URL}/api/push/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error(`Server returned ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            // Merge with default structure to ensure no undefined access
            setStats(prev => ({ ...prev, ...data }));
        } catch (err) {
            console.error('Failed to load observability stats:', err);
            // We keep the default stats so the UI doesn't crash
        }
        setLoading(false);
    };

    return (
        <div className="notifications-page" style={{ width: '75%', maxWidth: '1500px', margin: '0 auto', padding: '1.5rem 1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    🐦 Observability
                </h1>
                <p className="text-muted">Monitor system health, usage statistics, and developer insights</p>
            </div>

            {/* Status Card (Landscape) */}
            <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #334155', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, #22c55e, #3b82f6, #f59e0b, #ec4899)' }} />

                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #334155' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>⚡ Status</h3>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Node: Nest-Alpha-01</div>
                </div>

                <div style={{ padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>

                    {/* Main Health Block */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>System Status</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>Operational</div>
                            <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600, marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e' }} />
                                Uptime: {formatUptime(stats.systemHealth?.uptime)}
                            </div>
                        </div>
                        <EKGAnimation
                            color={stats.systemHealth?.db === 'Error' || (stats.systemHealth?.load > 70) ? '#ef4444' : '#38bdf8'}
                            isLoading={!stats.systemHealth?.db || stats.systemHealth?.db === 'Checking...'}
                            isStressed={(stats.systemHealth?.load > 50) || (stats.systemHealth?.ram > 70) || stats.systemHealth?.db === 'Error'}
                        />
                    </div>

                    <div style={{ width: '1px', height: '40px', background: '#334155' }} />

                    {/* Server Load (Stacked) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '1.8rem', opacity: 0.8 }}>🖥️</div>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Server Load</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>Healthy</div>
                                <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600, marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e' }} />
                                    Latency: {stats.systemHealth?.latency || '< 1'}ms
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.2rem', borderLeft: '1px solid #334155', paddingLeft: '1.2rem' }}>
                                <div style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ width: '20px', textAlign: 'center' }}>🔲</span>
                                    <span>CPU</span>
                                    <span style={{ fontWeight: 700, marginLeft: 'auto' }}>{stats.systemHealth?.load || 0}%</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ width: '20px', textAlign: 'center' }}>🧠</span>
                                    <span>RAM</span>
                                    <span style={{ fontWeight: 700, marginLeft: 'auto' }}>{stats.systemHealth?.ram || 0}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ width: '1px', height: '40px', background: '#334155' }} />

                    {/* Database Status - Vertical layout matching others */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={dbIcon} alt="DB" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Database</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>
                                {stats.systemHealth?.db === 'Error' ? 'Error' : stats.systemHealth?.db === 'Checking...' ? 'Checking...' : 'Connected'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: stats.systemHealth?.db === 'Error' ? '#ef4444' : '#22c55e', fontWeight: 600, marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: stats.systemHealth?.db === 'Error' ? '#ef4444' : stats.systemHealth?.db === 'Checking...' ? '#f59e0b' : '#22c55e', boxShadow: `0 0 5px ${stats.systemHealth?.db === 'Error' ? '#ef4444' : stats.systemHealth?.db === 'Checking...' ? '#f59e0b' : '#22c55e'}` }} />
                                {stats.systemHealth?.db === 'Error' ? 'Unreachable' : stats.systemHealth?.db === 'Checking...' ? 'Testing...' : 'SQLite Engine'}
                            </div>
                        </div>
                    </div>

                    {/* Live Connection Counter - Rearranged for visual appeal */}
                    <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.4)', padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid #1e293b',
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                            <span style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Sessions</span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                {/* Pulsing Dot (Ripple Effect) */}
                                <div style={{ position: 'relative', width: '8px', height: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {/* Waves Fading Out */}
                                    <div style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.6)', animation: 'pulse-wave 2s ease-out infinite', opacity: 0 }} />
                                    <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.4)', animation: 'pulse-wave 2s ease-out infinite 0.6s', opacity: 0 }} />
                                    {/* Core Dot */}
                                    <div style={{ position: 'relative', width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px rgba(56, 189, 248, 0.8)' }} />
                                </div>

                                <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1, fontFamily: 'monospace' }}>
                                    <RollingBarrelCounter end={stats.connectedClients || 0} />
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
                <style>{`
                    @keyframes pulse-wave {
                        0% { transform: scale(1); opacity: 0.6; }
                        100% { transform: scale(2); opacity: 0; }
                    }
                    @keyframes pulse-beat {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.2); }
                    }
                `}</style>
            </div>

            {/* Totals Summary */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>📊 Totals</h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Row 1: Users, Points, Rating */}
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                            {/* Users Block */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '1rem' }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.4rem' }}>🦚 Users</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color, #3b82f6)', lineHeight: 1 }}>
                                        <RandomCounter end={stats.totalSubscribers} />
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>Registered</div>
                                    <div className="text-muted text-sm">Total</div>
                                </div>
                                {/* 2x2 Grid Badges */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', width: '100%', maxWidth: '240px' }}>
                                    {[
                                        { label: 'Eagle', count: stats.userLevels?.eagle, color: '#f59e0b', icon: '🦅' },
                                        { label: 'Owl', count: stats.userLevels?.owl, color: '#8b5cf6', icon: '🦉' },
                                        { label: 'Sparrow', count: stats.userLevels?.sparrow, color: '#3b82f6', icon: '🐦' },
                                        { label: 'Hatchling', count: stats.userLevels?.hatchling, color: '#94a3b8', icon: '🥚' }
                                    ].map(badge => (
                                        <div key={badge.label} style={{
                                            display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.4rem',
                                            background: `${badge.color}20`, border: `1px solid ${badge.color}40`,
                                            borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.85rem'
                                        }}>
                                            <span style={{ fontSize: '1rem' }}>{badge.icon}</span>
                                            <span style={{ color: badge.color, fontWeight: 600 }}>{badge.label}</span>
                                            <span style={{ fontWeight: 700, color: '#fff', marginLeft: '0.2rem' }}><RollingBarrelCounter end={badge.count || 0} /></span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ width: '1px', height: '60%', alignSelf: 'center', background: '#334155', margin: '0 1rem' }} />

                            {/* Points Block */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '1rem' }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.4rem' }}>📍 Points</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#22c55e', lineHeight: 1 }}>
                                        <RandomCounter end={(stats.mapPoints?.confirmed || 0) + (stats.mapPoints?.pending || 0) + (stats.mapPoints?.deactivated || 0)} />
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>Submitted</div>
                                    <div className="text-muted text-sm">Total</div>
                                </div>
                                {/* Badges: Pending on top, Confirmed+Inactive below */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%', maxWidth: '280px' }}>
                                    {/* Pending badge on top */}
                                    <div style={{
                                        display: 'flex', alignItems: 'baseline', gap: '0.4rem',
                                        background: '#f59e0b20', border: '1px solid #f59e0b40',
                                        borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.85rem'
                                    }}>
                                        <span style={{ fontSize: '0.9rem' }}>🟠</span>
                                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Pending</span>
                                        <span style={{ fontWeight: 700, color: '#fff', marginLeft: '0.2rem' }}><RollingBarrelCounter end={stats.mapPoints?.pending || 0} /></span>
                                    </div>
                                    {/* Confirmed + Inactive row */}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'baseline', gap: '0.4rem',
                                            background: '#22c55e20', border: '1px solid #22c55e40',
                                            borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.85rem'
                                        }}>
                                            <span style={{ fontSize: '0.9rem' }}>🟢</span>
                                            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Confirmed</span>
                                            <span style={{ fontWeight: 700, color: '#fff', marginLeft: '0.2rem' }}><RollingBarrelCounter end={stats.mapPoints?.confirmed || 0} /></span>
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'baseline', gap: '0.4rem',
                                            background: '#ef444420', border: '1px solid #ef444440',
                                            borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.85rem'
                                        }}>
                                            <span style={{ fontSize: '0.9rem' }}>🔴</span>
                                            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Inactive</span>
                                            <span style={{ fontWeight: 700, color: '#fff', marginLeft: '0.2rem' }}><RollingBarrelCounter end={stats.mapPoints?.deactivated || 0} /></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ width: '1px', height: '60%', alignSelf: 'center', background: '#334155', margin: '0 1rem' }} />

                            {/* Rating Block */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '1rem', height: '100%' }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.4rem' }}>⭐ Rating</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#facc15', lineHeight: 1 }}>
                                        {stats.avgRating !== undefined ? <RandomCounter end={stats.avgRating} decimals={1} /> : '-'}
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>Average</div>
                                    <div className="text-muted text-sm">All time</div>
                                </div>
                                {/* Badge - vertically centered to align with Users 2x2 grid center */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'baseline', gap: '0.4rem',
                                        background: '#facc1520', border: '1px solid #facc1540',
                                        borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.85rem'
                                    }}>
                                        <span style={{ fontSize: '0.9rem' }}>⭐</span>
                                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Votes</span>
                                        <span style={{ fontWeight: 700, color: '#fff', marginLeft: '0.2rem' }}><RollingBarrelCounter end={stats.totalRatings || 0} /></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Separator Line */}
                        <div style={{ height: '1px', background: '#334155', width: '100%' }} />

                        {/* Row 2: Messages | Broadcasts | Development */}
                        {/* Using Grid: 25% | 25% | 50%. Dev block gets 50% width to shift it left. */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1rem', width: '100%' }}>
                            {/* Messages Block (Left) */}
                            <div style={{
                                display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center',
                                border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '1rem',
                                background: 'rgba(245, 158, 11, 0.05)'
                            }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.4rem' }}>🔔 Messages</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', alignItems: 'center' }}>
                                    {/* Sent Section */}
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                                        <div style={{ textAlign: 'center', width: '110px', flexShrink: 0 }}>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f97316', lineHeight: 1 }}>
                                                <RandomCounter end={stats.notificationMetrics?.total || 0} />
                                            </div>
                                            <div style={{ fontWeight: 600, color: '#e2e8f0' }}>Sent</div>
                                            <div className="text-muted text-sm">Total</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '130px' }}>
                                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.4rem', background: '#22c55e20', border: '1px solid #22c55e40', borderRadius: '8px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
                                                <span style={{ color: '#22c55e', fontWeight: 600 }}>Delivered</span>
                                                <span style={{ fontWeight: 700, color: '#fff' }}><RollingBarrelCounter end={stats.notificationMetrics?.delivered || 0} /></span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.4rem', background: '#3b82f620', border: '1px solid #3b82f640', borderRadius: '8px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
                                                <span style={{ color: '#3b82f6', fontWeight: 600 }}>Read</span>
                                                <span style={{ fontWeight: 700, color: '#fff' }}><RollingBarrelCounter end={stats.notificationMetrics?.read || 0} /></span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.4rem', background: '#f59e0b20', border: '1px solid #f59e0b40', borderRadius: '8px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
                                                <span style={{ color: '#f59e0b', fontWeight: 600 }}>Sent</span>
                                                <span style={{ fontWeight: 700, color: '#fff' }}><RollingBarrelCounter end={(stats.notificationMetrics?.total || 0) - (stats.notificationMetrics?.delivered || 0) - (stats.notificationMetrics?.read || 0)} /></span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Received Section */}
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                                        <div style={{ textAlign: 'center', width: '110px', flexShrink: 0 }}>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6', lineHeight: 1 }}>
                                                <RandomCounter end={stats.feedbackMetrics?.total || stats.totalReceived || 0} />
                                            </div>
                                            <div style={{ fontWeight: 600, color: '#e2e8f0' }}>Received</div>
                                            <div className="text-muted text-sm">Total</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '130px' }}>
                                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.4rem', background: '#22c55e20', border: '1px solid #22c55e40', borderRadius: '8px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
                                                <span style={{ color: '#22c55e', fontWeight: 600 }}>Delivered</span>
                                                <span style={{ fontWeight: 700, color: '#fff' }}><RollingBarrelCounter end={stats.feedbackMetrics?.pending || 0} /></span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.4rem', background: '#3b82f620', border: '1px solid #3b82f640', borderRadius: '8px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
                                                <span style={{ color: '#3b82f6', fontWeight: 600 }}>Read</span>
                                                <span style={{ fontWeight: 700, color: '#fff' }}><RollingBarrelCounter end={stats.feedbackMetrics?.read || 0} /></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Broadcasts Block (Center) - Sized to match LOC block */}
                            {/* Broadcasts Block (Center) - Sized to match LOC block */}
                            <div style={{
                                display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center',
                                border: '1px solid rgba(45, 212, 191, 0.3)', borderRadius: '12px', padding: '1rem',
                                background: 'rgba(45, 212, 191, 0.05)', minWidth: '200px', justifyContent: 'flex-start'
                            }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.4rem' }}>🚀 Broadcasts</div>

                                {/* Main Metric (Campaigns) */}
                                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2dd4bf', lineHeight: 1, letterSpacing: '-0.03em', textShadow: '0 0 20px rgba(45, 212, 191, 0.3)' }}>
                                        <RandomCounter end={stats.broadcastMetrics?.total || 0} />
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>Campaigns</div>
                                    <div className="text-muted text-sm">Total</div>
                                </div>

                                {/* Metrics Grid: Messages | Users | Sent | Read (2x2 Col-Flow) */}
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
                                    gridAutoFlow: 'column', gap: '0.8rem', width: '100%', marginBottom: '1rem'
                                }}>
                                    {/* Messages (TL) */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>{stats.broadcastMetrics?.delivered || 0}</span>
                                            <span style={{ fontSize: '0.8rem' }}>📡</span>
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Messages</div>
                                    </div>
                                    {/* Users (BL) */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>{stats.broadcastMetrics?.reach || 0}</span>
                                            <span style={{ fontSize: '0.8rem' }}>👨‍👩‍👧‍👦</span>
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Users</div>
                                    </div>
                                    {/* Sent (TR) */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.75rem' }}>✓✓</span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>{stats.broadcastMetrics?.delivered || 0}</span>
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Sent</div>
                                    </div>
                                    {/* Read (BR) */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.75rem' }}>✓✓</span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>{stats.broadcastMetrics?.read || 0}</span>
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Read</div>
                                    </div>
                                </div>

                                {/* Priority Badges - 5 cols, Squared */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.3rem', width: '100%', marginBottom: '0.3rem' }}>
                                    {[1, 2, 3, 4, 5].map(p => {
                                        let color = '#22c55e';
                                        if (p === 1) color = '#ef4444';
                                        if (p === 2) color = '#f97316';
                                        if (p === 3) color = '#eab308';
                                        if (p === 4) color = '#3b82f6';

                                        return (
                                            <div key={p} style={{
                                                width: '100%', aspectRatio: '1/1',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: `${color}15`, borderRadius: '4px',
                                                border: `1px solid ${color}30`
                                            }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f1f5f9' }}>
                                                    {stats.broadcastMetrics?.priorities?.[p] || 0}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Status Badges - Full width 2x2 grid */}
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
                                    gap: '0.4rem', width: '100%'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#3b82f620', border: '1px solid #3b82f640', borderRadius: '4px', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                                        <span style={{ color: '#3b82f6', fontWeight: 600 }}>Sched</span>
                                        <span style={{ fontWeight: 700, color: '#fff' }}>{stats.broadcastMetrics?.scheduled || 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#22c55e20', border: '1px solid #22c55e40', borderRadius: '4px', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                                        <span style={{ color: '#22c55e', fontWeight: 600 }}>Active</span>
                                        <span style={{ fontWeight: 700, color: '#fff' }}>{stats.broadcastMetrics?.active || 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ec489920', border: '1px solid #ec489940', borderRadius: '4px', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                                        <span style={{ color: '#ec4899', fontWeight: 600 }}>Filled</span>
                                        <span style={{ fontWeight: 700, color: '#fff' }}>{stats.broadcastMetrics?.filled || 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#94a3b820', border: '1px solid #94a3b840', borderRadius: '4px', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>Ended</span>
                                        <span style={{ fontWeight: 700, color: '#fff' }}>{stats.broadcastMetrics?.ended || 0}</span>
                                    </div>
                                </div>
                            </div>



                            {/* Development Block (Right) - Now gets 50% width */}
                            <div style={{
                                display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center',
                                border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '1rem',
                                background: 'rgba(59, 130, 246, 0.05)'
                            }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '1.4rem' }}>🛠️ Development</div>

                                {/* 3 columns Badge Grid (9 items) */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '0.6rem', width: '100%' }}>
                                    {[
                                        // Row 1
                                        { label: 'Components', sub: 'React/JSX', count: <RollingBarrelCounter end={stats.devMetrics?.components || 0} trigger={stats.devMetrics?.lastCommit} separator="." />, color: '#0ea5e9', alignBottom: true },
                                        // Center: Lines of Code (Custom Render)
                                        {
                                            isLoc: true,
                                            count: <RandomCounter end={stats.devMetrics?.loc || 0} separator="." />,
                                            label: 'Lines of Code',
                                            sub: 'Total'
                                        },
                                        { label: 'Files', sub: 'Total Count', count: <RollingBarrelCounter end={stats.devMetrics?.files || 0} trigger={stats.devMetrics?.lastCommit} separator="." />, color: '#fb923c', boxStyle: { background: '#c2410c20', border: '1px solid #c2410c40' }, alignBottom: true },

                                        // Row 2
                                        { label: 'Commits', sub: 'Git History', count: <RollingBarrelCounter end={stats.devMetrics?.commits || 0} trigger={stats.devMetrics?.lastCommit} separator="." />, color: '#8b5cf6' },
                                        {
                                            label: 'Commit ID',
                                            sub: 'Latest',
                                            count: <CommitReveal text={stats.devMetrics?.lastCommit} />,
                                            color: '#4ade80',
                                            mono: true,
                                            boxStyle: { background: '#1e3a8a40', border: '1px solid #1e3a8a' }
                                        },
                                        { label: 'API', sub: 'Endpoints', count: <RollingBarrelCounter end={stats.devMetrics?.apiEndpoints || 0} trigger={stats.devMetrics?.lastCommit} separator="." />, color: '#ec4899', boxStyle: { background: '#be185d20', border: '1px solid #be185d40' } },

                                        // Row 3
                                        { label: 'Listeners', sub: 'Events', count: <RollingBarrelCounter end={stats.devMetrics?.listeners || 0} trigger={stats.devMetrics?.lastCommit} separator="." />, color: '#d946ef' },
                                        { label: 'Websockets', sub: 'Events', count: <RollingBarrelCounter end={stats.devMetrics?.socketEvents || 0} trigger={stats.devMetrics?.lastCommit} separator="." />, color: '#eab308' },
                                        { label: 'Hooks', sub: 'React Hooks', count: <RollingBarrelCounter end={stats.devMetrics?.hooks || 0} trigger={stats.devMetrics?.lastCommit} separator="." />, color: '#6366f1' },
                                    ].map((badge, i) => {
                                        if (badge.isLoc) {
                                            return (
                                                <div key={i} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#14b8a6', lineHeight: 1 }}>
                                                        {badge.count}
                                                    </div>
                                                    <div style={{ fontWeight: 600, color: '#e2e8f0', marginTop: '0.2rem' }}>{badge.label}</div>
                                                    <div className="text-muted text-sm">{badge.sub}</div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={i} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem',
                                                background: badge.boxStyle ? badge.boxStyle.background : `${badge.color}15`,
                                                border: badge.boxStyle ? badge.boxStyle.border : `1px solid ${badge.color}30`,
                                                borderRadius: '8px', padding: '0.5rem 0.75rem',
                                                minHeight: '52px',
                                                height: badge.alignBottom ? 'auto' : '100%', // Use auto height for bottom aligned items
                                                alignSelf: badge.alignBottom ? 'end' : 'auto', // Align to bottom of grid cell
                                                boxSizing: 'border-box'
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                    <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{badge.label}</div>
                                                    <div className="text-muted" style={{ fontSize: '0.75rem', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{badge.sub}</div>
                                                </div>
                                                <span style={{
                                                    fontWeight: 700,
                                                    color: badge.color,
                                                    fontSize: badge.mono ? '1.35rem' : '1.8rem',
                                                    fontFamily: badge.mono ? '"JetBrains Mono", monospace' : 'inherit',
                                                    lineHeight: 1,
                                                    minWidth: badge.mono ? '100px' : '65px',
                                                    display: 'flex',
                                                    justifyContent: 'flex-end'
                                                }}>
                                                    {badge.count}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Chart Section */}
            <MetricsSection />
        </div>
    );
};

// EKG/Cardiac Monitor Animation with loading and stress states
const EKGAnimation = ({ color = '#38bdf8', isLoading = false, isStressed = false }) => {
    // Precise Dot Tracking using SVG Path
    const pathRef = useRef(null);
    const dotRef = useRef(null);

    const loadingPath = `
        M 0 21 H 15 L 17 18 L 19 24 L 21 21 H 50
        M 50 21 H 60 L 62 19 L 64 21 H 100
        M 100 21 H 115 L 117 18 L 119 24 L 121 21 H 150
        M 150 21 H 160 L 162 19 L 164 21 H 200
    `;

    // Looping Paths (Perfectly seamless start/end)
    // 100px width per cycle. We draw 2 cycles (200px).
    // Start Y=21, End Y=21.
    const normalPath = `
        M 0 21 L 10 21 L 12 19 L 14 23 L 16 21 L 40 21 
        L 42 15 L 44 27 L 46 21 L 55 21 L 57 8 L 59 34 L 61 21 L 80 21
        L 82 18 L 84 24 L 86 21 L 100 21
        M 100 21 L 110 21 L 112 19 L 114 23 L 116 21 L 140 21 
        L 142 15 L 144 27 L 146 21 L 155 21 L 157 8 L 159 34 L 161 21 L 180 21
        L 182 18 L 184 24 L 186 21 L 200 21
    `;

    const stressedPath = `M 0 21 L 5 21 L 7 10 L 9 32 L 11 15 L 13 27 L 15 21 L 20 21 L 22 5 L 24 38 L 26 8 L 28 34 L 30 21 L 35 21 L 37 12 L 39 30 L 41 21 L 50 21 L 52 3 L 54 40 L 56 6 L 58 36 L 60 21 L 65 21 L 67 14 L 69 28 L 71 21 L 100 21 M 100 21 L 105 21 L 107 10 L 109 33 L 111 14 L 113 28 L 115 21 L 120 21 L 122 5 L 124 38 L 126 8 L 128 34 L 130 21 L 135 21 L 137 12 L 139 30 L 141 21 L 150 21 L 152 3 L 154 40 L 156 6 L 158 36 L 160 21 L 165 21 L 167 14 L 169 28 L 171 21 L 200 21`;

    const activePath = isLoading ? loadingPath : isStressed ? stressedPath : normalPath;
    const speed = isStressed ? 100 : 50; // Pixels per second

    useEffect(() => {
        let animationFrameId;
        const startTime = performance.now();

        const animate = () => {
            const now = performance.now();
            const elapsed = now - startTime;

            // Current X position in the loop (0 to 100)
            // We want the dot to stay at X=50 (center of container)
            // The graph moves LEFT. So relative to the graph start, the dot moves RIGHT.
            // Effective X on path = (Scanner Pos) % Loop Width
            // Scanner Pos = CenterOffset + (Speed * Time)
            const loopWidth = 100;
            const centerOffset = 50;
            const dist = (centerOffset + (elapsed * speed / 1000)) % loopWidth;

            // To handle the double-cycle drawing (0-200), we map to the first cycle (0-100)
            // But since the path is duplicated, we can just look up at `dist`.
            // However, since we are translating the SVG left, the "visual" center corresponds to a shifting X on the path.
            // Actually, simpler: The SVG moves left. The dot stays at fixed screen X=50.
            // ScreenX = PathX - TranslateX.
            // 50 = PathX - (Time * Speed) % 100
            // PathX = 50 + (Time * Speed) % 100

            // We'll just look up the point at PathX. If PathX > 100, we wrap or just use the 0-200 range logic.
            // Since our path is 200 wide (2 cycles), we can just mod 100 to stay in the first uniform cycle logic
            // providing the second cycle is identical (it is).

            if (pathRef.current && dotRef.current) {
                const scrollX = (elapsed * speed / 1000) % 100;
                const targetX = 50 + scrollX; // 50 is the fixed center position in the container

                // Get Y at this X
                // Search for point on path. `getPointAtLength` is based on length, not X. 
                // For a monotonic X graph, we can estimate or scan. 
                // But for EKG, X is monotonic.
                // We'll use a binary search or precise sampling if needed, but `getPointAtLength` is standard.
                // Since X is monotonic, Length ~ X. We can refine.
                // Or better: Use `pathLength` and ratio? No, line length != x length.

                // Optimized approach for EKG line (mostly horizontal-ish):
                // Iterate path segments? Too complex.
                // Binary search `getPointAtLength` until `.x` matches `targetX`.

                const len = pathRef.current.getTotalLength();
                let start = 0;
                let end = len / 2; // Only need first cycle roughly
                let targetPoint = { x: 0, y: 21 };

                // Quick binary search for X (10 iterations is usually plenty for screen precision)
                for (let i = 0; i < 12; i++) {
                    const mid = (start + end) / 2;
                    const p = pathRef.current.getPointAtLength(mid);
                    if (p.x < targetX) start = mid;
                    else end = mid;
                    targetPoint = p;
                }

                dotRef.current.style.transform = `translate(-50 %, -50 %) translate(0, ${targetPoint.y - 21}px)`; // Offset from Vertical Center (21)
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(animationFrameId);
    }, [activePath, speed]); // Re-bind when path changes

    return (
        <div style={{
            width: '100px',
            height: '42px', // Increased Height
            background: 'transparent',
            borderRadius: '4px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            // Mask for true fade-to-transparent effect at edges
            maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
        }}>
            {/* Fading Grid Background */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `linear - gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px), linear - gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)`,
                backgroundSize: '10px 10px', zIndex: 0
            }} />

            {/* EKG Path */}
            <svg width="200" height="42" viewBox="0 0 200 42" style={{
                position: 'absolute', left: 0,
                animation: `ekg-move ${100 / speed}s linear infinite`, // Speed control
                zIndex: 1
            }}>
                <path
                    ref={pathRef}
                    d={activePath}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: `drop-shadow(0 0 3px ${color})` }}
                />
            </svg>

            {/* Pulse Dot */}
            <div ref={dotRef} style={{
                position: 'absolute', left: '50%', top: '50%',
                width: '4px', height: '4px',
                borderRadius: '50%',
                background: '#fff',
                boxShadow: `0 0 4px #fff, 0 0 8px ${color}`,
                zIndex: 5,
                willChange: 'transform'
            }} />

            <style>{`
    @keyframes ekg-move {
        0% { transform: translateX(0); }
        100% { transform: translateX(-100px); }
    }
    `}</style>
        </div>
    );
};

// --- Sub-components ---





// Modal for Daily Breakdown
const DailyBreakdownModal = ({ date, data, totalUsers, onClose }) => {
    // Handle loading state
    if (!data) {
        return ReactDOM.createPortal(
            <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} onClick={onClose}>
                <div style={{ color: '#cbd5e1' }}>Loading...</div>
            </div>,
            document.body
        );
    }

    // Data is now a hierarchical tree: [{action, count, children: [] }]
    const items = Array.isArray(data) ? data : [];

    // Calculate global max for consistent bar scaling across all levels
    let maxVal = 1;
    items.forEach(root => {
        maxVal = Math.max(maxVal, root.count);
        if (root.children) {
            root.children.forEach(child => maxVal = Math.max(maxVal, child.count));
        }
    });

    // Helper to render a bar row
    const renderRow = (item, index, isChild = false, overrideColor = null) => {
        const percent = (item.count / maxVal) * 100;

        // Vibrant Palette for events
        const vibrantColors = [
            '#f472b6', // Pink
            '#a78bfa', // Purple
            '#22d3ee', // Cyan
            '#4ade80', // Green
            '#fb923c', // Orange
            '#facc15', // Yellow
        ];

        // Assign vibrant color: Use override (parent's color) if provided, otherwise cycle based on index
        const barColor = overrideColor || vibrantColors[index % vibrantColors.length];

        return (
            <div key={`${item.action} -${index} `} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: isChild ? '0.85rem' : '0.9rem' }}>
                    <span style={{ color: isChild ? '#cbd5e1' : '#e2e8f0', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isChild && <span style={{ opacity: 0.5 }}>↳</span>}
                        {(item.action || 'Unknown').replace(/_/g, ' ')}
                    </span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{item.count}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${percent}% `,
                        background: barColor,
                        borderRadius: '4px',
                        opacity: isChild ? 0.5 : 0.75, // Semi-transparent for "glass" vibe
                        boxShadow: `0 0 10px ${barColor} 66` // Glow for everyone
                    }} />
                </div>
            </div>
        );
    };

    const content = (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }} onClick={onClose}>
            <div
                className="card"
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    animation: 'scaleIn 0.2s ease-out',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                {/* Header - Styled to match ChartCard Header */}
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px 16px 0 0' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>👨‍👩‍👧‍👦</span>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>Daily Breakdown</h3>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                            {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        {totalUsers !== undefined && (
                            <div style={{ fontSize: '0.85rem', color: '#60a5fa', marginTop: '0.25rem', fontWeight: 500 }}>
                                Total Active Users: {totalUsers}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '1.5rem', cursor: 'pointer',
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>×</button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                    {items.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No detailed activity recorded for this day.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {items.map((root, i) => {
                                // Just pass null override so it cycles based on index.
                                // But for children, we want them to cycle relative to the total list or just their own index?
                                // "different colors no matter their root event".
                                // Let's use a simple counter or hash if possible, but index is easiest.
                                // To make children distinct from parent, we can offset the index.

                                return (
                                    <div key={i} style={{ marginBottom: root.children?.length ? '1rem' : '0' }}>
                                        {/* Render Root */}
                                        {renderRow(root, i, false)}

                                        {/* Render Children (Indented) */}
                                        {root.children && root.children.length > 0 && (
                                            <div style={{
                                                paddingLeft: '1.5rem',
                                                borderLeft: '2px solid #334155',
                                                marginLeft: '0.5rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem'
                                            }}>
                                                {/* Use (i + j + 1) to offset colors so child doesn't match parent exactly */}
                                                {root.children.map((child, j) => renderRow(child, i + j + 1, true))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(content, document.body);
};

// Reusable Chart Card Component with independent state
const ChartCard = ({ title, icon, type = 'line', dataKey, seriesConfig, showLegend = true, onPointClick }) => {
    const storageKey = `observability_scope_${title ? title.toLowerCase().replace(/\s+/g, '_') : 'default'} `;
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? parseInt(saved) : 7;
    });
    const [refreshInterval, setRefreshInterval] = useState(0);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const cardRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [animatedMetrics, setAnimatedMetrics] = useState([]);
    const hasAnimated = useRef(false);

    const fetchMetrics = async () => {
        try {
            const token = localStorage.getItem('nestfinder_admin_token');
            const res = await fetch(`${API_URL}/api/admin/metrics/history?days=${days}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMetrics(data.metrics || []);
            }
        } catch (err) {
            console.error('Failed to load metrics:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        fetchMetrics();
    }, [days]);

    useEffect(() => {
        if (refreshInterval > 0) {
            const interval = setInterval(fetchMetrics, refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [refreshInterval, days]);

    // Scroll Trigger & Animation
    useEffect(() => {
        if (isVisible || loading || metrics.length === 0) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.7, rootMargin: '0px 0px -50px 0px' });
        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, [loading, metrics.length, isVisible]);

    useEffect(() => {
        if (!metrics.length) return;

        if (!isVisible) {
            // Start zeroed
            const zeroed = metrics.map(m => {
                const newM = { ...m };
                seriesConfig.forEach(s => newM[s.key] = 0);
                return newM;
            });
            setAnimatedMetrics(zeroed);
            return;
        }

        if (hasAnimated.current) {
            // Update Animation: Staggered Wave from Left to Right
            let startTime;
            const totalDuration = 800;
            const staggerDelay = 400; // How long it takes for the start of animation to travel from left to right

            const animateUpdate = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;

                const current = metrics.map((m, i) => {
                    const newM = { ...m };
                    // Calculate start time for this specific point index
                    const myDelay = (i / (metrics.length - 1 || 1)) * staggerDelay;
                    // Calculate local progress (0 to 1) for this point
                    // Each point takes (totalDuration - staggerDelay) to fully rise
                    const pointDuration = totalDuration - staggerDelay;
                    const progress = Math.max(0, Math.min((elapsed - myDelay) / pointDuration, 1));

                    // QuartOut easing
                    const ease = 1 - Math.pow(1 - progress, 4);

                    seriesConfig.forEach(s => {
                        const target = m[s.key] || 0;
                        newM[s.key] = target * ease;
                    });
                    return newM;
                });

                setAnimatedMetrics(current);

                if (elapsed < totalDuration) {
                    requestAnimationFrame(animateUpdate);
                }
            };

            requestAnimationFrame(animateUpdate);
            return;
        }
        hasAnimated.current = true;

        let startTime;
        let animationFrame;
        const duration = 1000;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

            const current = metrics.map(m => {
                const newM = { ...m };
                seriesConfig.forEach(s => {
                    const target = m[s.key] || 0;
                    newM[s.key] = target * ease;
                });
                return newM;
            });

            setAnimatedMetrics(current);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);

    }, [isVisible, metrics, seriesConfig]);

    const displayData = animatedMetrics.length > 0 ? animatedMetrics : [];



    // Chart Dimensions
    const chartWidth = 800;
    const chartHeight = 220;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const graphWidth = chartWidth - padding.left - padding.right;
    const graphHeight = chartHeight - padding.top - padding.bottom;

    // Helper functions - add inner padding so bars don't overlap Y-axis
    const innerPadding = type === 'bar' ? graphWidth / (metrics.length * 2 || 1) : 0;
    const getX = (i) => innerPadding + (i / (metrics.length - 1 || 1)) * (graphWidth - innerPadding * 2);
    const getY = (val, max) => graphHeight - ((val / max) * graphHeight);

    // If initial load (no data), show placeholder.
    // If refreshing (data exists), show chart with overlay/opacity.
    if (loading && metrics.length === 0) {
        return (
            <div className="card" style={{ marginBottom: '1.5rem', background: '#1e293b', border: '1px solid #334155' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderBottom: '1px solid #334155', padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {typeof icon === 'string' ? <span style={{ fontSize: '1.2rem' }}>{icon}</span> : icon}
                        <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '1rem' }}>{title}</h3>
                    </div>
                    {renderControls()}
                </div>
                <div className="card-body" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    {loading ? 'Loading...' : 'No metrics data available'}
                </div>
            </div>
        );
    }

    // Calculate scales
    const allValues = seriesConfig.flatMap(s => metrics.map(m => m[s.key] || 0));
    const maxY = Math.max(...allValues, 5); // Minimum non-zero scale

    // Grid lines
    const gridLinesY = 5;

    function renderControls() {
        return (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                    value={days}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setDays(val);
                        localStorage.setItem(storageKey, val);
                    }}
                    style={{
                        background: '#334155', color: '#e2e8f0', border: '1px solid #475569',
                        borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer'
                    }}
                >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={180}>6 Months</option>
                    <option value={365}>1 Year</option>
                    <option value={36500}>All Time</option>
                </select>
                <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                    style={{
                        background: '#334155', color: '#e2e8f0', border: '1px solid #475569',
                        borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer'
                    }}
                >
                    <option value={0}>Refresh: Off</option>
                    <option value={30}>30s</option>
                    <option value={60}>1m</option>
                </select>
            </div>
        );
    }

    const renderLineChart = () => (
        <g>
            {seriesConfig.map(s => {
                const points = displayData.map((m, i) => `${getX(i)},${getY(m[s.key] || 0, maxY)} `).join(' ');
                const areaPoints = `0, ${graphHeight} ${points} ${graphWidth},${graphHeight} `;
                return (
                    <g key={s.key}>
                        <defs>
                            <linearGradient id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
                                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <polygon points={areaPoints} fill={`url(#gradient-${s.key})`} />
                        <polyline points={points} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        {displayData.map((m, i) => (
                            <circle
                                key={i}
                                cx={getX(i)}
                                cy={getY(m[s.key] || 0, maxY)}
                                r={hoveredPoint?.index === i ? 5 : 3}
                                fill={hoveredPoint?.index === i ? s.color : '#1e293b'}
                                stroke={s.color}
                                strokeWidth="2"
                                style={{ transition: 'r 0.1s ease', opacity: hoveredPoint && hoveredPoint.index !== i ? 0.5 : 1 }}
                            />
                        ))}
                    </g>
                );
            })}
        </g>
    );

    // Helper for heat-map color generation (Cool -> Hot)
    const getHeatColor = (value, min, max) => {
        if (max === min) return '#3b82f6'; // Default blue if no variance
        const ratio = (value - min) / (max - min);
        // Gradient: Blue (0) -> Cyan (0.25) -> Lime (0.5) -> Yellow (0.75) -> Red (1.0)
        if (ratio < 0.25) return '#3b82f6'; // Blue
        if (ratio < 0.5) return '#06b6d4';  // Cyan
        if (ratio < 0.75) return '#84cc16'; // Lime
        if (ratio < 0.9) return '#facc15';  // Yellow
        return '#ef4444';                   // Red
    };

    // Calculate min/max for heat coloring (Available to both renderBarChart and Tooltip)
    const heatValues = type === 'bar' ? metrics.map(m => m[seriesConfig[0].key] || 0) : [];
    const heatMin = Math.min(...heatValues);
    const heatMax = Math.max(...heatValues);

    const renderBarChart = () => {
        const barWidth = (graphWidth / displayData.length) * 0.3; // Half width (was 0.6)

        return (
            <g>
                {displayData.map((m, i) => {
                    const val = m[seriesConfig[0].key] || 0;
                    const h = (val / maxY) * graphHeight;
                    const x = getX(i) - (barWidth / 2);
                    const y = graphHeight - h;

                    // Use heat color for bar charts, otherwise series color
                    const color = type === 'bar' ? getHeatColor(val, heatMin, heatMax) : seriesConfig[0].color;
                    const isHovered = hoveredPoint?.index === i;

                    return (
                        <g key={i} onClick={(e) => {
                            e.stopPropagation();
                            if (onPointClick) onPointClick(m);
                        }} style={{ cursor: onPointClick ? 'pointer' : 'default' }}>
                            <rect
                                x={x} y={y} width={barWidth} height={h}
                                fill={color}
                                rx="2" ry="2"
                                opacity={isHovered ? 1 : 0.8}
                                style={{ transition: 'opacity 0.2s' }}
                            />
                        </g>
                    );
                })}
            </g>
        );
    };

    return (
        <div ref={cardRef} className="card" style={{ marginBottom: '1.5rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', borderRadius: '8px', backdropFilter: 'blur(8px)' }}>
            {/* Header */}
            <div className="card-header" style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid #334155', padding: '0.75rem 1rem', borderRadius: '8px 8px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {typeof icon === 'string' ? <span style={{ fontSize: '1.2rem' }}>{icon}</span> : icon}
                        <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
                    </div>
                    {/* Right-aligned controls */}
                    <div style={{ marginLeft: 'auto' }}>
                        {renderControls()}
                    </div>
                </div>
            </div>

            {/* Legend */}
            {showLegend && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', padding: '0.75rem 1rem', borderBottom: '1px solid #334155', background: 'transparent' }}>
                    {seriesConfig.map(s => {
                        // Check if this is our Heat Bar chart (Connected Clients)
                        const isHeatBar = type === 'bar' && seriesConfig.length === 1; // Simplest detection for now based on config

                        return (
                            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                                {/* Legend Icon: Gradient for HeatMap, Solid for Lines */}
                                <div style={{
                                    width: isHeatBar ? 24 : 12, // Wider for gradient
                                    height: 12,
                                    borderRadius: '2px',
                                    background: isHeatBar
                                        ? 'linear-gradient(to right, #3b82f6, #06b6d4, #84cc16, #facc15, #ef4444)' // Heat gradient
                                        : s.color
                                }} />
                                <span style={{ color: '#94a3b8' }}>{s.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Graph Body */}
            <div className="card-body" style={{ padding: '1rem', overflowX: 'auto', position: 'relative', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', pointerEvents: loading ? 'none' : 'auto' }}>
                {/* Loading Spinner Overlay if refreshing */}
                {loading && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        color: 'var(--color-primary)', fontWeight: 'bold', zIndex: 10,
                        background: 'rgba(15, 23, 42, 0.8)', padding: '0.5rem 1rem', borderRadius: '20px',
                        border: '1px solid #334155'
                    }}>
                        Updating...
                    </div>
                )}
                <svg
                    width="100%"
                    viewBox={`0 0 ${chartWidth} ${chartHeight} `}
                    style={{ minWidth: 600 }}
                    onMouseLeave={() => setHoveredPoint(null)}
                >
                    <g transform={`translate(${padding.left}, ${padding.top})`}>
                        {/* Y-Axis Grid & Labels */}
                        {Array.from({ length: gridLinesY + 1 }, (_, i) => {
                            const y = (i / gridLinesY) * graphHeight;
                            const val = Math.round(maxY - (i / gridLinesY) * maxY);
                            return (
                                <g key={i}>
                                    <line x1={0} y1={y} x2={graphWidth} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                                    <text x={-10} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">{val.toLocaleString('de-DE')}</text>
                                </g>
                            );
                        })}

                        {/* X-Axis Labels */}
                        {metrics.map((m, i) => {
                            // Calculate step based on number of days to prevent overlap (aim for ~8 labels)
                            const labelStep = Math.ceil(metrics.length / 8);
                            if (i % labelStep !== 0 && i !== metrics.length - 1) return null;

                            return (
                                <text key={i} x={getX(i)} y={graphHeight + 20} textAnchor="middle" fill="#64748b" fontSize="10">
                                    {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </text>
                            );
                        })}

                        {/* Render Chart Type */}
                        {type === 'bar' ? renderBarChart() : renderLineChart()}

                        {/* Hover Overlay Columns */}
                        {displayData.map((m, i) => (
                            <rect
                                key={`hover - col - ${i} `}
                                x={getX(i) - (graphWidth / displayData.length) / 2}
                                y={0}
                                width={graphWidth / displayData.length}
                                height={graphHeight}
                                fill="transparent"
                                style={{ cursor: onPointClick ? 'pointer' : 'default' }}
                                onMouseMove={(e) => {
                                    const y = e.nativeEvent.offsetY;
                                    setHoveredPoint({ index: i, x: getX(i), y });
                                }}
                                onMouseEnter={(e) => {
                                    const y = e.nativeEvent.offsetY;
                                    setHoveredPoint({ index: i, x: getX(i), y });
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onPointClick) onPointClick(metrics[i]);
                                }}
                            />
                        ))}
                    </g>
                </svg>

                {/* Tooltip */}
                {hoveredPoint !== null && metrics[hoveredPoint.index] && (() => {
                    // Clamp tooltip Y position to prevent cutoff/scroll (80px from top for tooltip height)
                    const tooltipY = Math.max(80, Math.min(chartHeight - 40, hoveredPoint.y ? hoveredPoint.y + padding.top : 80));
                    return (
                        <div style={{
                            position: 'absolute',
                            left: `${(hoveredPoint.x + padding.left) / chartWidth * 100}% `,
                            top: `${tooltipY} px`,
                            transform: `translate(${hoveredPoint.index > metrics.length * 0.6 ? 'calc(-100% - 15px)' : '15px'}, -50 %)`,
                            background: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            zIndex: 20,
                            pointerEvents: 'none',
                            minWidth: '120px'
                        }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 600, borderBottom: '1px solid #334155', marginBottom: '0.5rem', paddingBottom: '0.2rem', fontSize: '0.9rem' }}>
                                {new Date(metrics[hoveredPoint.index].date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            {seriesConfig.map(s => {
                                let tipColor = s.color;
                                if (type === 'bar' && seriesConfig.length === 1) {
                                    const val = metrics[hoveredPoint.index][s.key] || 0;
                                    tipColor = getHeatColor(val, heatMin, heatMax);
                                }
                                return (
                                    <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.25rem', gap: '1rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                            <span style={{ width: 8, height: 8, background: tipColor, borderRadius: '50%', flexShrink: 0 }} />
                                            {s.label}
                                        </span>
                                        <span style={{ color: '#fff', fontWeight: 500 }}>
                                            {(metrics[hoveredPoint.index][s.key] || 0).toLocaleString('de-DE')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

const MetricsSection = () => {
    const [breakdownDate, setBreakdownDate] = useState(null);
    const [breakdownData, setBreakdownData] = useState(null);
    const [breakdownTotal, setBreakdownTotal] = useState(0);

    // Ratings breakdown state
    const [ratingsBreakdown, setRatingsBreakdown] = useState(null);

    const handleClientBarClick = async (point) => {
        setBreakdownDate(point.date);
        setBreakdownTotal(point.users || 0); // Capture the Users metric from the bar point
        try {
            // Fix: Use adminApi.fetch instead of .get, and correct path if needed
            // Assuming /admin/metrics/daily-breakdown based on history endpoint
            const params = new URLSearchParams({ date: point.date });
            const data = await adminApi.fetch(`/ admin / metrics / daily - breakdown ? ${params} `);
            setBreakdownData(data.breakdown);
        } catch (err) {
            console.error(err);
            // Optional: set empty data or error state
            setBreakdownData({});
        }
    };

    const handleRatingsBarClick = (point) => {
        if (point.count > 0) {
            setRatingsBreakdown({
                date: point.date,
                count: point.count,
                average: point.average,
                breakdown: point.breakdown
            });
        }
    };

    // Memoized configurations to prevent infinite re-rendering of charts
    const clientSeries = useMemo(() => [
        { key: 'users', label: 'Total Users', color: '#06b6d4' }
    ], []);

    const sentSeries = useMemo(() => [
        { key: 'notifications', label: 'Total', color: '#8b5cf6' },
        { key: 'sent', label: 'Sent', color: '#facc15' },
        { key: 'delivered', label: 'Delivered', color: '#22c55e' },
        { key: 'read', label: 'Read', color: '#3b82f6' }
    ], []);

    const receivedSeries = useMemo(() => [
        { key: 'totalReceived', label: 'Total', color: '#8b5cf6' },
        { key: 'receivedPending', label: 'Pending', color: '#22c55e' },
        { key: 'receivedRead', label: 'Read', color: '#3b82f6' }
    ], []);

    return (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    📈 Trends Graphs
                </h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Clients Graph - FIRST */}
                <ChartCard
                    title="Connected Clients"
                    icon="👨‍👩‍👧‍👦"
                    type="bar"
                    seriesConfig={clientSeries}
                    showLegend={true}
                    onPointClick={handleClientBarClick}
                />

                {/* Notifications Sent Graph */}
                <ChartCard
                    title="Notifications Sent"
                    icon={<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', fontSize: '1rem' }}>↑</span>}
                    type="line"
                    seriesConfig={sentSeries}
                />

                {/* Notifications Received Graph */}
                <ChartCard
                    title="Notifications Received"
                    icon={<span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', fontSize: '1rem' }}>↓</span>}
                    type="line"
                    seriesConfig={receivedSeries}
                />

                {/* Ratings Graph */}
                <RatingsChartCard onPointClick={handleRatingsBarClick} />
            </div>

            {/* Render Popup */}
            {breakdownDate && (
                <DailyBreakdownModal
                    date={breakdownDate}
                    data={breakdownData}
                    totalUsers={breakdownTotal}
                    onClose={() => { setBreakdownDate(null); setBreakdownData(null); }}
                />
            )}

            {/* Ratings Breakdown Modal */}
            {ratingsBreakdown && (
                <RatingsBreakdownModal
                    data={ratingsBreakdown}
                    onClose={() => setRatingsBreakdown(null)}
                />
            )}
        </div>
    );
};

// Ratings Breakdown Modal
const RatingsBreakdownModal = ({ data, onClose }) => {
    const { date, count, average, breakdown } = data;
    const maxRating = Math.max(...Object.values(breakdown), 1);

    const starColors = {
        1: '#ef4444', // Red
        2: '#f97316', // Orange
        3: '#facc15', // Yellow
        4: '#84cc16', // Lime
        5: '#22c55e'  // Green
    };

    return ReactDOM.createPortal(
        <div
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '2rem'
            }}
        >
            <div style={{
                background: 'linear-gradient(145deg, #1e293b, #0f172a)', border: '1px solid #334155',
                borderRadius: '16px', padding: '1.5rem', maxWidth: '400px', width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.1rem' }}>
                            ⭐ Rating Breakdown
                        </h3>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>

                {/* Summary */}
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#facc15' }}>{average.toFixed(1)}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Avg Rating</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6' }}>{count}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Total Votes</div>
                    </div>
                </div>

                {/* Rating Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[5, 4, 3, 2, 1].map(star => {
                        const value = breakdown[star] || 0;
                        const pct = maxRating > 0 ? (value / maxRating) * 100 : 0;
                        return (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '50px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '1rem' }}>{'⭐'.repeat(1)}</span>
                                    <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{star}</span>
                                </div>
                                <div style={{ flex: 1, height: '24px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden', border: '1px solid #334155' }}>
                                    <div style={{
                                        width: `${pct}% `,
                                        height: '100%',
                                        background: `linear - gradient(90deg, ${starColors[star]}99, ${starColors[star]})`,
                                        borderRadius: '3px',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <div style={{ width: '40px', textAlign: 'right', color: '#e2e8f0', fontWeight: 600 }}>{value}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>,
        document.body
    );
};

// Ratings Chart Card Component (Area Chart with Stars)
const RatingsChartCard = ({ onPointClick }) => {
    const storageKey = 'observability_scope_ratings';
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? parseInt(saved) : 7;
    });
    const [refreshInterval, setRefreshInterval] = useState(0);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const cardRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [animatedRatings, setAnimatedRatings] = useState([]);
    const hasAnimated = useRef(false);

    const fetchRatings = async () => {
        try {
            const token = localStorage.getItem('nestfinder_admin_token');
            const res = await fetch(`${API_URL} /api/admin / metrics / ratings ? days = ${days} `, {
                headers: { 'Authorization': `Bearer ${token} ` }
            });
            if (res.ok) {
                const data = await res.json();
                setRatings(data.ratings || []);
            }
        } catch (err) {
            console.error('Failed to load ratings:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        fetchRatings();
    }, [days]);

    useEffect(() => {
        if (refreshInterval > 0) {
            const interval = setInterval(fetchRatings, refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [refreshInterval, days]);

    // Scroll Trigger & Animation
    useEffect(() => {
        if (isVisible || loading || ratings.length === 0) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.7, rootMargin: '0px 0px -50px 0px' });
        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, [loading, ratings.length, isVisible]);

    useEffect(() => {
        if (!ratings.length) return;

        if (!isVisible) {
            const zeroed = ratings.map(r => ({ ...r, count: 0, average: 0 }));
            setAnimatedRatings(zeroed);
            return;
        }

        if (hasAnimated.current) {
            // Update Animation: Staggered Wave
            let startTime;
            const totalDuration = 800;
            const staggerDelay = 400;

            const animateUpdate = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;

                const current = ratings.map((r, i) => {
                    // Calculate start time for this specific point index
                    const myDelay = (i / (ratings.length - 1 || 1)) * staggerDelay;
                    const pointDuration = totalDuration - staggerDelay;
                    const progress = Math.max(0, Math.min((elapsed - myDelay) / pointDuration, 1));

                    const ease = 1 - Math.pow(1 - progress, 4); // QuartOut

                    return {
                        ...r,
                        count: r.count * ease,
                        average: r.average * ease
                    };
                });

                setAnimatedRatings(current);

                if (elapsed < totalDuration) {
                    requestAnimationFrame(animateUpdate);
                }
            };
            requestAnimationFrame(animateUpdate);
            return;
        }
        hasAnimated.current = true;

        let startTime;
        let animationFrame;
        const duration = 1000;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);

            const current = ratings.map(r => ({
                ...r,
                count: r.count * ease,
                average: r.average * ease
            }));

            setAnimatedRatings(current);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [isVisible, ratings]);

    const displayData = animatedRatings.length > 0 ? animatedRatings : [];

    // Chart Dimensions
    const chartWidth = 800;
    const chartHeight = 220;
    const padding = { top: 20, right: 40, bottom: 40, left: 30 };
    const graphWidth = chartWidth - padding.left - padding.right;
    const graphHeight = chartHeight - padding.top - padding.bottom;

    // No inner padding - first point at 0, last point at graphWidth edge
    const getX = (i) => (i / (displayData.length - 1 || 1)) * graphWidth;
    const getY = (val) => graphHeight - ((val / 5) * graphHeight); // Scale 0-5

    // Get color based on rating value (1-5 scale)
    const getRatingColor = (avg) => {
        if (avg >= 4.5) return '#22c55e'; // Green
        if (avg >= 3.5) return '#84cc16'; // Lime
        if (avg >= 2.5) return '#facc15'; // Yellow
        if (avg >= 1.5) return '#f97316'; // Orange
        return '#ef4444'; // Red
    };

    const renderControls = () => (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
                value={days}
                onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setDays(val);
                    localStorage.setItem(storageKey, val);
                }}
                style={{
                    background: '#334155', color: '#e2e8f0', border: '1px solid #475569',
                    borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer'
                }}
            >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
                <option value={180}>6 Months</option>
                <option value={365}>1 Year</option>
                <option value={36500}>All Time</option>
            </select>
            <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                style={{
                    background: '#334155', color: '#e2e8f0', border: '1px solid #475569',
                    borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer'
                }}
            >
                <option value={0}>Refresh: Off</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
            </select>
        </div>
    );

    if (loading && ratings.length === 0) {
        return (
            <div className="card" style={{ marginBottom: '1.5rem', background: '#1e293b', border: '1px solid #334155' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderBottom: '1px solid #334155', padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>⭐</span>
                        <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '1rem' }}>App Ratings</h3>
                    </div>
                    {renderControls()}
                </div>
                <div className="card-body" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    {loading ? 'Loading...' : 'No ratings data available yet'}
                </div>
            </div>
        );
    }

    // Filter to only show days with data for the area chart
    const hasData = displayData.some(r => r.count > 0);
    const maxY = 5; // Ratings are 1-5

    // Build area path
    const points = displayData.map((r, i) => `${getX(i)},${getY(r.average || 0)} `).join(' ');
    const areaPoints = `0, ${graphHeight} ${points} ${graphWidth},${graphHeight} `;

    return (
        <div ref={cardRef} className="card" style={{ marginBottom: '1.5rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', borderRadius: '8px', backdropFilter: 'blur(8px)' }}>
            {/* Header */}
            <div className="card-header" style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid #334155', padding: '0.75rem 1rem', borderRadius: '8px 8px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>⭐</span>
                        <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '1rem', fontWeight: 600 }}>App Ratings</h3>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        {renderControls()}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', padding: '0.75rem 1rem', borderBottom: '1px solid #334155', background: 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <span style={{
                        fontSize: '1.8rem',
                        background: 'linear-gradient(to right, #ef4444, #f97316, #facc15, #84cc16, #22c55e)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>★</span>
                    <span style={{ color: '#94a3b8' }}>Avg Rating (1-5)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <span style={{ width: 12, height: 12, background: '#3b82f6', borderRadius: '2px' }} />
                    <span style={{ color: '#94a3b8' }}>Votes</span>
                </div>
            </div>

            {/* Graph Body */}
            <div className="card-body" style={{ padding: '1rem', overflowX: 'auto', position: 'relative', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', pointerEvents: loading ? 'none' : 'auto' }}>
                {loading && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        color: 'var(--color-primary)', fontWeight: 'bold', zIndex: 10,
                        background: 'rgba(15, 23, 42, 0.8)', padding: '0.5rem 1rem', borderRadius: '20px',
                        border: '1px solid #334155'
                    }}>
                        Updating...
                    </div>
                )}
                <svg
                    width="100%"
                    viewBox={`0 0 ${chartWidth} ${chartHeight} `}
                    style={{ minWidth: 600 }}
                    onMouseLeave={() => setHoveredPoint(null)}
                >
                    <defs>
                        <linearGradient id="ratings-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#facc15" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#facc15" stopOpacity="0.05" />
                        </linearGradient>
                    </defs>
                    <g transform={`translate(${padding.left}, ${padding.top})`}>
                        {/* Y-Axis Grid & Labels (Left - Ratings 1-5) */}
                        {[1, 2, 3, 4, 5].map((val) => {
                            const y = getY(val);
                            return (
                                <g key={`grid - ${val} `}>
                                    <line x1={0} y1={y} x2={graphWidth} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                                    <text x={-10} y={y + 4} textAnchor="end" fill="#facc15" fontSize="11" fontWeight="500">{val}</text>
                                </g>
                            );
                        })}

                        {/* Y-Axis Labels (Right - Votes) */}
                        {(() => {
                            const maxVotes = Math.max(...ratings.map(r => r.count || 0), 5); // Ensure at least 5 for scale
                            // Generate 4-5 ticks for votes
                            const ticks = 4;
                            return Array.from({ length: ticks + 1 }).map((_, i) => {
                                const val = Math.round((i / ticks) * maxVotes);
                                const y = graphHeight - (i / ticks) * graphHeight;
                                // Don't render 0 if it overlaps too much, or render it clearly
                                return (
                                    <text key={`vote - ${i} `} x={graphWidth + 6} y={y + 4} textAnchor="start" fill="#3b82f6" fontSize="11" fontWeight="500">
                                        {val}
                                    </text>
                                );
                            });
                        })()}

                        {/* X-Axis Labels */}
                        {displayData.map((r, i) => {
                            // Calculate step based on number of days to prevent overlap
                            const labelStep = days > 14 ? 5 : (days > 7 ? 2 : 1);
                            if (i % labelStep !== 0 && i !== displayData.length - 1) return null;

                            return (
                                <text key={i} x={getX(i)} y={graphHeight + 20} textAnchor="middle" fill="#64748b" fontSize="10">
                                    {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </text>
                            );
                        })}

                        {/* Votes Bars - Scaled to Right Axis (Votes) */}
                        {(() => {
                            const maxVotes = Math.max(...displayData.map(r => r.count || 0), 5);
                            const barWidth = Math.max(6, (graphWidth / displayData.length) * 0.4);
                            return displayData.map((r, i) => {
                                const barHeight = (r.count / maxVotes) * graphHeight; // Full height scale for votes axis

                                // Adjust x position for edges to prevent overflow
                                let barX = getX(i) - barWidth / 2;
                                if (i === 0) barX = getX(i); // First bar aligns left
                                if (i === ratings.length - 1) barX = getX(i) - barWidth; // Last bar aligns right

                                return (
                                    <rect
                                        key={`bar - ${i} `}
                                        x={barX}
                                        y={graphHeight - barHeight}
                                        width={barWidth}
                                        height={barHeight}
                                        fill="#3b82f6"
                                        opacity={hoveredPoint?.index === i ? 0.9 : 0.3} // Lower base opacity to not obscure grid too much
                                        rx={2}
                                        style={{ transition: 'opacity 0.15s ease' }}
                                    />
                                );
                            });
                        })()}

                        {/* Area Fill (Ratings - Left Axis) */}
                        {hasData && <polygon points={areaPoints} fill="url(#ratings-gradient)" />}

                        {/* Line (Ratings - Left Axis) */}
                        {hasData && <polyline points={points} fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                        {/* Data Points (Ratings - Left Axis) */}
                        {displayData.map((r, i) => (
                            <text
                                key={i}
                                x={getX(i)}
                                y={getY(r.average || 0)}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize={hoveredPoint?.index === i ? 20 : (r.count > 0 ? 16 : 10)}
                                fill={r.count > 0 ? getRatingColor(r.average) : '#475569'}
                                style={{ transition: 'font-size 0.1s ease, fill 0.2s', cursor: r.count > 0 ? 'pointer' : 'default' }}
                            >
                                ★
                            </text>
                        ))}

                        {/* Hover Overlay Columns */}
                        {displayData.map((r, i) => (
                            <rect
                                key={`hover - col - ${i} `}
                                x={getX(i) - (graphWidth / displayData.length) / 2}
                                y={0}
                                width={graphWidth / displayData.length}
                                height={graphHeight}
                                fill="transparent"
                                style={{ cursor: r.count > 0 ? 'pointer' : 'default' }}
                                onMouseMove={(e) => setHoveredPoint({ index: i, x: getX(i), y: e.nativeEvent.offsetY })}
                                onMouseEnter={(e) => setHoveredPoint({ index: i, x: getX(i), y: e.nativeEvent.offsetY })}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onPointClick && r.count > 0) onPointClick(r);
                                }}
                            />
                        ))}
                    </g>
                </svg>

                {/* Tooltip */}
                {hoveredPoint !== null && ratings[hoveredPoint.index] && (() => {
                    // Clamp tooltip Y position to prevent cutoff/scroll
                    const tooltipY = Math.max(40, Math.min(chartHeight - 40, hoveredPoint.y ? hoveredPoint.y + padding.top : 60));
                    return (
                        <div style={{
                            position: 'absolute',
                            left: `${(hoveredPoint.x + padding.left) / chartWidth * 100}% `,
                            top: `${tooltipY} px`,
                            transform: `translate(${hoveredPoint.index > ratings.length * 0.6 ? 'calc(-100% - 15px)' : '15px'}, -50 %)`,
                            background: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            zIndex: 20,
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap'
                        }}>
                            <div style={{ color: '#e2e8f0', fontWeight: 600, borderBottom: '1px solid #334155', marginBottom: '0.5rem', paddingBottom: '0.2rem', fontSize: '0.9rem' }}>
                                {new Date(ratings[hoveredPoint.index].date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.25rem', gap: '1.5rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                                    <span style={{ width: 8, height: 8, background: '#facc15', borderRadius: '50%' }} />
                                    Avg Rating
                                </span>
                                <span style={{ color: '#fff', fontWeight: 500 }}>
                                    ⭐ {ratings[hoveredPoint.index].average > 0 ? ratings[hoveredPoint.index].average.toFixed(1) : '-'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', gap: '1.5rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8' }}>
                                    <span style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '2px' }} />
                                    Votes
                                </span>
                                <span style={{ color: '#fff', fontWeight: 500 }}>
                                    {ratings[hoveredPoint.index].count}
                                </span>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};









