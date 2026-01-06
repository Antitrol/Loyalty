
import React, { useState } from 'react';

interface Props {
    settings: any;
    setSettings: (s: any) => void;
}

// Preset Themes
const PRESET_THEMES = {
    light: {
        name: 'Light',
        icon: '☀️',
        primary: '#4F46E5',
        secondary: '#818CF8',
        description: 'Temiz ve aydınlık tasarım'
    },
    dark: {
        name: 'Dark',
        icon: '🌙',
        primary: '#6366F1',
        secondary: '#4F46E5',
        description: 'Modern koyu tema'
    },
    gradient: {
        name: 'Gradient',
        icon: '🎨',
        primary: '#EC4899',
        secondary: '#8B5CF6',
        description: 'Canlı gradient renkleri'
    },
    minimal: {
        name: 'Minimal',
        icon: '⚪',
        primary: '#1F2937',
        secondary: '#6B7280',
        description: 'Sade ve minimal'
    },
    colorful: {
        name: 'Colorful',
        icon: '🌈',
        primary: '#F59E0B',
        secondary: '#EF4444',
        description: 'Renkli ve enerjik'
    }
};

const WIDGET_STYLES = [
    { id: 'default', name: 'Varsayılan', icon: '🎯', description: 'Floating badge tasarım' },
    { id: 'minimal', name: 'Minimal', icon: '⭐', description: 'Sadece puan göster' },
    { id: 'card', name: 'Kart', icon: '🃏', description: 'Geniş bilgi kartı' },
    { id: 'compact', name: 'Kompakt', icon: '📌', description: 'Küçük yan çubuk' }
];

const POSITIONS = [
    { id: 'bottom-right', name: 'Sağ Alt', icon: '↘️' },
    { id: 'bottom-left', name: 'Sol Alt', icon: '↙️' },
    { id: 'top-right', name: 'Sağ Üst', icon: '↗️' },
    { id: 'top-left', name: 'Sol Üst', icon: '↖️' }
];

const SHADOW_LEVELS = [
    { id: 'low', name: 'Düşük', intensity: 1 },
    { id: 'medium', name: 'Orta', intensity: 2 },
    { id: 'high', name: 'Yüksek', intensity: 3 }
];

export default function WidgetDesign({ settings, setSettings }: Props) {
    const [previewExpanded, setPreviewExpanded] = useState(false);

    const applyTheme = (themeKey: string) => {
        const theme = PRESET_THEMES[themeKey as keyof typeof PRESET_THEMES];
        setSettings({
            ...settings,
            widgetTheme: themeKey,
            widgetPrimaryColor: theme.primary,
            widgetSecondaryColor: theme.secondary
        });
    };

    const currentTheme = settings.widgetTheme || 'light';
    const currentStyle = settings.widgetStyle || 'default';
    const currentPosition = settings.widgetPosition || 'bottom-right';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                    🎨 Widget Tasarım & Görünüm
                </h3>
                <p className="text-sm text-gray-500">Sitenizde görünecek sadakat widget'ının tüm özelleştirme ayarları.</p>
            </div>

            {/* Theme Selector */}
            <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-800">Tema Seçimi</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(PRESET_THEMES).map(([key, theme]) => (
                        <button
                            key={key}
                            onClick={() => applyTheme(key)}
                            className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${currentTheme === key
                                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="text-3xl mb-2">{theme.icon}</div>
                            <div className="font-semibold text-sm text-gray-900">{theme.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{theme.description}</div>
                            <div className="flex gap-1 mt-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.secondary }}></div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Customization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Ana Renk (Primary)</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={settings.widgetPrimaryColor || '#4F46E5'}
                            onChange={(e) => setSettings({ ...settings, widgetPrimaryColor: e.target.value })}
                            className="h-12 w-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                        />
                        <input
                            type="text"
                            value={settings.widgetPrimaryColor || '#4F46E5'}
                            onChange={(e) => setSettings({ ...settings, widgetPrimaryColor: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md uppercase font-mono text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">İkincil Renk (Secondary)</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={settings.widgetSecondaryColor || '#818CF8'}
                            onChange={(e) => setSettings({ ...settings, widgetSecondaryColor: e.target.value })}
                            className="h-12 w-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                        />
                        <input
                            type="text"
                            value={settings.widgetSecondaryColor || '#818CF8'}
                            onChange={(e) => setSettings({ ...settings, widgetSecondaryColor: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md uppercase font-mono text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Widget Style */}
            <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-800">Görünüm Stili</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {WIDGET_STYLES.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => setSettings({ ...settings, widgetStyle: style.id })}
                            className={`p-4 rounded-lg border-2 transition-all ${currentStyle === style.id
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="text-2xl mb-1">{style.icon}</div>
                            <div className="font-semibold text-sm">{style.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{style.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Position & Behavior */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Widget Konumu</label>
                    <div className="grid grid-cols-2 gap-2">
                        {POSITIONS.map((pos) => (
                            <button
                                key={pos.id}
                                onClick={() => setSettings({ ...settings, widgetPosition: pos.id })}
                                className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${currentPosition === pos.id
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <span className="mr-2">{pos.icon}</span>
                                {pos.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Davranış Ayarları</label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                            <input
                                type="checkbox"
                                checked={settings.widgetAnimations ?? true}
                                onChange={(e) => setSettings({ ...settings, widgetAnimations: e.target.checked })}
                                className="w-5 h-5 text-indigo-600 rounded"
                            />
                            <div>
                                <div className="font-medium text-sm">Animasyonlar</div>
                                <div className="text-xs text-gray-500">Geçiş efektleri ve animasyonlar</div>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                            <input
                                type="checkbox"
                                checked={settings.widgetAutoExpand ?? false}
                                onChange={(e) => setSettings({ ...settings, widgetAutoExpand: e.target.checked })}
                                className="w-5 h-5 text-indigo-600 rounded"
                            />
                            <div>
                                <div className="font-medium text-sm">Otomatik Açılma</div>
                                <div className="text-xs text-gray-500">Sayfa yüklendiğinde aç</div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Advanced Styling */}
            <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4">Gelişmiş Stil Ayarları</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Puan Etiketi</label>
                        <input
                            type="text"
                            value={settings.widgetLabel || 'Puan'}
                            onChange={(e) => setSettings({ ...settings, widgetLabel: e.target.value })}
                            placeholder="Örn: Coin, Yıldız"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Köşe Yuvarlaklığı</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="0"
                                max="32"
                                value={settings.widgetBorderRadius ?? 16}
                                onChange={(e) => setSettings({ ...settings, widgetBorderRadius: parseInt(e.target.value) })}
                                className="flex-1"
                            />
                            <span className="text-sm font-mono w-12 text-right">{settings.widgetBorderRadius ?? 16}px</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Gölge Yoğunluğu</label>
                        <div className="flex gap-2">
                            {SHADOW_LEVELS.map((shadow) => (
                                <button
                                    key={shadow.id}
                                    onClick={() => setSettings({ ...settings, widgetShadowIntensity: shadow.id })}
                                    className={`flex-1 px-3 py-2 rounded-md border-2 text-sm font-medium transition ${(settings.widgetShadowIntensity || 'medium') === shadow.id
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {shadow.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Preview */}
            <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-gray-800">Canlı Önizleme</h4>
                    <button
                        onClick={() => setPreviewExpanded(!previewExpanded)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        {previewExpanded ? 'Daralt ▲' : 'Genişlet ▼'}
                    </button>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 border border-gray-200 relative min-h-[200px] flex items-center justify-center">
                    <div className="absolute top-3 left-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Önizleme
                    </div>

                    {/* Widget Mockup */}
                    <div
                        className="bg-white shadow-lg transition-all duration-300"
                        style={{
                            borderRadius: `${settings.widgetBorderRadius ?? 16}px`,
                            boxShadow:
                                (settings.widgetShadowIntensity || 'medium') === 'low' ? '0 4px 6px rgba(0,0,0,0.1)' :
                                    (settings.widgetShadowIntensity || 'medium') === 'high' ? '0 20px 40px rgba(0,0,0,0.2)' :
                                        '0 10px 25px rgba(0,0,0,0.15)'
                        }}
                    >
                        {!previewExpanded ? (
                            // Collapsed Badge
                            <div className="px-5 py-4 flex items-center gap-3">
                                <div className="text-2xl">⭐</div>
                                <div>
                                    <div className="text-xl font-bold" style={{ color: settings.widgetPrimaryColor }}>
                                        500
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                                        {settings.widgetLabel || 'Puan'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Expanded View
                            <div className="w-80">
                                <div
                                    className="px-6 py-4 text-white flex items-center justify-between"
                                    style={{
                                        background: `linear-gradient(135deg, ${settings.widgetPrimaryColor}, ${settings.widgetSecondaryColor})`,
                                        borderRadius: `${settings.widgetBorderRadius ?? 16}px ${settings.widgetBorderRadius ?? 16}px 0 0`
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">⭐</span>
                                        <span className="font-semibold">Sadakat {settings.widgetLabel || 'Puan'}ın</span>
                                    </div>
                                    <button className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
                                        ×
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-xs uppercase text-gray-500">Puan</span>
                                        <span className="text-2xl font-bold" style={{ color: settings.widgetPrimaryColor }}>
                                            500
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-xs uppercase text-gray-500">Seviye</span>
                                        <span className="text-xl font-bold" style={{ color: settings.widgetPrimaryColor }}>
                                            Gold
                                        </span>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
                                        <button
                                            className="w-full py-3 text-white font-semibold rounded-lg transition hover:opacity-90"
                                            style={{ backgroundColor: settings.widgetPrimaryColor }}
                                        >
                                            {settings.widgetLabel || 'Puan'} Kullan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
 
 