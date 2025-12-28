
import React from 'react';

interface Props {
    settings: any;
    setSettings: (s: any) => void;
}

const DEFAULT_TIERS = [
    { name: 'Standard', threshold: 0, multiplier: 1 },
    { name: 'Bronze', threshold: 5000, multiplier: 1.1 },
    { name: 'Silver', threshold: 10000, multiplier: 1.25 },
    { name: 'Gold', threshold: 25000, multiplier: 1.5 },
    { name: 'Platinum', threshold: 50000, multiplier: 2.0 },
];

export default function TierSettings({ settings, setSettings }: Props) {
    // Initialize tiers if not present
    React.useEffect(() => {
        if (!settings.tiers || settings.tiers.length === 0) {
            setSettings({ ...settings, tiers: DEFAULT_TIERS });
        }
    }, [settings, setSettings]);

    const handleTierChange = (index: number, field: string, value: any) => {
        const newTiers = [...(settings.tiers || DEFAULT_TIERS)];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setSettings({ ...settings, tiers: newTiers });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                    🏆 Sıralama / Seviye Ayarları
                </h3>
                <p className="text-sm text-gray-500">
                    Müşterilerin ulaşabileceği sadakat seviyelerini ve avantajlarını yapılandırın.
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-700">Seviye Adı</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">Puan Sınırı</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">Katsayı (x)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(settings.tiers || DEFAULT_TIERS).map((tier: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    {tier.name}
                                    {tier.name === 'Standard' && <span className="ml-2 text-xs text-gray-400">(Varsayılan)</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        disabled={tier.name === 'Standard'} // Standard always 0
                                        value={tier.threshold}
                                        onChange={(e) => handleTierChange(index, 'threshold', parseInt(e.target.value) || 0)}
                                        className="w-24 border-gray-300 rounded-md shadow-sm text-sm p-1"
                                    />
                                    <span className="ml-1 text-gray-500">Puan</span>
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={tier.multiplier}
                                        onChange={(e) => handleTierChange(index, 'multiplier', parseFloat(e.target.value) || 1)}
                                        className="w-20 border-gray-300 rounded-md shadow-sm text-sm p-1"
                                    />
                                    <span className="ml-1 text-gray-500">Kat</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                <strong>Bilgi:</strong> Müşteriler, "Puan Sınırı" değerine ulaştıklarında (ömür boyu kazanılan puan baz alınır) otomatik olarak bir üst seviyeye geçerler ve o seviyenin katsayısı kadar daha fazla puan kazanmaya başlarlar.
            </div>
        </div>
    );
}
