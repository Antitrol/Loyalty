
import React from 'react';

export default function RedemptionRules({ settings, setSettings }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                    🔥 Harcama & Ödül Kuralları
                </h3>
                <p className="text-sm text-gray-500">Puanların nasıl paraya dönüşeceğini belirleyin.</p>
            </div>

            {/* Conversion Rate */}
            <div className="bg-orange-50 rounded-lg p-5 border border-orange-100">
                <label className="block text-sm font-semibold text-orange-900 mb-3">Dönüşüm Oranı</label>
                <div className="flex items-center gap-3">
                    <span className="text-gray-700">1 Puan = </span>
                    <div className="relative rounded-md shadow-sm w-32">
                        <input
                            type="number"
                            step="0.01"
                            value={settings.burnRatio}
                            onChange={(e) => setSettings({ ...settings, burnRatio: parseFloat(e.target.value) || 0.01 })}
                            className="focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-xs">TL</span>
                        </div>
                    </div>
                    <span className="text-gray-700">değerindedir.</span>
                </div>
                <p className="text-xs text-orange-600 mt-2">
                    Örn: 0.1 yaparsanız, 10 Puan 1 TL eder.
                </p>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Sepet Tutarı</label>
                    <div className="flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            TL
                        </span>
                        <input
                            type="number"
                            value={settings.minSpendLimit}
                            onChange={(e) => setSettings({ ...settings, minSpendLimit: parseFloat(e.target.value) || 0 })}
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-r-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Puan kullanmak için gereken alt limit.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maksimum Kullanım (Opsiyonel)</label>
                    <div className="flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            TL
                        </span>
                        <input
                            type="number"
                            value={settings.maxPointUsage}
                            onChange={(e) => setSettings({ ...settings, maxPointUsage: parseFloat(e.target.value) || 0 })}
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-r-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Bir siparişte en fazla kaç TL puan kullanılabilir? (0 = Sınırsız)</p>
                </div>
            </div>
        </div>
    );
}
