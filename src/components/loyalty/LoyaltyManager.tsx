'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Gift, CreditCard, Coins, CheckCircle2, AlertCircle } from 'lucide-react';

export function LoyaltyManager() {
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
        <Card className="w-full max-w-lg mx-auto shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Loyalty Management
                </CardTitle>
                <CardDescription>
                    Manage customer points and rewards
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Customer ID"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        className="flex-1"
                    />
                    <Button
                        onClick={fetchProfile}
                        disabled={loading || !customerId}
                        variant="default"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                    </Button>
                </div>

                {profile && (
                    <div className="mt-4 p-4 rounded-lg bg-muted border animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Current Tier</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                {profile.tier}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Points Balance</span>
                            <div className="flex items-center gap-2 text-2xl font-bold">
                                <Coins className="w-6 h-6 text-yellow-500" />
                                {profile.pointsBalance}
                            </div>
                        </div>
                    </div>
                )}

                {message && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'border-green-500/50 text-green-600 dark:text-green-400' : ''}>
                        {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <AlertTitle>{message.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}
            </CardContent>

            {profile && (
                <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button
                        onClick={addPoints}
                        disabled={loading}
                        variant="outline"
                        className="w-full"
                    >
                        <Coins className="w-4 h-4 mr-2" />
                        Add 600 Points (Test)
                    </Button>

                    <Button
                        onClick={redeemPoints}
                        disabled={loading || profile.pointsBalance < 500}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                        <Gift className="w-4 h-4 mr-2" />
                        Redeem 500 Points for 50TL
                    </Button>
                    {profile.pointsBalance < 500 && (
                        <p className="text-xs text-center text-muted-foreground">
                            Need 500 points to redeem
                        </p>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
