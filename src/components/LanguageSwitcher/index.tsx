import { useGameDataStore } from '../../stores/gameDataStore';

export function LanguageSwitcher() {
  const { locale, setLocale, isLoading } = useGameDataStore();
  
  const languages = [
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];

  return (
    <div className="flex items-center gap-2">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        disabled={isLoading}
        className="px-3 py-2 border border-neon-cyan/40 rounded-lg bg-dark-700/50 text-white text-sm focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,217,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          color: '#FFFFFF'
        }}
      >
        {languages.map(({ code, label, flag }) => (
          <option key={code} value={code} style={{ backgroundColor: '#1E293B', color: '#FFFFFF' }}>
            {flag} {label}
          </option>
        ))}
      </select>
      
      {isLoading && (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neon-cyan shadow-[0_0_8px_rgba(0,217,255,0.4)]"></div>
      )}
    </div>
  );
}
