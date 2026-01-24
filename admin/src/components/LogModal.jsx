import React, { useEffect, useState, useRef } from 'react';
import { adminApi } from '../api';

const LogModal = ({ user, onClose, onUserUpdate }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(user?.debug_enabled ?? true);
    const [lastBatchId, setLastBatchId] = useState(0);
    const [filterQuery, setFilterQuery] = useState('');
    const [filterLevel, setFilterLevel] = useState([]);
    const [filterSeverity, setFilterSeverity] = useState([]);

    // Dropdown States
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [showLevelDropdown, setShowLevelDropdown] = useState(false);
    const [showSeverityDropdown, setShowSeverityDropdown] = useState(false);
    const [showActiveFilters, setShowActiveFilters] = useState(false);

    const contentRef = useRef(null);
    const scrollRef = useRef(null);
    const pollingRef = useRef(null);
    const selectorRef = useRef(null);
    const searchRef = useRef(null);
    const levelRef = useRef(null);
    const severityRef = useRef(null);

    // Debug Level Selector State (Footer)
    const [showLevelSelector, setShowLevelSelector] = useState(false);

    // --- RESTORED STATE ---
    const isUserScrollingRef = useRef(false);
    const [copied, setCopied] = useState(false);
    const [isColorEnabled, setIsColorEnabled] = useState(false);
    const [liveTime, setLiveTime] = useState(new Date());
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [refreshDots, setRefreshDots] = useState('');
    const [animating, setAnimating] = useState(false);

    const handleSetLevel = async (newLevel) => {
        try {
            if (newLevel === 'off') {
                if (user.debug_enabled) {
                    await adminApi.toggleDebug(user.id);
                    if (onUserUpdate) onUserUpdate({ debug_enabled: false });
                    setIsFollowing(false); // Stop live following
                }
            } else {
                await adminApi.setDebugLevel(user.id, newLevel);
                if (!user.debug_enabled) {
                    await adminApi.toggleDebug(user.id);
                }
                if (onUserUpdate) onUserUpdate({ debug_enabled: true, debug_level: newLevel });
                setIsFollowing(true); // Auto-start live following
            }
            setShowLevelSelector(false);
        } catch (err) {
            console.error('Failed to set debug level:', err);
            setError(err.message);
        }
    };

    // Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchDropdown(false);
            }
            if (levelRef.current && !levelRef.current.contains(event.target)) {
                setShowLevelDropdown(false);
            }
            if (severityRef.current && !severityRef.current.contains(event.target)) {
                setShowSeverityDropdown(false);
            }
            if (selectorRef.current && !selectorRef.current.contains(event.target)) {
                setShowLevelSelector(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // --- SMART PARSER LOGIC ---
    const parseSearchQuery = (query) => {
        if (!query) return [];
        const tokens = [];
        let remaining = query;

        // 1. Extract Quoted Strings (Exact Match): 'foo bar'
        const quoteRegex = /'([^']+)'/g;
        let match;
        while ((match = quoteRegex.exec(remaining)) !== null) {
            tokens.push({ type: 'exact', value: match[1] });
            remaining = remaining.replace(match[0], ' ');
        }

        // 2. Extract Bracket Groups: [API] [Notifications]
        // Split each bracket into its own token to allow OR logic across different bracket sets
        const bracketRegex = /\[([^\]]+)\]/g;
        while ((match = bracketRegex.exec(remaining)) !== null) {
            tokens.push({ type: 'category', tags: [match[1].trim()] });
            remaining = remaining.replace(match[0], ' ');
        }

        // 3. Extract Remaining Words (OR Logic default, unless timestamp)
        const words = remaining.trim().split(/\s+/).filter(w => w);
        words.forEach(w => {
            // Check for Timestamp (simple check: includes :)
            if (w.includes(':')) tokens.push({ type: 'timestamp', value: w });
            else tokens.push({ type: 'text', value: w });
        });

        return tokens;
    };

    // --- FILTER LOGIC ---
    const getFilteredLogs = () => {
        if (!filterQuery && filterLevel.length === 0 && filterSeverity.length === 0) return logs;

        const tokens = parseSearchQuery(filterQuery);

        return logs.filter(log => {
            // Parse line if string
            let logObj = log;
            if (typeof log === 'string') {
                // ... helper extraction ...
                // (Using parseLogLine logic extraction for filtering is expensive. 
                //  Better to rely on structured check or simple string check)
                //  For speed, we'll assume structured if available, else string match.
                //  BUT `logs` state can contain strings from server backend sometimes? 
                //  Usually `adminApi.getUserLogs` returns objects.
            }
            const { category = '', level = 'INFO', msg = '', ts = '', dl = 'default' } = (typeof log === 'object' ? log : {});
            if (typeof log === 'string') return true; // Fail safe

            // 1. Level Filter (Debug Level: D/A/P)
            // Check if filterLevel includes the log's dl (case-insensitive)
            const logDl = (dl || 'default').toLowerCase();
            const dlMatch = filterLevel.length === 0 || filterLevel.some(f => f.toLowerCase() === logDl);

            // 2. Severity Filter (INFO, WARN...)
            const logSeverity = (level || 'INFO').toUpperCase();
            const severityMatch = filterSeverity.length === 0 || filterSeverity.some(f => f.toUpperCase() === logSeverity);

            if (!dlMatch || !severityMatch) return false;

            // 3. Search Query (Tokens -> OR Logic between Token Groups)
            if (tokens.length === 0) return true;

            return tokens.some(token => {
                if (token.type === 'category') {
                    // ALL tags must be present in the Category string
                    // Category string: "Settings" or "[Settings][Interaction]"?
                    // Server sends "Settings" usually. 
                    // Wait, `logger.js` sends ARRAY `['Settings', 'Interaction']`.
                    // DB `client_logs` stores `category` as string? 
                    // `logger.js` joins with space? Yes `[A] [B]`.
                    // So we check if `category` string contains `[Tag]`.
                    return token.tags.every(tag => category.toLowerCase().includes(tag.toLowerCase()));
                }
                if (token.type === 'exact') {
                    return (msg + ' ' + category).toLowerCase().includes(token.value.toLowerCase());
                }
                if (token.type === 'timestamp') {
                    return ts.includes(token.value);
                }
                if (token.type === 'text') {
                    return (msg + ' ' + category).toLowerCase().includes(token.value.toLowerCase());
                }
                return false;
            });
        });
    };

    const filteredLogs = getFilteredLogs();




    // --- High-Fidelity Colorful Brand SVGs ---
    const Icons = {
        // Apple - Chromed (Gradient)
        Apple: (
            <svg width="16" height="16" viewBox="0 0 24 24">
                <defs>
                    <linearGradient id="appleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="20%" stopColor="#E8E8E8" />
                        <stop offset="50%" stopColor="#A4A4A4" />
                        <stop offset="80%" stopColor="#5E5E5E" />
                        <stop offset="100%" stopColor="#333333" />
                    </linearGradient>
                </defs>
                <path d="M17.3,12.7c0,2.4,2.5,3.6,2.6,3.7c-0.1,0.2-0.5,1.7-1.6,3.3c-1,1.4-2,2.8-3.6,2.8 c-1.5,0-2-0.9-3.7-0.9c-1.8,0-2.3,0.9-3.8,0.9c-1.5,0-2.7-1.5-3.8-3.2c-1.9-2.9-1.6-7-0.1-9.7c1.4-2.4,3.7-2.6,4.9-2.6 c1.7,0,3.1,1,4.1,1c1.1,0,2.6-1.5,4.7-1.3c0.4,0,2.4,0.1,4.2,2.3C21.1,9.3,17.4,10.6,17.3,12.7z M12.9,6.1 c0.8-1,1.3-2.3,1.2-3.8c-1.2,0.1-2.5,0.8-3.3,1.8C10,5,9.6,6.3,9.7,7.7C11,7.8,12.2,7,12.9,6.1z" fill="url(#appleGradient)" />
            </svg>
        ),
        // Android - Green
        Android: <svg width="16" height="16" viewBox="0 0 24 24" fill="#3DDC84"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.72l1.927-3.337c.1691-.2955.0688-.6718-.2256-.8421-.2949-.1691-.6702-.0681-.8404.2268l-1.9161 3.3183c-1.8211-1.0275-4.0792-1.6253-6.5262-1.6253-2.447 0-4.7061.5978-6.5273 1.6253L1.8568 4.6706c-.1691-.2949-.5454-.3959-.8393-.2268-.2955.1703-.3959.5466-.2268.8421l1.927 3.337C.683 10.3802 0 13.062 0 15.9055c0 .1085.0087.2158.0253.3218h23.9493c.0166-.106.0264-.2133.0264-.3218 0-2.8435-.683-5.5253-2.7032-7.2841" /></svg>,
        // Windows - Blue
        Windows: <svg width="16" height="16" viewBox="0 0 24 24" fill="#00A4EF"><path d="M0,3.449L9.124,2.193v8.834H0V3.449z M9.124,12.915v8.892L0,20.555v-7.64H9.124z M10.41,1.968L24,0v11.027H10.41V1.968z M10.41,12.914H24v11.086L10.41,22.03V12.914z" /></svg>,
        // Linux - Yellow (Tux)
        Linux: <svg width="16" height="16" viewBox="0 0 24 24" fill="#FCC624"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.468v.008c.001.118.014.227.042.327.016.063.04.134.065.2a1.413 1.413 0 00-.087.04c-.073.04-.152.037-.235.134l-.004.003-.004.003a.86.86 0 01-.2-.333c-.14-.266-.14-.668-.14-.668v-.024c.003-.2.03-.4.1-.6.058-.133.159-.266.275-.399.116-.133.29-.199.457-.199h.019z" /></svg>,
        // iPhone (Realistic) - Detailed Dark Mode with Bezels
        Phone: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="2" width="12" height="20" rx="2.5" fill="#1C1C1E" stroke="#5E5E5E" strokeWidth="1.2" />
                <rect x="7" y="3.5" width="10" height="17" fill="#000" rx="0.5" />
                {/* Wallpaper/Screen representation */}
                <rect x="7" y="3.5" width="10" height="17" fill="url(#screenGradient)" opacity="0.3" rx="0.5" />
                <defs>
                    <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF3b30" />
                        <stop offset="50%" stopColor="#007aff" />
                        <stop offset="100%" stopColor="#5856d6" />
                    </linearGradient>
                </defs>
                <path d="M10.5 3H13.5" stroke="#444" strokeWidth="1" strokeLinecap="round" />
            </svg>
        ),
        // Safari - Accurate (Blue Compass with Detailed Needle)
        Safari: (
            <svg width="18" height="18" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="11" fill="#1B90F7" />
                {/* Detailed Ticks */}
                <circle cx="12" cy="12" r="9" fill="none" stroke="#FFF" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.4" />
                <path d="M12 2V5 M12 19V22 M2 12H5 M19 12H22" stroke="#FFF" strokeWidth="1" opacity="0.6" />
                {/* Needle */}
                <polygon points="12,5 14.5,12 12,19 9.5,12" fill="#FFF" />
                <polygon points="12,5 14.5,12 12,12 12,12" fill="#FF3B30" />
                <path d="M12,5 L12,12 L14.5,12 Z" fill="#FF3B30" />
                <circle cx="12" cy="12" r="1.5" fill="#1B90F7" />
            </svg>
        ),
        // Chrome - Classic Logo
        Chrome: <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4285F4" /><circle cx="12" cy="12" r="4" fill="#fff" /><path d="M12 8 L20.5 8 A10 10 0 0 1 16 20" fill="#34A853" /><path d="M8 12 L3.5 20 A10 10 0 0 1 3.5 4" fill="#FBBC04" /><path d="M16 12 L20.5 4 A10 10 0 0 0 3.5 4 L8 12" fill="#EA4335" /><circle cx="12" cy="12" r="4" fill="#fff" /></svg>,
        // Firefox - High Fidelity Logo
        Firefox: <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF7139"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /><circle cx="12" cy="12" r="6" fill="#FF7139" /></svg>,
        // Edge - Modern Logo
        Edge: <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.76 0 5.26-1.12 7.07-2.93l-1.41-1.41C16.15 19.15 14.15 20 12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8c2.15 0 4.15.85 5.66 2.34l1.41-1.41C17.26 3.12 14.76 2 12 2z" /></svg>,
        // Brave - Detailized Lion Logo
        Brave: <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF5000"><path d="M12 2L4 6v8c0 5.5 8 10 8 10s8-4.5 8-10V6l-8-4zm0 17c-4.4 0-8-3.6-8-8 0-1.1.2-2.1.6-3L12 12l7.4-4c.4.9.6 1.9.6 3 0 4.4-3.6 8-8 8z" /></svg>,
        // Opera - Bold Red O
        Opera: <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF1B2D"><circle cx="12" cy="12" r="10" stroke="#FF1B2D" strokeWidth="4" fill="none" /></svg>,
        // World - Globe for IP
        World: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
    };

    // Category color map for COLOR toggle
    // Category color map for COLOR toggle (Harmonious/Professional Palette)
    const CATEGORY_COLORS = {
        System: '#94a3b8',      // Slate 400 (Neutral/Structure)
        API: '#60a5fa',         // Blue 400 (Information/Network)
        Interaction: '#fbbf24', // Amber 400 (Action/Warning-lite)
        MapView: '#22d3ee',     // Cyan 400 (Spatial/Map)
        Auth: '#a78bfa',        // Violet 400 (Security/Identity)
        Debug: '#a1a1aa',       // Zinc 400 (Low-level/Noise)
        App: '#f472b6',         // Pink 400 (Core Application)
        Report: '#34d399',      // Emerald 400 (Success/Status)
        Inbox: '#818cf8',       // Indigo 400 (Messaging)
        Settings: '#a8a29e',    // Stone 400 (Configuration)
        Home: '#38bdf8',        // Sky 400 (Dashboard)
        Action: '#84cc16',      // Lime 500 (Workflows)
        Default: '#94a3b8'
    };

    // Static Manifest for comprehensive dropdowns (Matches DEBUG_EVENT_MANIFEST.md)
    const STATIC_SUBCATEGORIES = {
        System: ['Internal', 'Initialization', 'Status', 'Location'],
        Auth: ['Login', 'Logout', 'Session'],
        Interaction: ['Menu', 'View', 'Button', 'Input', 'Composer', 'Toggle', 'Navigation'],
        Settings: ['Performance', 'Retention Period', 'Recovery Key', 'Saved'],
        Inbox: ['Sent', 'Composer', 'Message'],
        Report: ['Success', 'Submission'],
        MapView: ['Nav', 'Context'],
        API: ['Notifications', 'Points', 'Authentication', 'Settings', 'Admin', 'Debug', 'App'],
        App: ['Crash', 'Lifecycle'],
        Action: ['Workflow', 'Completed'],
        Debug: ['Logger', 'Status']
    };

    const fetchLogs = async (sinceId = 0) => {
        try {
            const res = await adminApi.getUserLogs(user.id, sinceId);
            if (sinceId === 0) {
                setLogs(res.logs || []);
                setLastBatchId(res.max_id || 0);
                setError(null); // Clear any previous error on full refresh
            } else if (res.logs && res.logs.length > 0) {
                setLogs(prev => [...prev, ...res.logs]);
                setLastBatchId(res.max_id);
            }
        } catch (err) {
            if (sinceId === 0) {
                setError(err.message);
            } else {
                console.warn('Log polling failed:', err.message);
            }
        } finally {
            if (sinceId === 0) setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        if (user) {
            fetchLogs(0);
        }
    }, [user]);

    // Parse User Agent and metadata from logs
    useEffect(() => {
        if (!logs.length) return;

        // Look for any log entry that has metadata (injected by server into 'data')
        const initLog = logs.find(l => {
            const data = typeof l === 'object' ? l.data : null;
            return data && (data.userAgent || data.platform || data.ip);
        }) || logs[0]; // Fallback to first log

        if (initLog) {
            let data = typeof initLog === 'object' ? initLog.data : null;

            // Legacy handling
            if (!data && typeof initLog === 'string' && initLog.includes('{')) {
                try { data = JSON.parse(initLog.substring(initLog.indexOf('{'))); } catch { }
            }

            if (data) {
                const ua = data.userAgent || '';
                const plat = data.platform || '';

                let os = { icon: 'Windows', name: 'Windows', ver: '' };
                let device = { icon: null, name: null };
                let browser = { icon: 'Browser', name: 'Browser', ver: '' };

                // OS / Platform
                if (plat.includes('Win')) os = { icon: 'Windows', name: 'Windows', ver: '' };
                else if (plat.includes('Mac')) os = { icon: 'Apple', name: 'macOS', ver: '' };
                else if (plat.includes('Linux')) os = { icon: 'Linux', name: 'Linux', ver: '' };
                else if (ua.includes('iPhone') || ua.includes('iPad')) os = { icon: 'Apple', name: 'iOS', ver: '' };
                else if (ua.includes('Android')) os = { icon: 'Android', name: 'Android', ver: '' };

                // Version Extraction
                if (os.name === 'iOS') {
                    const match = ua.match(/OS (\d+[._]\d+)/);
                    if (match) os.ver = match[1].replace('_', '.');
                    device = { icon: 'Phone', name: 'iPhone' };
                } else if (os.name === 'Android') {
                    const match = ua.match(/Android (\d+(\.\d+)?)/);
                    if (match) os.ver = match[1];
                    device = { icon: 'Phone', name: 'Device' };
                } else if (os.name === 'macOS') {
                    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
                    if (match) os.ver = match[1].replace('_', '.');
                } else if (os.name === 'Windows') {
                    if (ua.includes('Windows NT 10.0')) os.ver = '10/11';
                    else if (ua.includes('Windows NT 6.3')) os.ver = '8.1';
                }

                // Browser Detection
                if (ua.includes('Edg/')) {
                    browser = { icon: 'Edge', name: 'Edge', ver: ua.split('Edg/')[1].split(' ')[0] };
                }
                else if (ua.includes('OPR/') || ua.includes('Opera')) {
                    browser = { icon: 'Opera', name: 'Opera', ver: ua.split('OPR/')[1]?.split(' ')[0] || '' };
                }
                else if (ua.includes('Brave')) {
                    browser = { icon: 'Brave', name: 'Brave', ver: '' };
                }
                else if (ua.includes('Chrome/')) {
                    const ver = ua.split('Chrome/')[1].split(' ')[0];
                    browser = { icon: 'Chrome', name: 'Chrome', ver };
                }
                else if (ua.includes('Firefox/')) {
                    const ver = ua.split('Firefox/')[1].split(' ')[0];
                    browser = { icon: 'Firefox', name: 'Firefox', ver };
                }
                else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
                    browser = { icon: 'Safari', name: 'Safari', ver: ua.split('Version/')[1]?.split(' ')[0] || '' };
                }

                // IP Address - Now reliable via server injection
                const ip = data.ip || data.publicIp || null;

                setDeviceInfo({ os, device, browser, ip });
            }
        }
    }, [logs]);

    // Live Text Animation
    useEffect(() => {
        if (!isFollowing) {
            setRefreshDots('');
            setAnimating(false);
            return;
        }

        if (logs.length > 0 && isFollowing) {
            setAnimating(true);
            let step = 0;

            const interval = setInterval(() => {
                step++;
                const dotCount = (step % 4);
                if (dotCount === 0) setRefreshDots('');
                else setRefreshDots('.'.repeat(dotCount));

                if (step >= 8) {
                    clearInterval(interval);
                    setAnimating(false);
                    setRefreshDots('');
                }
            }, 500);

            return () => clearInterval(interval);
        }
    }, [logs.length, isFollowing]);

    // Polling fetch
    useEffect(() => {
        if (isFollowing && user) {
            pollingRef.current = setInterval(() => {
                fetchLogs(lastBatchId);
            }, 3000);
        } else {
            if (pollingRef.current) clearInterval(pollingRef.current);
        }

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [isFollowing, user, lastBatchId]);

    // Auto-scroll logic
    useEffect(() => {
        if (isFollowing && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isFollowing]);

    // Live timer
    useEffect(() => {
        const timer = setInterval(() => setLiveTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- HELPERS & STYLES ---
    const getLevelStyles = (lvl) => {
        const l = lvl?.toLowerCase() || '';
        if (l.includes('error') || l.includes('fail')) return { color: '#ef4444', label: 'ERROR' };
        if (l.includes('warn')) return { color: '#fbbf24', label: 'WARN' };
        if (l.includes('debug')) return { color: '#a855f7', label: 'DEBUG' };
        if (l.includes('system')) return { color: '#10b981', label: 'SYSTEM' };
        if (l.includes('success')) return { color: '#22c55e', label: 'SUCCESS' }; // Distinct Green
        return { color: '#3b82f6', label: 'INFO' };
    };

    const getDlStyle = (sourceLvl) => {
        const s = (sourceLvl || 'default').toLowerCase();
        if (s === 'paranoic') return { color: '#ef4444', char: 'P' };
        if (s === 'aggressive') return { color: '#a855f7', char: 'A' };
        return { color: '#3b82f6', char: 'D' };
    };

    const Badge = ({ char, color, size = '18px', fontSize = '0.65rem' }) => (
        <span style={{
            fontSize: fontSize,
            fontWeight: 900,
            color: color,
            backgroundColor: `${color}22`,
            border: `1px solid ${color}44`,
            width: size,
            height: size,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            flexShrink: 0,
            lineHeight: 1,
            boxSizing: 'border-box'
        }}>
            {char}
        </span>
    );

    // Syntax Highlighting parser
    const parseLogLine = (line) => {
        let ts, level, category, msg, data, dl;

        if (typeof line === 'object' && line !== null) {
            ({ ts, level, category, msg, data, dl } = line);
        } else if (typeof line === 'string') {
            if (line.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(line);
                    ({ ts, level, category, msg, data } = parsed);
                } catch { }
            }

            if (!ts) {
                const regex = /^(\d{2}-\d{2}-\d{4} - \d{2}:\d{2}:\d{2}) (CET|CEST) \[([\w\s]+)\]\s*\[([\w\s]+)\] (.+)$/;
                const match = line.match(regex);
                if (!match) return <span style={{ color: '#94a3b8' }}>{line}</span>;
                [_, ts, category, level, msg] = match;
            }
        } else {
            return <span style={{ color: '#ef4444' }}>[INVALID LOG ENTRY]</span>;
        }

        const formatTime = (iso) => {
            if (!iso) return 'N/A';
            const date = new Date(iso);
            return date.toLocaleString('en-GB', {
                timeZone: 'Europe/Paris',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                fractionalSecondDigits: 3
            }) + ' CET';
        };

        const { color: levelColor, label: levelLabel } = getLevelStyles(level);
        const { color: dlColor, char: dlChar } = getDlStyle(dl);

        const renderMessage = (txt) => {
            if (typeof txt !== 'string') return txt;

            // Match: "Debug Mode Activated (D Default)" OR "Current Debug Level: (A Aggressive)"
            // Strict Unified Format: (Badge LevelName)
            const levelMatch = txt.match(/^(?:Debug Mode Activated|Current Debug Level:)\s+\(([DAP])\s+(\w+)\)$/);
            if (levelMatch) {
                const [_, badgeChar, levelName] = levelMatch;
                const badgeStyle = getDlStyle(levelName);
                const prefix = txt.startsWith('Debug Mode Activated') ? 'Debug Mode Activated' : 'Current Debug Level:';
                return (
                    <>
                        {prefix} (
                        <Badge char={badgeChar} color={badgeStyle.color} size="16px" fontSize="0.6rem" />
                        <span style={{ marginLeft: '4px' }}>{levelName}</span>)
                    </>
                );
            }

            // Match: "Current Debug Status: (Enabled)" or "(Disabled)"
            const statusMatch = txt.match(/^Current Debug Status: \((Enabled|Disabled)\)$/);
            if (statusMatch) {
                const [_, status] = statusMatch;
                const isEnabled = status === 'Enabled';
                const color = isEnabled ? '#22c55e' : '#64748b'; // Green vs Slate
                return (
                    <>
                        Current Debug Status: (
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            display: 'inline-block',
                            marginRight: '6px'
                        }} />
                        {status} )
                    </>
                );
            }

            return txt;
        };

        return (
            <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span title={`Source Level: ${dl || 'Default'}`}>
                        <Badge char={dlChar} color={dlColor} />
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.85em', minWidth: '110px' }}>
                        {formatTime(ts)}
                    </span>
                    <span style={{
                        color: levelColor,
                        fontWeight: 800,
                        fontSize: '0.7em',
                        letterSpacing: '0.05em',
                        border: `1px solid ${levelColor}44`,
                        padding: '1px 4px',
                        borderRadius: '3px',
                        minWidth: '50px',
                        textAlign: 'center',
                        backgroundColor: `${levelColor}11`
                    }}>
                        {levelLabel}
                    </span>
                    <span style={{ color: isColorEnabled ? (CATEGORY_COLORS[category.replace(/[\[\]]/g, ' ').trim().split(/\s+/)[0]] || CATEGORY_COLORS.Default) : '#94a3b8', fontWeight: 600 }}>
                        {category || '[General]'}
                    </span>
                    <span style={{ color: '#f8fafc', flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {renderMessage(typeof msg === 'string' ? msg.replace(/\.$/, '') : msg)}
                    </span>
                </div>
                {data && Object.keys(data).filter(k => !['ip', 'userAgent', 'platform'].includes(k)).length > 0 && (
                    <div style={{
                        width: 'calc(100% - 8px)',
                        marginLeft: '8px',
                        marginTop: '4px',
                        padding: '6px 12px',
                        backgroundColor: 'rgba(15, 23, 42, 0.5)',
                        borderLeft: `2px solid ${dlColor}`,
                        color: levelColor === '#3b82f6' ? '#94a3b8' : levelColor,
                        fontSize: '0.85em',
                        borderRadius: '0 4px 4px 0',
                        fontFamily: 'monospace',
                        overflowX: 'auto'
                    }}>
                        <span style={{ opacity: 0.6, marginRight: '8px' }}>DATA:</span>
                        {typeof data === 'object' ? JSON.stringify(data) : data}
                    </div>
                )}
            </>
        );
    };

    const handleCopy = () => {
        const text = logs.map(line => {
            if (typeof line === 'object') {
                const { ts, level, category, msg, data } = line;
                return `${ts} [${category}] [${level}] ${msg} ${data ? JSON.stringify(data) : ''}`;
            }
            return line;
        }).join('\n');

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1000);
        });
    };

    // --- DROPDOWN DATA PREPARATION ---
    // Show ALL predefined categories + any others found in logs
    const uniqueCategories = React.useMemo(() => {
        const logCats = new Set(logs.map(l => {
            const cat = typeof l === 'object' ? l.category : '';
            return cat ? cat.replace(/[\[\]]/g, ' ').trim().split(/\s+/)[0] : '';
        }).filter(c => c));

        const predefined = Object.keys(CATEGORY_COLORS).filter(k => k !== 'Default');
        return [...new Set([...predefined, ...logCats])].sort();
    }, [logs]);

    const subCategoryMap = React.useMemo(() => {
        // Start with Static definitions
        const map = {};
        Object.keys(STATIC_SUBCATEGORIES).forEach(k => {
            map[k] = new Set(STATIC_SUBCATEGORIES[k]);
        });

        // Merge from Logs
        logs.forEach(l => {
            const catStr = typeof l === 'object' ? l.category : '';
            const tags = catStr.match(/\[([^\]]+)\]/g)?.map(t => t.replace(/[\[\]]/g, '').trim()) || [];
            if (tags.length > 0) {
                const main = tags[0];
                const subs = tags.slice(1);
                if (!map[main]) map[main] = new Set();
                subs.forEach(s => map[main].add(s));
            }
        });
        return map;
    }, [logs]);

    const activeFiltersList = [];
    if (filterLevel.length > 0) activeFiltersList.push({ type: 'Level', val: filterLevel });
    if (filterSeverity.length > 0) activeFiltersList.push({ type: 'Severity', val: filterSeverity });
    if (filterQuery) {
        parseSearchQuery(filterQuery).forEach(t => {
            if (t.type === 'category') activeFiltersList.push({ type: 'Category', val: `[${t.tags.join('][')}]` });
            else activeFiltersList.push({ type: 'Text', val: t.type === 'exact' ? `'${t.value}'` : t.value });
        });
    }

    if (!user) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <div style={{
                width: '90%',
                maxWidth: '1200px',
                height: '85vh',
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* HEADER ROW 1: Title & User Info */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #334155',
                    background: '#1e293b'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '1.5rem' }}>📃</div>
                            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.1rem' }}>
                                Debug Logs
                            </div>
                        </div>
                        <button onClick={onClose} style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '4px',
                            lineHeight: 1
                        }}>&times;</button>
                    </div>
                    {/* User Info Line */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'monospace', marginTop: '6px' }}>
                        <div>{user.nickname} • {user.id}</div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {deviceInfo && (
                                <>
                                    {deviceInfo.device?.name && <div style={{ display: 'flex', gap: '6px' }}>{Icons[deviceInfo.device.icon] || Icons.Phone} {deviceInfo.device.name}</div>}
                                    <div style={{ display: 'flex', gap: '6px' }}>{Icons[deviceInfo.os.icon] || Icons.Windows} {deviceInfo.os.name} {deviceInfo.os.ver}</div>
                                    <div style={{ display: 'flex', gap: '6px' }}>{Icons[deviceInfo.browser.icon] || Icons.Safari} {deviceInfo.browser.name} {deviceInfo.browser.ver}</div>
                                    {deviceInfo.ip && <div style={{ display: 'flex', gap: '6px' }}>📡 {deviceInfo.ip.split(',').map(ip => ip.trim()).join(' ⚔️ ')}</div>}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* HEADER ROW 2: Actions (Live, Focus) */}
                <div style={{
                    padding: '8px 1.5rem',
                    backgroundColor: '#1e293b',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => setIsFollowing(!isFollowing)} style={{
                            padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            backgroundColor: isFollowing ? '#059669' : 'transparent', color: isFollowing ? 'white' : '#94a3b8',
                            border: `1px solid ${isFollowing ? '#059669' : '#334155'}`
                        }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isFollowing ? '#ef4444' : '#64748b', animation: isFollowing ? 'pulse 1.5s infinite' : 'none' }} />
                            {isFollowing ? 'LIVE' : 'OFF'}
                        </button>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: isFollowing ? 'italic' : 'normal' }}>
                            {isFollowing ? `Auto-refreshing live${refreshDots}` : 'Auto-refreshing stopped'}
                        </span>
                    </div>
                    <button onClick={() => setIsColorEnabled(!isColorEnabled)} style={{
                        padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        backgroundColor: isColorEnabled ? '#059669' : 'transparent', color: isColorEnabled ? 'white' : '#94a3b8',
                        border: `1px solid ${isColorEnabled ? '#059669' : '#334155'}`
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isColorEnabled ? '#172554' : '#64748b', boxShadow: isColorEnabled ? '0 0 8px #3b82f6' : 'none' }} />
                        {isColorEnabled ? 'FOCUS ON' : 'FOCUS OFF'}
                    </button>
                </div>

                {/* HEADER ROW 3: Filter Toolbar (NEW) */}
                <div style={{
                    padding: '8px 1.5rem',
                    backgroundColor: '#1e293b',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    position: 'relative' // For dropdown positioning if needed
                }}>
                    {/* 1. Main Search (Filter Action style) */}
                    <div style={{ position: 'relative', flex: 2, height: '36px', background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', display: 'flex', alignItems: 'center' }} ref={searchRef}>

                        {/* Highlight Layer */}
                        <div style={{
                            position: 'absolute', inset: '0', padding: '0 12px', display: 'flex', alignItems: 'center',
                            pointerEvents: 'none', whiteSpace: 'pre', overflow: 'hidden', fontFamily: 'monospace', fontSize: '0.9rem'
                        }}>
                            {!filterQuery && <span style={{ color: '#64748b', fontFamily: 'sans-serif' }}>Search logs, [API] [Points]...</span>}
                            {filterQuery && (() => {
                                // Simple tokenizer for coloring
                                const parts = filterQuery.split(/(\[[^\]]+\])/g);
                                return parts.map((part, i) => {
                                    if (part.startsWith('[') && part.endsWith(']')) {
                                        const clean = part.slice(1, -1);
                                        // Attempt to find color: exact match OR First word match (for [API][Request] -> API)
                                        // But here 'part' is ONE bracket group [API]. 
                                        // If user types [API] [Request], we get distinct parts.
                                        // We check if 'clean' is a known category.
                                        const color = CATEGORY_COLORS[clean] || (isColorEnabled ? '#e2e8f0' : '#e2e8f0');

                                        // If it's a subcategory (e.g. [Request]), it might not be in CATEGORY_COLORS.
                                        // We could try to infer parent? 
                                        // Actually, if we just use the active palette for known text, it helps.
                                        // If not found, white. 
                                        // START SMART COLOR INFERENCE:
                                        // If part is [Request], and we are drilling down [API], we want Blue.
                                        // But here we are rendering the string. We don't track context easily per token.
                                        // We can try to look up if this tag appears in ANY static subcategory list.
                                        let inferredColor = color;
                                        if (!CATEGORY_COLORS[clean]) {
                                            const parent = Object.keys(STATIC_SUBCATEGORIES).find(k => STATIC_SUBCATEGORIES[k].includes(clean));
                                            if (parent) inferredColor = CATEGORY_COLORS[parent];
                                        }

                                        return <span key={i} style={{ color: inferredColor, textShadow: `0 0 5px ${inferredColor}44` }}>{part}</span>;
                                    }
                                    return <span key={i} style={{ color: '#f8fafc' }}>{part}</span>;
                                });
                            })()}
                        </div>

                        <input
                            type="text"
                            value={filterQuery}
                            onChange={e => setFilterQuery(e.target.value)}
                            onFocus={() => setShowSearchDropdown(true)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setShowSearchDropdown(false);
                            }}
                            style={{
                                width: '100%',
                                height: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: 'transparent', // Hide text, show caret
                                caretColor: '#f8fafc',
                                padding: '0 12px',
                                outline: 'none',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                zIndex: 1
                            }}
                        />
                        {filterQuery && (
                            <button onClick={() => setFilterQuery('')} style={{
                                position: 'absolute', right: '8px', zIndex: 2, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'
                            }}>×</button>
                        )}
                        {showSearchDropdown && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, width: '100%',
                                background: '#0f172a', border: '1px solid #475569', borderRadius: '4px',
                                marginTop: '4px', zIndex: 60, maxHeight: '300px', overflowY: 'auto',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                            }}>
                                {(() => {
                                    // Drill-down Logic: Check if we have an active Main Category in the filter
                                    const tokens = parseSearchQuery(filterQuery);
                                    const lastCatToken = tokens.slice().reverse().find(t => t.type === 'category');
                                    // Extract the last tag from the group (Main or Sub?)
                                    // If strict [Main], we want subs. If [Main] [Sub], we might want siblings?
                                    // Simplest: Check if the last tag matches a known Main Category
                                    const lastTag = lastCatToken ? lastCatToken.tags[lastCatToken.tags.length - 1] : null;
                                    const isMainSelected = lastTag && (CATEGORY_COLORS[lastTag] || uniqueCategories.includes(lastTag));

                                    // If Main is selected and has subs, show subs.
                                    // We need to know if 'lastTag' IS a main category. 
                                    // We can check if it exists in subCategoryMap keys.
                                    const activeMain = isMainSelected && subCategoryMap[lastTag] ? lastTag : null;

                                    if (activeMain) {
                                        // Show Subcategories
                                        const subs = Array.from(subCategoryMap[activeMain]).sort();
                                        if (subs.length === 0) return <div style={{ padding: '6px 10px', color: '#64748b', fontSize: '0.85rem' }}>No subcategories</div>;

                                        return (
                                            <>
                                                <div style={{
                                                    padding: '4px 10px', background: '#334155', color: '#94a3b8',
                                                    fontSize: '0.75rem', fontWeight: 600, borderBottom: '1px solid #475569'
                                                }}>
                                                    {activeMain} › Select Subcategory
                                                </div>
                                                {subs.map(sub => (
                                                    <div key={sub}
                                                        onClick={() => {
                                                            // Logic: Append [Sub] to the EXISTING [Main] group? 
                                                            // Or append "[Main] [Sub]"?
                                                            // Filter Query: "[Main]" -> "[Main] [Sub]"
                                                            // We need to replace the last "[Main]" occurrence or append to it.
                                                            // Simplest: Append " [Sub]"
                                                            // But wait, user might have typed "[Main] ". 
                                                            // If we append "[Sub]", we get "[Main] [Sub]". 
                                                            // If user clicked [Main], query is "[Main]".
                                                            // We set query to prev + " [" + sub + "]";
                                                            const needsSpace = filterQuery.length > 0 && !filterQuery.endsWith(' ');
                                                            setFilterQuery(prev => prev + (needsSpace ? ' ' : '') + `[${sub}]`);
                                                            // Keep dropdown open? Or close? Usually close after leaf selection.
                                                            // setShowSearchDropdown(false); 
                                                        }}
                                                        style={{ padding: '6px 10px', cursor: 'pointer', color: CATEGORY_COLORS[activeMain] || '#e2e8f0', paddingLeft: '20px' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        [{sub}]
                                                    </div>
                                                ))}
                                            </>
                                        );
                                    }

                                    // Default: Show Main Categories
                                    return uniqueCategories.map(cat => (
                                        <React.Fragment key={cat}>
                                            <div
                                                onClick={() => {
                                                    const pad = filterQuery.length > 0 && !filterQuery.endsWith(' ') ? ' ' : '';
                                                    setFilterQuery(prev => prev + pad + `[${cat}]`);
                                                    // Don't close, allow drill-down
                                                }}
                                                style={{ padding: '6px 10px', cursor: 'pointer', color: CATEGORY_COLORS[cat] || '#cbd5e1', fontWeight: 600, borderBottom: '1px solid #334155' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                [{cat}]
                                            </div>
                                            {/* Subcategories */}
                                            {subCategoryMap[cat] && [...subCategoryMap[cat]].map(sub => (
                                                <div key={`${cat}-${sub}`}
                                                    onClick={() => {
                                                        const pad = filterQuery.length > 0 && !filterQuery.endsWith(' ') ? ' ' : '';
                                                        setFilterQuery(prev => prev + pad + `[${cat}] [${sub}]`);
                                                    }}
                                                    style={{ padding: '4px 10px 4px 24px', cursor: 'pointer', color: CATEGORY_COLORS[cat] || '#94a3b8', fontSize: '0.85rem' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    [{sub}]
                                                </div>
                                            ))}
                                        </React.Fragment>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>

                    {/* 2. Level Filter (Multi-Select) */}
                    <div style={{ position: 'relative', flex: 1, minWidth: '140px' }} ref={levelRef}>
                        <div
                            onClick={() => setShowLevelDropdown(!showLevelDropdown)}
                            style={{
                                width: '100%',
                                height: '36px',
                                padding: '0 12px',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                overflow: 'hidden'
                            }}
                        >
                            {filterLevel.length === 0 ? (
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Level: All</span>
                            ) : filterLevel.length === 1 ? (
                                (() => {
                                    const { char, color } = getDlStyle(filterLevel[0]);
                                    return (
                                        <>
                                            <Badge char={char} color={color} size="16px" fontSize="0.6rem" />
                                            <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.9rem' }}>{filterLevel[0]}</span>
                                        </>
                                    );
                                })()
                            ) : (
                                filterLevel.map(lvl => {
                                    const { char, color } = getDlStyle(lvl);
                                    return <Badge key={lvl} char={char} color={color} size="16px" fontSize="0.6rem" />;
                                })
                            )}
                        </div>

                        {showLevelDropdown && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, width: '100%',
                                background: '#0f172a', border: '1px solid #475569', borderRadius: '4px',
                                marginTop: '4px', zIndex: 60, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                            }}>
                                {['Default', 'Aggressive', 'Paranoic'].map(lvl => {
                                    const { color, char } = getDlStyle(lvl);
                                    const isSelected = filterLevel.includes(lvl);
                                    return (
                                        <div key={lvl}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFilterLevel(prev =>
                                                    prev.includes(lvl) ? prev.filter(p => p !== lvl) : [...prev, lvl]
                                                );
                                            }}
                                            style={{
                                                padding: '6px 10px',
                                                cursor: 'pointer',
                                                color: isSelected ? '#fff' : '#e2e8f0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontFamily: 'monospace',
                                                fontSize: '0.9rem',
                                                background: isSelected ? '#1e293b' : 'transparent'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = isSelected ? '#334155' : '#334155'}
                                            onMouseLeave={e => e.currentTarget.style.background = isSelected ? '#1e293b' : 'transparent'}
                                        >
                                            <div style={{ opacity: isSelected ? 1 : 0.7 }}>
                                                <Badge char={char} color={color} size="16px" fontSize="0.6rem" />
                                            </div>
                                            {lvl}
                                            {isSelected && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>✓</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 3. Severity Filter (Multi-Select) */}
                    <div style={{ position: 'relative', flex: 1, minWidth: '140px' }} ref={severityRef}>
                        <div
                            onClick={() => setShowSeverityDropdown(!showSeverityDropdown)}
                            style={{
                                width: '100%',
                                height: '36px',
                                padding: '0 12px',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                overflow: 'hidden'
                            }}
                        >
                            {filterSeverity.length === 0 ? (
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Severity: All</span>
                            ) : filterSeverity.length === 1 ? (
                                (() => {
                                    const sev = filterSeverity[0];
                                    const { color } = getLevelStyles(sev);
                                    return (
                                        <span style={{
                                            color: color, fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.05em',
                                            border: `1px solid ${color}44`, padding: '2px 8px', borderRadius: '4px',
                                            minWidth: '60px', textAlign: 'center', backgroundColor: `${color}11`
                                        }}>
                                            {sev}
                                        </span>
                                    );
                                })()
                            ) : (
                                filterSeverity.map(sev => {
                                    const { color } = getLevelStyles(sev);
                                    return (
                                        <span key={sev} style={{
                                            color: color, fontWeight: 800, fontSize: '0.75rem',
                                            border: `1px solid ${color}44`, padding: '1px 5px', borderRadius: '4px',
                                            backgroundColor: `${color}11`
                                        }}>
                                            {sev.charAt(0)}
                                        </span>
                                    );
                                })
                            )}
                        </div>

                        {showSeverityDropdown && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, width: '100%',
                                background: '#0f172a', border: '1px solid #475569', borderRadius: '4px',
                                marginTop: '4px', zIndex: 60, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                            }}>
                                {['INFO', 'WARN', 'ERROR', 'SUCCESS', 'DEBUG'].map(sev => {
                                    const { color } = getLevelStyles(sev);
                                    const isSelected = filterSeverity.includes(sev);
                                    return (
                                        <div key={sev}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFilterSeverity(prev =>
                                                    prev.includes(sev) ? prev.filter(p => p !== sev) : [...prev, sev]
                                                );
                                            }}
                                            style={{
                                                padding: '6px 10px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                background: isSelected ? '#1e293b' : 'transparent'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = isSelected ? '#334155' : '#334155'}
                                            onMouseLeave={e => e.currentTarget.style.background = isSelected ? '#1e293b' : 'transparent'}
                                        >
                                            <span style={{
                                                color: color,
                                                fontWeight: 800,
                                                fontSize: '0.75rem',
                                                letterSpacing: '0.05em',
                                                border: `1px solid ${color}44`,
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                minWidth: '60px',
                                                textAlign: 'center',
                                                backgroundColor: `${color}11`,
                                                opacity: isSelected ? 1 : 0.7
                                            }}>
                                                {sev}
                                            </span>
                                            {isSelected && <span style={{ marginLeft: 'auto', color: '#e2e8f0', fontSize: '0.7rem' }}>✓</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 4. Active Filters Tooltip Area */}
                    <div
                        onMouseEnter={() => setShowActiveFilters(true)}
                        onMouseLeave={() => setShowActiveFilters(false)}
                        style={{ position: 'relative', cursor: 'help' }}
                    >
                        <div style={{
                            fontSize: '1.2rem', color: activeFiltersList.length > 0 ? '#38bdf8' : '#64748b',
                            opacity: activeFiltersList.length > 0 ? 1 : 0.5
                        }}>
                            ⚡
                        </div>
                        {showActiveFilters && activeFiltersList.length > 0 && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, width: '250px',
                                background: '#0f172a', border: '1px solid #334155', borderRadius: '4px',
                                padding: '12px', zIndex: 70, boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                marginTop: '8px'
                            }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '8px', textAlign: 'center', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                                    ACTIVE FILTERS
                                </div>
                                {activeFiltersList.map((f, i) => (
                                    <div key={i} style={{ marginBottom: '12px' }}>
                                        <div style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', textAlign: 'left' }}>{f.type}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '60px' }}>
                                            {f.type === 'Level' ? (
                                                f.val.map(lvl => {
                                                    const { char, color } = getDlStyle(lvl);
                                                    return (
                                                        <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <Badge char={char} color={color} size="16px" fontSize="0.6rem" />
                                                            <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.85rem' }}>{lvl}</span>
                                                        </div>
                                                    );
                                                })
                                            ) : f.type === 'Severity' ? (
                                                f.val.map(sev => {
                                                    const { color } = getLevelStyles(sev);
                                                    return (
                                                        <div key={sev} style={{ display: 'flex', alignItems: 'center' }}>
                                                            <span style={{
                                                                color: color, fontWeight: 800, fontSize: '0.75rem',
                                                                border: `1px solid ${color}44`, padding: '2px 8px',
                                                                borderRadius: '4px', backgroundColor: `${color}11`, minWidth: '70px', textAlign: 'center'
                                                            }}>{sev}</span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                // Category / Text - Vertical alignment
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '-50px' }}>
                                                    {['Category', 'Text'].includes(f.type) && typeof f.val === 'string' && f.val.includes('[') ? (
                                                        (f.val.match(/\[([^\]]+)\]/g) || []).map((part, idx) => {
                                                            const clean = part.replace(/[\[\]]/g, '');
                                                            const color = CATEGORY_COLORS[clean] || '#e2e8f0';
                                                            return <span key={idx} style={{ color: color, fontSize: '0.85rem', fontFamily: 'monospace' }}>{part}</span>
                                                        })
                                                    ) : (
                                                        <span style={{ color: '#f8fafc', fontSize: '0.85rem', fontFamily: 'monospace' }}>{f.val}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div
                                    onClick={() => { setFilterQuery(''); setFilterLevel([]); setFilterSeverity([]); }}
                                    style={{ marginTop: '12px', fontSize: '0.75rem', color: '#f87171', textAlign: 'center', cursor: 'pointer', borderTop: '1px solid #334155', paddingTop: '8px', fontWeight: 600 }}
                                >
                                    CLEAR ALL
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* LOGS LIST */}
                <div style={{ flex: 1, padding: '0', overflowY: 'auto', scrollBehavior: 'smooth' }} ref={scrollRef}>
                    {loading ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            Loading logs...
                        </div>
                    ) : error ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                            Error: {error}
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            {logs.length === 0 ? 'No logs found for this user.' : 'No logs match the current filters.'}
                        </div>
                    ) : (
                        <div style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            {filteredLogs.map((log, index) => (
                                <div key={index} style={{
                                    padding: '4px 8px',
                                    borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
                                    marginBottom: '2px',
                                    borderRadius: '4px',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all'
                                }}>
                                    {parseLogLine(log)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* FOOTER (Existing) */}
                <div style={{
                    padding: '0.75rem 1.5rem',
                    borderTop: '1px solid #334155',
                    background: '#1e293b',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center'
                }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{logs.length} entries</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {logs.length > 0 && (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span style={{ color: '#f8fafc', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                    {(() => {
                                        const pad = (n, l = 2) => String(n).padStart(l, '0');
                                        const datePart = `${pad(liveTime.getDate())}/${pad(liveTime.getMonth() + 1)}/${liveTime.getFullYear()}`;
                                        const timePart = `${pad(liveTime.getHours())}:${pad(liveTime.getMinutes())}:${pad(liveTime.getSeconds())}`;
                                        return `${datePart} - ${timePart} CET`;
                                    })()}
                                </span>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} ref={selectorRef}>
                                    <div
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            marginLeft: '4px',
                                            backgroundColor: !user.debug_enabled ? '#64748b' :
                                                user.debug_level === 'paranoic' ? '#ef4444' :
                                                    user.debug_level === 'aggressive' ? '#a855f7' : '#3b82f6',
                                            boxShadow: user.debug_enabled ? `0 0 6px ${user.debug_level === 'paranoic' ? '#ef4444' :
                                                user.debug_level === 'aggressive' ? '#a855f7' : '#3b82f6'
                                                }` : 'none',
                                            cursor: user.debug_enabled ? 'pointer' : 'default',
                                            position: 'relative',
                                            zIndex: 50
                                        }}
                                        title={`Status: ${user.debug_enabled ? user.debug_level : 'Disabled'}`}
                                        onMouseEnter={() => setShowLevelSelector(true)}
                                    />
                                    {showLevelSelector && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '20px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: '#0f172a',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            padding: '4px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '2px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                            zIndex: 100,
                                            minWidth: '120px'
                                        }}>
                                            {(user.debug_enabled
                                                ? ['off', 'default', 'aggressive', 'paranoic'].filter(lvl => lvl !== user.debug_level)
                                                : ['default', 'aggressive', 'paranoic']
                                            ).map(lvl => {
                                                const isOff = lvl === 'off';
                                                const color = isOff ? '#64748b' : lvl === 'paranoic' ? '#ef4444' : lvl === 'aggressive' ? '#a855f7' : '#3b82f6';
                                                return (
                                                    <button
                                                        key={lvl}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSetLevel(lvl);
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#1e293b'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            padding: '6px 10px',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#e2e8f0',
                                                            fontSize: '0.8rem',
                                                            cursor: 'pointer',
                                                            borderRadius: '4px',
                                                            width: '100%',
                                                            textAlign: 'left'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            backgroundColor: color,
                                                            boxShadow: isOff ? 'none' : `0 0 4px ${color}`,
                                                            opacity: isOff ? 0.7 : 1
                                                        }} />
                                                        <span style={{ textTransform: 'capitalize' }}>{isOff ? 'Disabled' : lvl}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {logs.length > 0 && (
                            <button onClick={handleCopy} style={{
                                padding: '0.4rem 0.8rem',
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.85rem',
                                transition: 'color 0.2s'
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes pulse {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.2); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                `
            }} />
        </div >
    );
};

export default LogModal;
