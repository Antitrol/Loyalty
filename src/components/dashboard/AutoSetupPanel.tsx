'use client';

import React, { useState, useEffect } from 'react';

interface SetupStatus {
    isComplete: boolean;
    configuredTiers: number[];
    missingTiers: number[];
    totalCoupons: number;
}

interface SetupProgress {
    currentStep: string;
    totalSteps: number;
    completedSteps: number;
    status: 'idle' | 'running' | 'completed' | 'error';
    message: string;
    error?: string;
}

export default function AutoSetupPanel() {
    const [status, setStatus] = useState<SetupStatus | null>(null);
    const [progress, setProgress] = useState<SetupProgress>({
        currentStep: '',
        totalSteps: 0,
        completedSteps: 0,
        status: 'idle',
        message: ''
    });
    const [loading, setLoading] = useState(true);

    // Fetch setup status
    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/admin/auto-setup');
            const data = await res.json();
            if (data.success) {
                setStatus({
                    isComplete: data.isComplete,
                    configuredTiers: data.configuredTiers,
                    missingTiers: data.missingTiers,
                    totalCoupons: data.totalCoupons
                });
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const runAutoSetup = async () => {
        setProgress({
            currentStep: 'Başlatılıyor...',
            totalSteps: 12,
            completedSteps: 0,
            status: 'running',
            message: 'Otomatik kurulum başlatılıyor...'
        });

        try {
            const res = await fetch('/api/admin/auto-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (data.success) {
                setProgress({
                    ...progress,
                    status: 'completed',
                    completedSteps: 12,
                    message: data.message || 'Kurulum tamamlandı!'
                });
                await fetchStatus();
            } else {
                setProgress({
                    ...progress,
                    status: 'error',
                    message: 'Kurulum başarısız!',
                    error: data.error
                });
            }
        } catch (error: any) {
            setProgress({
                ...progress,
                status: 'error',
                message: 'Bağlantı hatası!',
                error: error.message
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const tierNames: Record<number, string> = {
        100: '100 Puan → 1 TL',
        250: '250 Puan → 2.5 TL',
        500: '500 Puan → 5 TL',
        1000: '1000 Puan → 10 TL'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">🚀 Otomatik Kurulum</h2>
                <p className="text-indigo-100">
                    Loyalty app için tüm campaign ve kuponları otomatik oluştur
                </p>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800">Kurulum Durumu</h3>
                </div>
                <div className="p-6">
                    {status && (
                        <div className="space-y-4">
                            {/* Overall Status */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-700 font-medium">Durum:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${status.isComplete
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {status.isComplete ? '✅ Tamamlandı' : '⏳ Eksik Kurulum'}
                                </span>
                            </div>

                            {/* Total Coupons */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-700 font-medium">Toplam Kupon:</span>
                                <span className="text-2xl font-bold text-indigo-600">
                                    {status.totalCoupons.toLocaleString()}
                                </span>
                            </div>

                            {/* Configured Tiers */}
                            <div>
                                <span className="text-gray-700 font-medium block mb-2">Yapılandırılmış Tier'lar:</span>
                                <div className="space-y-2">
                                    {[100, 250, 500, 1000].map(tier => {
                                        const isConfigured = status.configuredTiers.includes(tier);
                                        return (
                                            <div
                                                key={tier}
                                                className={`flex items-center justify-between p-3 rounded-lg ${isConfigured
                                                        ? 'bg-green-50 border border-green-200'
                                                        : 'bg-gray-50 border border-gray-200'
                                                    }`}
                                            >
                                                <span className="text-sm font-medium">
                                                    {tierNames[tier]}
                                                </span>
                                                <span className={`text-sm font-bold ${isConfigured ? 'text-green-600' : 'text-gray-400'
                                                    }`}>
                                                    {isConfigured ? '✅ Hazır' : '⏳ Beklemede'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Auto Setup Button */}
            {status && !status.isComplete && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Otomatik Kurulum Başlat</h3>
                    <p className="text-gray-600 mb-6">
                        Bu işlem aşağıdakileri otomatik olarak yapacak:
                    </p>
                    <ul className="space-y-2 mb-6 text-sm text-gray-600">
                        <li className="flex items-start">
                            <span className="text-green-600 mr-2">✓</span>
                            4 adet İKAS campaign oluşturma (100, 250, 500, 1000 puan)
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-600 mr-2">✓</span>
                            Her campaign için 1,000 kupon kodu oluşturma
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-600 mr-2">✓</span>
                            Kuponları database pool'larına sync etme
                        </li>
                        <li className="flex items-start">
                            <span className="text-green-600 mr-2">✓</span>
                            Tüm ayarları otomatik kaydetme
                        </li>
                    </ul>

                    <button
                        onClick={runAutoSetup}
                        disabled={progress.status === 'running'}
                        className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg transition-all transform ${progress.status === 'running'
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 shadow-lg'
                            }`}
                    >
                        {progress.status === 'running' ? '🔄 Kurulum Devam Ediyor...' : '🚀 Otomatik Kurulumu Başlat'}
                    </button>
                </div>
            )}

            {/* Progress Display */}
            {progress.status !== 'idle' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-800">Kurulum İlerlemesi</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Progress Bar */}
                        {progress.totalSteps > 0 && (
                            <div>
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>İlerleme</span>
                                    <span>{progress.completedSteps}/{progress.totalSteps}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${(progress.completedSteps / progress.totalSteps) * 100}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Current Step */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Mevcut Adım:</div>
                            <div className="font-medium text-gray-900">{progress.currentStep || progress.message}</div>
                        </div>

                        {/* Status */}
                        {progress.status === 'completed' && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center">
                                    <span className="text-2xl mr-3">🎉</span>
                                    <div>
                                        <div className="font-bold text-green-800">Kurulum Tamamlandı!</div>
                                        <div className="text-sm text-green-600">{progress.message}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {progress.status === 'error' && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center">
                                    <span className="text-2xl mr-3">❌</span>
                                    <div>
                                        <div className="font-bold text-red-800">Hata Oluştu</div>
                                        <div className="text-sm text-red-600">{progress.error || progress.message}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Success State */}
            {status && status.isComplete && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-start">
                        <span className="text-4xl mr-4">✅</span>
                        <div>
                            <h3 className="text-xl font-bold text-green-800 mb-2">Kurulum Tamamlandı!</h3>
                            <p className="text-green-700 mb-4">
                                Loyalty app tamamen yapılandırıldı ve kullanıma hazır.
                            </p>
                            <div className="space-y-2 text-sm text-green-700">
                                <div>✓ {status.totalCoupons.toLocaleString()} kupon database'de hazır</div>
                                <div>✓ 4 redemption tier aktif</div>
                                <div>✓ Widget müşterileriniz için hazır</div>
                            </div>
                            <button
                                onClick={fetchStatus}
                                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                                🔄 Durumu Yenile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
