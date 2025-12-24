
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, RefreshCcw, Activity } from 'lucide-react';

interface Stats {
    totalTransactions: number;
    totalEarned: number;
    totalRedeemed: number;
    totalRefunded: number;
    netPointsOutstanding: number;
    recentActivity: Array<{
        type: string;
        points: number;
        customerId: string;
        date: string;
        amount?: number;
    }>;
}

export function ReportingDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/analytics/stats');
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    if (!stats) return null;

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Points Outstanding</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.netPointsOutstanding}</div>
                        <p className="text-xs text-muted-foreground">Liabaility measure</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Points Distributed</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">+{stats.totalEarned}</div>
                        <p className="text-xs text-muted-foreground">{stats.totalTransactions} total transactions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Points Redeemed</CardTitle>
                        <TrendingDown className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">-{stats.totalRedeemed}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Points Refunded (Clawback)</CardTitle>
                        <RefreshCcw className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">-{stats.totalRefunded}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Table */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Latest 10 transactions across the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.recentActivity.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No transactions recorded yet.</p>
                        ) : (
                            stats.recentActivity.map((t, i) => (
                                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {t.type}
                                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                                                {new Date(t.date).toLocaleString()}
                                            </span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {t.customerId === 'c2d78014-54ef-41ca-8aeb-443341d04cee' ? 'Demo Customer (Gold)' : t.customerId}
                                        </p>
                                    </div>
                                    <div className={`font-mono font-medium ${t.type === 'EARN' ? 'text-green-600' :
                                            t.type === 'REDEEM' ? 'text-blue-600' : 'text-red-600'
                                        }`}>
                                        {t.type === 'EARN' ? '+' : '-'}{t.points}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
