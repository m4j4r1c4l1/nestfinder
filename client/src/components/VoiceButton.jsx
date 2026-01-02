import React, { useState, useCallback } from 'react';

const VoiceButton = ({ onTranscript, disabled = false }) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);

    // Check if Web Speech API is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;

    const startListening = useCallback(() => {
        if (!isSupported) {
            setError('Voice input not supported');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = navigator.language || 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onTranscript(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setError(event.error === 'not-allowed' ? 'Mic blocked' : 'Voice failed');
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        try {
            recognition.start();
        } catch (e) {
            setError('Could not start voice');
            setIsListening(false);
        }
    }, [isSupported, onTranscript]);

    if (!isSupported) return null;

    return (
        <button
            type="button"
            onClick={startListening}
            disabled={disabled || isListening}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                background: isListening
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white',
                fontSize: '1.5rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                boxShadow: isListening
                    ? '0 0 20px rgba(239, 68, 68, 0.5)'
                    : '0 4px 12px rgba(0,0,0,0.3)',
                animation: isListening ? 'pulse 1s infinite' : 'none',
                transition: 'all 0.2s'
            }}
            title={isListening ? 'Listening...' : 'Speak to add notes'}
        >
            {isListening ? '🔴' : '🎤'}
        </button>
    );
};

export default VoiceButton;
