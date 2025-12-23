// src/shared/constants/countries.ts
// Полный список стран с флагами

export interface Country {
  name: string
  flag: string // emoji для fallback
  code: string
  flagUrl?: string // URL для загрузки флага
}

// Функция для получения URL флага
export function getCountryFlagUrl(code: string): string {
  // Используем REST Countries API для получения SVG флагов
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`
}

export const COUNTRIES: Country[] = [
  { name: 'Tajikistan', flag: '🇹🇯', code: 'TJ' },
  { name: 'Afghanistan', flag: '🇦🇫', code: 'AF' },
  { name: 'Albania', flag: '🇦🇱', code: 'AL' },
  { name: 'Algeria', flag: '🇩🇿', code: 'DZ' },
  { name: 'Argentina', flag: '🇦🇷', code: 'AR' },
  { name: 'Australia', flag: '🇦🇺', code: 'AU' },
  { name: 'Austria', flag: '🇦🇹', code: 'AT' },
  { name: 'Azerbaijan', flag: '🇦🇿', code: 'AZ' },
  { name: 'Bangladesh', flag: '🇧🇩', code: 'BD' },
  { name: 'Belarus', flag: '🇧🇾', code: 'BY' },
  { name: 'Belgium', flag: '🇧🇪', code: 'BE' },
  { name: 'Brazil', flag: '🇧🇷', code: 'BR' },
  { name: 'Bulgaria', flag: '🇧🇬', code: 'BG' },
  { name: 'Canada', flag: '🇨🇦', code: 'CA' },
  { name: 'China', flag: '🇨🇳', code: 'CN' },
  { name: 'Colombia', flag: '🇨🇴', code: 'CO' },
  { name: 'Croatia', flag: '🇭🇷', code: 'HR' },
  { name: 'Czech Republic', flag: '🇨🇿', code: 'CZ' },
  { name: 'Denmark', flag: '🇩🇰', code: 'DK' },
  { name: 'Egypt', flag: '🇪🇬', code: 'EG' },
  { name: 'Finland', flag: '🇫🇮', code: 'FI' },
  { name: 'France', flag: '🇫🇷', code: 'FR' },
  { name: 'Germany', flag: '🇩🇪', code: 'DE' },
  { name: 'Greece', flag: '🇬🇷', code: 'GR' },
  { name: 'Hungary', flag: '🇭🇺', code: 'HU' },
  { name: 'India', flag: '🇮🇳', code: 'IN' },
  { name: 'Indonesia', flag: '🇮🇩', code: 'ID' },
  { name: 'Iran', flag: '🇮🇷', code: 'IR' },
  { name: 'Iraq', flag: '🇮🇶', code: 'IQ' },
  { name: 'Ireland', flag: '🇮🇪', code: 'IE' },
  { name: 'Israel', flag: '🇮🇱', code: 'IL' },
  { name: 'Italy', flag: '🇮🇹', code: 'IT' },
  { name: 'Japan', flag: '🇯🇵', code: 'JP' },
  { name: 'Jordan', flag: '🇯🇴', code: 'JO' },
  { name: 'Kazakhstan', flag: '🇰🇿', code: 'KZ' },
  { name: 'Kenya', flag: '🇰🇪', code: 'KE' },
  { name: 'Kuwait', flag: '🇰🇼', code: 'KW' },
  { name: 'Kyrgyzstan', flag: '🇰🇬', code: 'KG' },
  { name: 'Lebanon', flag: '🇱🇧', code: 'LB' },
  { name: 'Malaysia', flag: '🇲🇾', code: 'MY' },
  { name: 'Mexico', flag: '🇲🇽', code: 'MX' },
  { name: 'Morocco', flag: '🇲🇦', code: 'MA' },
  { name: 'Netherlands', flag: '🇳🇱', code: 'NL' },
  { name: 'New Zealand', flag: '🇳🇿', code: 'NZ' },
  { name: 'Nigeria', flag: '🇳🇬', code: 'NG' },
  { name: 'Norway', flag: '🇳🇴', code: 'NO' },
  { name: 'Pakistan', flag: '🇵🇰', code: 'PK' },
  { name: 'Philippines', flag: '🇵🇭', code: 'PH' },
  { name: 'Poland', flag: '🇵🇱', code: 'PL' },
  { name: 'Portugal', flag: '🇵🇹', code: 'PT' },
  { name: 'Qatar', flag: '🇶🇦', code: 'QA' },
  { name: 'Romania', flag: '🇷🇴', code: 'RO' },
  { name: 'Russia', flag: '🇷🇺', code: 'RU' },
  { name: 'Saudi Arabia', flag: '🇸🇦', code: 'SA' },
  { name: 'Singapore', flag: '🇸🇬', code: 'SG' },
  { name: 'South Africa', flag: '🇿🇦', code: 'ZA' },
  { name: 'South Korea', flag: '🇰🇷', code: 'KR' },
  { name: 'Spain', flag: '🇪🇸', code: 'ES' },
  { name: 'Sweden', flag: '🇸🇪', code: 'SE' },
  { name: 'Switzerland', flag: '🇨🇭', code: 'CH' },
  { name: 'Syria', flag: '🇸🇾', code: 'SY' },
  { name: 'Thailand', flag: '🇹🇭', code: 'TH' },
  { name: 'Turkey', flag: '🇹🇷', code: 'TR' },
  { name: 'Turkmenistan', flag: '🇹🇲', code: 'TM' },
  { name: 'Ukraine', flag: '🇺🇦', code: 'UA' },
  { name: 'United Arab Emirates', flag: '🇦🇪', code: 'AE' },
  { name: 'United Kingdom', flag: '🇬🇧', code: 'GB' },
  { name: 'United States', flag: '🇺🇸', code: 'US' },
  { name: 'Uzbekistan', flag: '🇺🇿', code: 'UZ' },
  { name: 'Vietnam', flag: '🇻🇳', code: 'VN' },
  { name: 'Yemen', flag: '🇾🇪', code: 'YE' },
  { name: 'Other', flag: '🌍', code: 'XX' },
]

// Функция для получения флага по имени страны
export function getCountryFlag(countryName: string): string {
  const country = COUNTRIES.find(c => c.name === countryName)
  return country?.flag || '🌍'
}

