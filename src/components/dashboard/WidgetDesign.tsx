
import React from 'react';

interface Props {
    settings: any;
    setSettings: (s: any) => void;
}

export default function WidgetDesign({ settings, setSettings }: Props) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                    🎨 Tasarım & Görünüm
                </h3>
                <p className="text-sm text-gray-500">Sitenizde görünecek "Puanım" kutucuğunun tasarımı.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Settings */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Marka Rengi (Primary Color)</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={settings.widgetPrimaryColor}
                                onChange={(e) => setSettings({ ...settings, widgetPrimaryColor: e.target.value })}
                                className="h-10 w-10 rounded-md border border-gray-300 cursor-pointer overflow-hidden p-0"
                            />
                            <input
                                type="text"
                                value={settings.widgetPrimaryColor}
                                onChange={(e) => setSettings({ ...settings, widgetPrimaryColor: e.target.value })}
                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border uppercase"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Puan Etiketi</label>
                        <input
                            type="text"
                            value={settings.widgetLabel}
                            onChange={(e) => setSettings({ ...settings, widgetLabel: e.target.value })}
                            placeholder="Örn: Coin, Yıldız, Para"
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        />
                        <p className="text-xs text-gray-500 mt-1">"100 Puan" yerine "100 Coin" yazar.</p>
                    </div>
                </div>

                {/* Live Preview */}
                <div className="bg-gray-100 rounded-xl p-8 flex items-center justify-center border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-2 left-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Önizleme</div>

                    {/* Widget Mockup */}
                    <div className="bg-white rounded-lg shadow-lg p-5 w-64 transform transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-2 w-20 bg-gray-200 rounded"></div>
                            <div className="h-6 w-6 rounded-full bg-gray-100"></div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-20 rounded-md flex items-center justify-center text-white font-bold text-lg shadow-md"
                                style={{ backgroundColor: settings.widgetPrimaryColor }}>
                                500 {settings.widgetLabel}
                            </div>
                            <div className="h-8 bg-gray-50 rounded border border-gray-100 flex items-center justify-center text-xs text-gray-500">
                                Kupona Dönüştür
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Installation Section */}
            <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🔌 Kurulum & Entegrasyon
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Automatic */}
                    <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl">
                        <h4 className="font-bold text-indigo-900 mb-2">🚀 Otomatik Kurulum</h4>
                        <p className="text-sm text-indigo-700 mb-4 py-2">
                            Loyalty Widget'ı tek tıkla sitenize ekleyin. Herhangi bir kod bilgisi gerektirmez.
                        </p>
                        <button
                            onClick={async () => {
                                const btn = document.getElementById('installBtn');
                                if (btn) btn.innerText = 'Kuruluyor...';
                                try {
                                    const res = await fetch('/api/setup/install-widget', { method: 'POST' });
                                    const data = await res.json();
                                    if (res.ok) alert('✅ Widget başarıyla kuruldu!');
                                    else alert('❌ Hata: ' + JSON.stringify(data.error));
                                } catch (e) {
                                    alert('Bir hata oluştu.');
                                } finally {
                                    if (btn) btn.innerText = 'Widget\'ı siteme otomatik kur';
                                }
                            }}
                            id="installBtn"
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
                        >
                            Widget'ı siteme otomatik kur
                        </button>
                    </div>

                    {/* Manual */}
                    <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                        <h4 className="font-bold text-gray-900 mb-2">🛠️ Manuel Kurulum</h4>
                        <p className="text-sm text-gray-600 mb-4">
                            Eğer kendiniz eklemek isterseniz, aşağıdaki kodu sitenizin <code>layout</code> dosyasında <code>&lt;/body&gt;</code> etiketinden hemen önce yapıştırın.
                        </p>
                        <textarea
                            readOnly
                            className="w-full h-24 p-3 font-mono text-xs bg-white border border-gray-300 rounded-md text-gray-600 focus:outline-none"
                            value={`<script src="https://my-admin-app.vercel.app/loyalty-widget.js" async></script>`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
