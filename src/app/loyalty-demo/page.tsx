'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Gift, CreditCard, Coins, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoyaltyDemo() {
    const [customerId, setCustomerId] = useState('');
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchProfile = async () => {
        if (!customerId) return;
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/loyalty/profile?customerId=${customerId}`);
            const data = await res.json();
            if (data.success && data.profile) {
                setProfile(data.profile);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to fetch profile' });
                setProfile(null);
            }
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    };

    const addPoints = async () => {
        if (!customerId) return;
        setLoading(true);
        try {
            const res = await fetch('/api/loyalty/add-points', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId, points: 600 })
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.profile);
                setMessage({ type: 'success', text: 'Added 600 Points!' });
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    };

    const redeemPoints = async () => {
        if (!customerId) return;
        setLoading(true);
        try {
            const res = await fetch('/api/loyalty/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId })
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: `Redeemed! Code: ${data.code}` });
                // Refresh profile to see deducted points, or use returned.
                // ideally api returns remaining, but let's re-fetch to be sure of tag state consistency
                fetchProfile();
            } else {
                setMessage({ type: 'error', text: data.message || 'Redemption Failed' });
            }
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center font-sans">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        Loyalty Admin
                    </h1>
                    <p className="text-slate-400">Manage customer points and rewards</p>
                </div>

                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <CreditCard className="w-5 h-5 text-indigo-400" />
                            Customer Profile
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Enter Customer ID to manage loyalty
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Customer ID"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                            />
                            <Button
                                onClick={fetchProfile}
                                disabled={loading || !customerId}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                            </Button>
                        </div>

                        {profile && (
                            <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-slate-400">Current Tier</span>
                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        {profile.tier}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-400">Points Balance</span>
                                    <div className="flex items-center gap-2 text-2xl font-bold text-white">
                                        <Coins className="w-6 h-6 text-yellow-400" />
                                        {profile.pointsBalance}
                                    </div>
                                </div>
                            </div>
                        )}

                        {message && (
                            <Alert className={`mt-4 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                <AlertTitle>{message.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                                <AlertDescription>{message.text}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>

                    {profile && (
                        <CardFooter className="flex flex-col gap-3 pt-6 border-t border-slate-800">
                            <Button
                                onClick={addPoints}
                                disabled={loading}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                            >
                                <Coins className="w-4 h-4 mr-2" />
                                Add 600 Points (Test)
                            </Button>

                            <Button
                                onClick={redeemPoints}
                                disabled={loading || profile.pointsBalance < 500}
                                className={`w-full ${profile.pointsBalance >= 500 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' : 'bg-slate-800 text-slate-500'} text-white shadow-lg shadow-indigo-500/20 transition-all`}
                            >
                                <Gift className="w-4 h-4 mr-2" />
                                Redeem 500 Points for 50TL
                            </Button>
                            {profile.pointsBalance < 500 && (
                                <p className="text-xs text-center text-slate-500">
                                    Need 500 points to redeem
                                </p>
                            )}
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}
