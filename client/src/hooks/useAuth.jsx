import { logger } from '../utils/logger';

// ... (inside login function)
const login = async (nickname) => {
    // ... (device ID logic)
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
    // ... (device ID logic)
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


export const useAuth = () => useContext(AuthContext);
