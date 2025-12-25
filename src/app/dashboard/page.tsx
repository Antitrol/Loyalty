
'use client';

import React, { useEffect, useState } from 'react';
import Loading from '@/components/Loading';

// Icons (Simple SVG components for portability)
const Icons = {
  Users: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Gift: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
  Settings: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Chart: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Save: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data State
  const [settings, setSettings] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Simulation State
  const [simOrderAmount, setSimOrderAmount] = useState(100);
  const [simPoints, setSimPoints] = useState(1000);

  // Stats
  const totalPoints = customers.reduce((acc, c) => acc + c.points, 0);
  const totalCustomers = customers.length;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, customersRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/customers')
      ]);
      setSettings(await settingsRes.json());
      setCustomers(await customersRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      // Optional: Add a robust toast notification here instead of alert
      alert('Ayarlar başarıyla kaydedildi!');
    } catch (e) {
      alert('Kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Icons.Gift />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sadakat Yönetimi</h1>
          </div>
          <div className="flex items-center space-x-1">
            {/* Tab Navigation */}
            {[
              { id: 'overview', label: 'Genel Bakış', icon: Icons.Chart },
              { id: 'customers', label: 'Müşteriler', icon: Icons.Users },
              { id: 'settings', label: 'Ayarlar', icon: Icons.Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stat Card 1 */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Toplam Müşteri</h3>
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-full"><Icons.Users /></div>
                </div>
                <p className="text-4xl font-extrabold text-gray-900">{totalCustomers}</p>
                <p className="text-sm text-gray-400 mt-2">Sisteme kayıtlı üye sayısı</p>
              </div>

              {/* Stat Card 2 */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Dağıtılan Puan</h3>
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-full"><Icons.Gift /></div>
                </div>
                <p className="text-4xl font-extrabold text-gray-900">{totalPoints.toLocaleString()}</p>
                <p className="text-sm text-gray-400 mt-2">Müşterilerin cüzdanındaki toplam bakiye</p>
              </div>

              {/* Stat Card 3 */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Puan Değeri</h3>
                  <div className="bg-amber-50 text-amber-600 p-2 rounded-full"><Icons.Chart /></div>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-extrabold text-gray-900">{settings?.earnRatio}x</p>
                </div>
                <p className="text-sm text-gray-400 mt-2">Her 1 TL harcamada kazanılan puan</p>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Müşteri Listesi</h2>
              <span className="text-sm text-gray-500">{customers.length} Kayıt Bulundu</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Müşteri Bilgisi</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Puan Bakiyesi</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Son İşlem Tarihi</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.customerId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                            {(customer.firstName?.[0] || customer.email?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.firstName ? `${customer.firstName} ${customer.lastName || ''}` : 'İsimsiz Müşteri'}
                            </div>
                            <div className="text-sm text-gray-500">{customer.email || 'Email yok'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {customer.points} Puan
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(customer.updatedAt).toLocaleDateString("tr-TR", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900">Detay</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && settings && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* SETTINGS FORM */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Kuralları Yapılandır</h2>
                <p className="text-sm text-gray-500">Puan kazanma ve harcama oranlarını buradan yönetin.</p>
              </div>

              <div className="space-y-6">
                {/* Earn Ratio Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kazanma Oranı (Earn Ratio)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">1 TL sipariş için kaç puan verilecek?</p>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="number"
                      step="0.1"
                      value={settings.earnRatio}
                      onChange={(e) => setSettings({ ...settings, earnRatio: parseFloat(e.target.value) || 0 })}
                      className="block w-full pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-3 border"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">x Katı</span>
                    </div>
                  </div>
                </div>

                {/* Burn Ratio Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harcama Değeri (Burn Ratio)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">1 Puan kaç TL indirim değerindedir?</p>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="number"
                      step="0.01"
                      value={settings.burnRatio}
                      onChange={(e) => setSettings({ ...settings, burnRatio: parseFloat(e.target.value) || 0 })}
                      className="block w-full pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-3 border"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">TL / Puan</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors"
                  >
                    <Icons.Save />
                    <span className="ml-2">{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SIMULATOR (PLAYGROUND) */}
            <div className="space-y-6">
              {/* Earn Simulator */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg border border-transparent p-6 text-white text-center sm:text-left">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  🧪 Kazanma Simülatörü
                </h3>
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <label className="block text-xs font-semibold text-indigo-100 uppercase tracking-wider mb-2">
                    Deneme Sipariş Tutarı
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={simOrderAmount}
                      onChange={(e) => setSimOrderAmount(parseFloat(e.target.value) || 0)}
                      className="block w-full bg-white/20 border border-white/30 rounded-md text-white placeholder-white/50 focus:ring-white focus:border-white p-2"
                    />
                    <span className="text-lg font-bold">TL</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between bg-white/20 rounded-lg p-4">
                  <span className="text-indigo-100 font-medium">Müşteri Kazanır:</span>
                  <span className="text-3xl font-extrabold text-white">
                    {Math.floor(simOrderAmount * (settings.earnRatio || 0))} <span className="text-sm font-normal opacity-80">Puan</span>
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-2 text-center">
                  *Hesap: {simOrderAmount} TL x {settings.earnRatio} (Oran)
                </p>
              </div>

              {/* Burn Simulator */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🔥 Harcama Simülatörü
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Müşterinin Puanı
                    </label>
                    <input
                      type="number"
                      value={simPoints}
                      onChange={(e) => setSimPoints(parseFloat(e.target.value) || 0)}
                      className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                    />
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100 flex justify-between items-center">
                    <span className="text-green-800 font-medium">İndirim Tutarı:</span>
                    <span className="text-2xl font-bold text-green-700">
                      {(simPoints * (settings.burnRatio || 0)).toFixed(2)} TL
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
