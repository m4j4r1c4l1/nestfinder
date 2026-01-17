import { useState, useEffect, createContext, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../utils/api';
import { logger } from '../utils/logger';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            // Check for existing user ID
            const userId = localStorage.getItem('nestfinder_user_id');
            const storedUser = localStorage.getItem('nestfinder_user_data');

            if (userId) {
                // Always set the API userId
                api.setUserId(userId);

                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                } else {
                    // Create minimal user object if data is missing
                    setUser({ id: userId, nickname: 'User' });
                }
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    // ... (existing imports)

    const login = async (nickname) => {
        let deviceId = localStorage.getItem('nestfinder_device_id');
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem('nestfinder_device_id', deviceId);
        }

        try {
            const { user } = await api.register(deviceId, nickname);
            api.setUserId(user.id);
            setUser(user);
            localStorage.setItem('nestfinder_user_id', user.id);
            localStorage.setItem('nestfinder_user_data', JSON.stringify(user));
            logger.log('Auth', 'Login', `User logged in with nickname: ${nickname || 'Anonymous'} (${user.id})`);
            return user;
        } catch (error) {
            console.error('Login failed:', error);
            logger.log('Auth', 'Error', `Login failed: ${error.message}`);
            throw error;
        }
    };

    const recoverFromKey = async (recoveryKey) => {
        let deviceId = localStorage.getItem('nestfinder_device_id');
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem('nestfinder_device_id', deviceId);
        }

        try {
            const { user } = await api.recoverIdentity(recoveryKey, deviceId);
            api.setUserId(user.id);
            setUser(user);
            localStorage.setItem('nestfinder_user_id', user.id);
            localStorage.setItem('nestfinder_user_data', JSON.stringify(user));
            logger.log('Auth', 'Recovery', `Identity recovered for user: ${user.id}`);
            return user;
        } catch (error) {
            console.error('Recovery failed:', error);
            logger.log('Auth', 'Error', `Recovery failed: ${error.message}`);
            throw error;
        }
    };

    const logout = () => {
        logger.log('Auth', 'Logout', `User logged out: ${user?.id}`);
        api.logout();
        setUser(null);
        localStorage.removeItem('nestfinder_user_data');
    };

    const updateNickname = async (nickname) => {
        try {
            const { user: updatedUser } = await api.updateNickname(nickname);
            setUser(updatedUser);
            localStorage.setItem('nestfinder_user_data', JSON.stringify(updatedUser));
            logger.log('Auth', 'Update', `Nickname changed to: ${nickname}`);
            return updatedUser;
        } catch (error) {
            console.error('Update nickname failed:', error);
            logger.log('Auth', 'Error', `Nickname update failed: ${error.message}`);
            throw error;
        }
    };

    const updateTrustScore = (score) => {
        if (!user) return;
        const updated = { ...user, trust_score: score };
        setUser(updated);
        localStorage.setItem('nestfinder_user_data', JSON.stringify(updated));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateNickname, updateTrustScore, recoverFromKey }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
