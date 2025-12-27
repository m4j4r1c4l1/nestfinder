import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';
import AdminMap from '../components/AdminMap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, pointsData] = await Promise.all([
                    adminApi.getStats(),
                    adminApi.getPoints()
                ]);
                setStats(statsData.stats);
                setPoints(pointsData.points);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading dashboard...</div>;

    const statusData = {
        labels: ['Confirmed', 'Pending', 'Deactivated'],
        datasets: [{
            data: [stats.confirmedPoints, stats.pendingPoints, stats.deactivatedPoints],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderColor: '#0f172a',
            borderWidth: 2,
        }]
    };

    return (
        <div className="flex-col gap-4">
            <h2 className="mb-4">Dashboard Overview</h2>

            <div className="grid grid-cols-4 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalPoints}</div>
                    <div className="stat-label">Total Points</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.activeUsers}</div>
                    <div className="stat-label">Active Users (7d)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.todaySubmissions}</div>
                    <div className="stat-label">New Reports Today</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.todayActions}</div>
                    <div className="stat-label">Actions Today</div>
                </div>
            </div>

            <div className="flex gap-4" style={{ marginTop: '2rem', flexWrap: 'wrap' }}>
                <div className="card" style={{ flex: 2, minWidth: '300px' }}>
                    <div className="card-header">Global Activity Map</div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <AdminMap points={points} />
                    </div>
                </div>

                <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                    <div className="card-header">Point Status Distribution</div>
                    <div className="card-body flex-center" style={{ height: '300px' }}>
                        <Doughnut data={statusData} options={{ plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
