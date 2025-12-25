
'use client';

import React, { useEffect, useState } from 'react';
import Loading from '@/components/Loading';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data State
  const [settings, setSettings] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

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
      alert('Ayarlar kaydedildi!');
    } catch (e) {
      alert('Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Sadakat Yönetim Paneli</h1>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 border-b border-gray-200 mb-8">
          {['overview', 'customers', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-4 font-medium capitalize ${activeTab === tab
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab === 'overview' && 'Genel Bakış'}
              {tab === 'customers' && 'Müşteriler'}
              {tab === 'settings' && 'Ayarlar'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                <h3 className="text-indigo-600 font-medium mb-2">Toplam Müşteri</h3>
                <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100">
                <h3 className="text-emerald-600 font-medium mb-2">Dağıtılan Puan</h3>
                <p className="text-3xl font-bold text-gray-900">{totalPoints}</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
                <h3 className="text-amber-600 font-medium mb-2">Kazanma Oranı</h3>
                <p className="text-3xl font-bold text-gray-900">{settings?.earnRatio || 1}x</p>
              </div>
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {activeTab === 'customers' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puan Bakiyesi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son İşlem</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.customerId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.email || customer.customerId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-bold">
                          {customer.points} Puan
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(customer.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        Henüz kayıtlı müşteri yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && settings && (
            <div className="max-w-lg">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puan Kazanma Oranı (Earn Ratio)
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Müşteri 1 Birim (TL) harcadığında kaç puan kazansın?
                </p>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    value={settings.earnRatio}
                    onChange={(e) => setSettings({ ...settings, earnRatio: e.target.value })}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                  <span className="ml-3 text-gray-500">x Katı</span>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puan Harcama Değeri (Burn Ratio)
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  1 Puan kaç TL indirim sağlasın? (Örn: 0.01 = 100 Puan 1 TL eder)
                </p>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    value={settings.burnRatio}
                    onChange={(e) => setSettings({ ...settings, burnRatio: e.target.value })}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                  <span className="ml-3 text-gray-500">TL / Puan</span>
                </div>
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
