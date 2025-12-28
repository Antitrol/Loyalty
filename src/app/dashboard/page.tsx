
'use client';

import React, { useEffect, useState } from 'react';
import Loading from '@/components/Loading';
import EarningRules from '@/components/dashboard/EarningRules';
import RedemptionRules from '@/components/dashboard/RedemptionRules';
import WidgetDesign from '@/components/dashboard/WidgetDesign';

// Icons
const Icons = {
  Chart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Gift: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
  Fire: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>,
  Palette: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
  Save: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // CRM Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [adjustPoints, setAdjustPoints] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  useEffect(() => { fetchData(); }, []);

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
      alert('Ayarlar kaydedildi!');
    } catch (e) {
      alert('Hata!');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedCustomer) return;
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.customerId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: adjustPoints, reason: adjustReason })
      });
      if (res.ok) {
        alert('Puan güncellendi.');
        setSelectedCustomer(null);
        fetchData(); // Refresh list
      }
    } catch (e) {
      alert('Hata oluştu.');
    }
  };

  if (loading) return <Loading />;

  // Tabs Configuration
  const tabs = [
    { id: 'settings', label: 'Ayarlar', icon: Icons.Palette },
    { id: 'stats', label: 'İstatistikler', icon: Icons.Chart },
    { id: 'crm', label: 'Müşteriler (CRM)', icon: Icons.Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white"><Icons.Gift /></div>
            <h1 className="text-xl font-bold text-gray-900">Loyalty Manager</h1>
          </div>
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <tab.icon />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* SETTINGS TAB (Configuration) */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

              {/* Left Column: Rules */}
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Icons.Gift /></div>
                    <h2 className="text-lg font-bold text-gray-800">Kazanım Kuralları</h2>
                  </div>
                  <EarningRules settings={settings} setSettings={setSettings} />
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Icons.Fire /></div>
                    <h2 className="text-lg font-bold text-gray-800">Harcama Ayarları</h2>
                  </div>
                  <RedemptionRules settings={settings} setSettings={setSettings} />
                </div>
              </div>

              {/* Right Column: Design */}
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Icons.Palette /></div>
                    <h2 className="text-lg font-bold text-gray-800">Widget Tasarımı</h2>
                  </div>
                  <WidgetDesign settings={settings} setSettings={setSettings} />
                </div>
              </div>

            </div>

            {/* Sticky Save Button (Global for Settings) */}
            <div className="sticky bottom-6 flex justify-end">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full md:w-auto flex items-center justify-center py-4 px-8 border border-transparent rounded-xl shadow-xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 transition-all transform active:scale-95"
              >
                <Icons.Save />
                <span className="ml-2">{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">İstatistikler</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-gray-500 text-sm font-medium uppercase">Toplam Müşteri</h3>
                <p className="text-4xl font-extrabold text-gray-900 mt-2">{customers.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-gray-500 text-sm font-medium uppercase">Dağıtılan Puan</h3>
                <p className="text-4xl font-extrabold text-indigo-600 mt-2">
                  {customers.reduce((acc, c) => acc + c.points, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CRM TAB */}
        {activeTab === 'crm' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Müşteri Listesi</h2>
              <input type="text" placeholder="Ara..." className="border rounded px-3 py-1 text-sm" />
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Müşteri</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Puan</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((cust) => (
                  <tr key={cust.customerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{cust.firstName} {cust.lastName}</div>
                      <div className="text-sm text-gray-500">{cust.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                        {cust.points} Puan
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Düzenle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ADJUSTMENT MODAL */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-bold mb-4">Puan Düzenle: {selectedCustomer.firstName}</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Eklenecek/Silinecek Puan</label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="-50 veya 100"
                  onChange={(e) => setAdjustPoints(parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Silmek için başına eksi (-) koyun.</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">Sebep</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Örn: Telafi, İade..."
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleAdjustPoints}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
