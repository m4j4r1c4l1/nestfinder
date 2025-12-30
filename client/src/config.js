/**
 * Application Configuration
 * 
 * This file contains global configuration settings for the NestFinder client app.
 */

const config = {
    /**
     * Testing Mode Configuration
     * Set to true to display the testing/beta notice on the login page
     * Set to false to hide the notice when going to production
     */
    SHOW_TESTING_NOTICE: true,

    /**
     * Testing Mode Settings
     */
    testingMode: {
        // Badge text (e.g., "Alpha", "Beta Testing", "Preview")
        badgeText: 'Beta Testing',

        // Notice message
        message: 'This app is currently in testing phase. Your feedback helps us improve.',

        // Badge color (amber/gold by default)
        badgeColor: '#ffc107'
    }
};

export default config;
