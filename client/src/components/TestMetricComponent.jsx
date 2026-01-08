
import React from 'react';

// This dummy component is created to verify that the "Components", "Files", and "Websockets" 
// metrics badges animate correctly on the dashboard.

// The scanner detects this pattern:
// socket.on('test-socket-event', () => {});

export const TestMetricComponent = () => {
    return (
        <div>
            <h1>Metric Verification Component</h1>
        </div>
    );
};
