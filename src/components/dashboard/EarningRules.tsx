
import React from 'react';

interface Props {
    settings: any;
    setSettings: (s: any) => void;
}

export default function EarningRules({ settings, setSettings }: Props) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                    💰 Kazanım Kuralları
                </h3>
                <p className="text-sm text-gray-500">Müşterilerin siparişlerinden nasıl puan kazanacağını belirleyin.</p>
            </div>

            {/* Standard Earn Rule */}
            <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100">
                <label className="block text-sm font-semibold text-indigo-900 mb-3">Harcama Bazlı Kazanım</label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-gray-700">Her</span>
                    <div className="relative rounded-md shadow-sm w-32">
                        <input
                            type="number"
                            value={settings.earnUnitAmount}
                            onChange={(e) => setSettings({ ...settings, earnUnitAmount: parseFloat(e.target.value) || 1 })}
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-xs">TL</span>
                        </div>
                    </div>
                    <span className="text-gray-700">harcama için</span>
                    <div className="relative rounded-md shadow-sm w-32">
                        <input
                            type="number"
                            value={settings.earnPerAmount}
                            onChange={(e) => setSettings({ ...settings, earnPerAmount: parseFloat(e.target.value) || 1 })}
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-xs">Puan</span>
                        </div>
                    </div>
                    <span className="text-gray-700">ver.</span>
                </div>
                <p className="text-xs text-indigo-600 mt-2">
                    Örn: Her 100 TL için 10 Puan. (1000 TL alışverişe 100 Puan)
                </p>
            </div>

            {/* Welcome Bonus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🎉 Hoşgeldin Bonusu</label>
                    <div className="flex rounded-md shadow-sm">
                        <input
                            type="number"
                            value={settings.welcomeBonus}
                            onChange={(e) => setSettings({ ...settings, welcomeBonus: parseInt(e.target.value) || 0 })}
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            Puan
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">İlk siparişini veren üyeye verilir.</p>
                </div>
            </div>

            {/* Exclusions */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Hariç Tutulacaklar</label>
                <div className="space-y-3">
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="shipping"
                                type="checkbox"
                                checked={settings.excludeShipping}
                                onChange={(e) => setSettings({ ...settings, excludeShipping: e.target.checked })}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="shipping" className="font-medium text-gray-700">Kargo Ücreti Dahil Etme</label>
                            <p className="text-gray-500">Puan hesaplanırken kargo ücreti toplam tutardan düşülür.</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="discount"
                                type="checkbox"
                                checked={settings.excludeDiscounted}
                                onChange={(e) => setSettings({ ...settings, excludeDiscounted: e.target.checked })}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="discount" className="font-medium text-gray-700">İndirimleri Düş</label>
                            <p className="text-gray-500">Uygulanan indirim tutarı puan hesabına katılmaz.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
