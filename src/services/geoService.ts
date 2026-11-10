import { DetectedLocation, detectCountryAndFlag } from './protocolParser';
import { registerPlugin, Capacitor } from '@capacitor/core';

interface NativeVpnPluginGeo {
  resolveGeo(options: { host: string }): Promise<{ country: string; countryCode: string; city: string }>;
}

const NativeGeo = registerPlugin<NativeVpnPluginGeo>('VpnPlugin');

// Convert 2-letter ISO country code to Emoji Flag
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

// Arabic country translations dictionary
const ARABIC_COUNTRIES: Record<string, string> = {
  EG: 'مصر',
  SA: 'المملكة العربية السعودية',
  AE: 'الإمارات العربية المتحدة',
  DE: 'ألمانيا',
  US: 'الولايات المتحدة',
  GB: 'المملكة المتحدة',
  UK: 'المملكة المتحدة',
  NL: 'هولندا',
  FR: 'فرنسا',
  TR: 'تركيا',
  SG: 'سنغافورة',
  JP: 'اليابان',
  CA: 'كندا',
  KW: 'الكويت',
  QA: 'قطر',
  BH: 'البحرين',
  OM: 'سلطنة عُمان',
  JO: 'الأردن',
  IT: 'إيطاليا',
  ES: 'إسبانيا',
  CH: 'سويسرا',
  SE: 'السويد',
  NO: 'النرويج',
  RU: 'روسيا',
  IN: 'الهند',
  KR: 'كوريا الجنوبية',
  BR: 'البرازيل',
  PL: 'بولندا',
  FI: 'فنلندا',
  AU: 'أستراليا',
  AT: 'النمسا',
  BE: 'بلجيكا',
  IE: 'أيرلندا',
  PT: 'البرتغال',
  GR: 'اليونان',
  CZ: 'التشيك',
  RO: 'رومانيا',
  UA: 'أوكرانيا',
  ZA: 'جنوب أفريقيا',
  MY: 'ماليزيا',
  ID: 'إندونيسيا',
  TH: 'تايلاند',
  VN: 'فيتنام',
  HK: 'هونغ كونغ',
  TW: 'تايوان',
  CN: 'الصين',
  DZ: 'الجزائر',
  MA: 'المغرب',
  TN: 'تونس',
  IQ: 'العراق',
  SY: 'سوريا',
  LB: 'لبنان',
  PS: 'فلسطين',
  YE: 'اليمن',
  SD: 'السودان',
  LY: 'ليبيا',
};

// Arabic city translations dictionary
const ARABIC_CITIES: Record<string, string> = {
  alexandria: 'الإسكندرية',
  cairo: 'القاهرة',
  giza: 'الجيزة',
  riyadh: 'الرياض',
  jeddah: 'جدة',
  mecca: 'مكة المكرمة',
  medina: 'المدينة المنورة',
  dammam: 'الدمام',
  khobar: 'الخبر',
  dubai: 'دبي',
  'abu dhabi': 'أبو ظبي',
  sharjah: 'الشارقة',
  frankfurt: 'فرانكفورت',
  berlin: 'برلين',
  munich: 'ميونخ',
  hamburg: 'هامبورغ',
  dusseldorf: 'دوسلدورف',
  london: 'لندن',
  manchester: 'مانشستر',
  birmingham: 'برمنغهام',
  'new york': 'نيويورك',
  'los angeles': 'لوس أنجلوس',
  chicago: 'شيكاغو',
  miami: 'ميامي',
  dallas: 'دالاس',
  seattle: 'سياتل',
  atlanta: 'أتلانتا',
  'san francisco': 'سان فرانسيسكو',
  paris: 'باريس',
  marseille: 'مارسيليا',
  lyon: 'ليون',
  amsterdam: 'أمستردام',
  rotterdam: 'روتردام',
  istanbul: 'إسطنبول',
  ankara: 'أنقرة',
  izmir: 'إزمير',
  singapore: 'سنغافورة',
  tokyo: 'طوكيو',
  osaka: 'أوساكا',
  toronto: 'تورونتو',
  montreal: 'مونتريال',
  vancouver: 'فانكوفر',
  'kuwait city': 'مدينة الكويت',
  doha: 'الدوحة',
  manama: 'المنامة',
  muscat: 'مسقط',
  amman: 'عمّان',
  rome: 'روما',
  milan: 'ميلانو',
  madrid: 'مدريد',
  barcelona: 'برشلونة',
  zurich: 'زيورخ',
  geneva: 'جنيف',
  stockholm: 'ستوكهولم',
  oslo: 'أوسلو',
  moscow: 'موسكو',
  'saint petersburg': 'سانت بطرسبرغ',
  mumbai: 'مومباي',
  delhi: 'دلهي',
  bangalore: 'بنغالور',
  seoul: 'سيول',
  'sao paulo': 'ساو باولو',
  warsaw: 'وارسو',
  helsinki: 'هلسنكي',
  sydney: 'سيدني',
  melbourne: 'ملبورن',
  vienna: 'فيينا',
  brussels: 'بروكسل',
  dublin: 'دبلن',
  lisbon: 'لشبونة',
  athens: 'أثينا',
  prague: 'براغ',
  bucharest: 'بوخارست',
  kyiv: 'كييف',
  beirut: 'بيروت',
  baghdad: 'بغداد',
  casablanca: 'الدار البيضاء',
  algiers: 'الجزائر',
  alger: 'الجزائر',
  oran: 'وهران',
  constantine: 'قسنطينة',
  annaba: 'عنابة',
  blida: 'البليدة',
  batna: 'باتنة',
  setif: 'سطيف',
  sétif: 'سطيف',
  'sidi bel abbes': 'سيدي بلعباس',
  biskra: 'بسكرة',
  tebessa: 'تبسة',
  'el oued': 'الوادي',
  skikda: 'سكيكدة',
  tiaret: 'تيارت',
  bejaia: 'بجاية',
  béjaïa: 'بجاية',
  tlemcen: 'تلمسان',
  ouargla: 'ورقلة',
  mostaganem: 'مستغانم',
  medea: 'المدية',
  médéa: 'المدية',
  'tizi ouzou': 'تيزي وزو',
  chlef: 'الشلف',
  cheraga: 'الشراقة',
  rouiba: 'الرويبة',
  'bir el djir': 'بئر الجير',
  'bordj bou arreridj': 'برج بوعريريج',
  jijel: 'جيجل',
  ghardaia: 'غرداية',
  ghardaïa: 'غرداية',
  mascara: 'معسكر',
  saida: 'سعيدة',
  adrar: 'أدرار',
  tunis: 'تونس',
};

export function translateCountryToArabic(countryCode: string, englishCountry: string): string {
  const code = (countryCode || '').toUpperCase().trim();
  if (ARABIC_COUNTRIES[code]) return ARABIC_COUNTRIES[code];
  const lowerName = (englishCountry || '').toLowerCase();
  if (lowerName.includes('algeria') || lowerName.includes('algérie') || lowerName.includes('algerie') || lowerName.includes('الجزائر')) return 'الجزائر';
  if (lowerName.includes('morocco') || lowerName.includes('maroc') || lowerName.includes('المغرب')) return 'المغرب';
  if (lowerName.includes('tunisia') || lowerName.includes('tunisie') || lowerName.includes('تونس')) return 'تونس';
  if (lowerName.includes('egypt') || lowerName.includes('égypte') || lowerName.includes('مصر')) return 'مصر';
  if (lowerName.includes('saudi') || lowerName.includes('السعودية')) return 'المملكة العربية السعودية';
  if (lowerName.includes('emirates') || lowerName.includes('الإمارات')) return 'الإمارات العربية المتحدة';
  if (lowerName.includes('germany') || lowerName.includes('deutschland') || lowerName.includes('ألمانيا')) return 'ألمانيا';
  if (lowerName.includes('united states') || lowerName.includes('usa') || lowerName.includes('أمريكا')) return 'الولايات المتحدة';
  if (lowerName.includes('united kingdom') || lowerName.includes('uk') || lowerName.includes('بريطانيا')) return 'المملكة المتحدة';
  if (lowerName.includes('france') || lowerName.includes('فرنسا')) return 'فرنسا';
  if (lowerName.includes('turkey') || lowerName.includes('türkiye') || lowerName.includes('تركيا')) return 'تركيا';
  if (lowerName.includes('netherlands') || lowerName.includes('هولندا')) return 'هولندا';
  for (const [k, v] of Object.entries(ARABIC_COUNTRIES)) {
    if (lowerName.includes(k.toLowerCase())) return v;
  }
  return englishCountry;
}

export function translateCityToArabic(city: string): string {
  if (!city) return '';
  const key = city.toLowerCase().trim();
  if (ARABIC_CITIES[key]) return ARABIC_CITIES[key];
  for (const [k, v] of Object.entries(ARABIC_CITIES)) {
    if (key.includes(k)) return v;
  }
  return city;
}

// In-memory cache to prevent redundant network requests
const geoCache = new Map<string, DetectedLocation>();

/**
 * Fetch real geographical location (Country, City, Flag) for an IP or hostname
 */
export async function fetchGeoLocation(hostOrIp: string, serverName?: string): Promise<DetectedLocation> {
  const raw = (hostOrIp || '').trim();
  // Strip port or protocol if present
  let cleanHost = raw.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].trim();
  if (!cleanHost) {
    return detectCountryAndFlag(serverName || '', '');
  }

  // Check cache
  if (geoCache.has(cleanHost)) {
    return geoCache.get(cleanHost)!;
  }

  // Fast check: if host string or name contains strong country keywords (e.g. algeria, egypt, saudi)
  const heuristicLoc = detectCountryAndFlag(serverName || '', cleanHost);
  if (heuristicLoc.country !== 'Global Node') {
    geoCache.set(cleanHost, heuristicLoc);
    return heuristicLoc;
  }

  // 1. Try Native Android plugin if running on native device (no mixed-content/CORS limitations)
  if (Capacitor.isNativePlatform()) {
    try {
      const nativeRes = await NativeGeo.resolveGeo({ host: cleanHost });
      if (nativeRes && nativeRes.country) {
        const country = nativeRes.country.trim();
        const city = (nativeRes.city || '').trim() || country;
        const countryCode = (nativeRes.countryCode || '').toUpperCase();
        const flag = getFlagEmoji(countryCode);
        const countryAr = translateCountryToArabic(countryCode, country);
        const cityAr = translateCityToArabic(city);

        const result: DetectedLocation = {
          country,
          city,
          countryAr,
          cityAr,
          flag,
        };

        geoCache.set(cleanHost, result);
        return result;
      }
    } catch (nativeErr) {
      console.warn('Native Geo resolution failed, falling back to HTTPS fetch:', nativeErr);
    }
  }

  // 2. Try ip-api.com first (Fast, handles both domains and IPs)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`http://ip-api.com/json/${cleanHost}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && (data.status === 'success' || data.country)) {
        const country = (data.country || '').trim();
        const city = (data.city || data.regionName || '').trim() || country;
        const countryCode = (data.countryCode || '').toUpperCase();
        const flag = getFlagEmoji(countryCode);
        const countryAr = translateCountryToArabic(countryCode, country);
        const cityAr = translateCityToArabic(city);

        if (country) {
          const result: DetectedLocation = {
            country,
            city,
            countryAr,
            cityAr,
            flag,
          };
          geoCache.set(cleanHost, result);
          return result;
        }
      }
    }
  } catch (err) {
    console.warn('ip-api.com lookup failed, trying fallback:', err);
  }

  // 3. Try ipwho.is (Accurate regional ISP mapping, HTTPS, free)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://ipwho.is/${cleanHost}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.country) {
        const country = data.country.trim();
        const city = (data.city || data.region || '').trim() || country;
        const countryCode = (data.country_code || '').toUpperCase();
        const flag = data.flag?.emoji || getFlagEmoji(countryCode);
        const countryAr = translateCountryToArabic(countryCode, country);
        const cityAr = translateCityToArabic(city);

        const result: DetectedLocation = {
          country,
          city,
          countryAr,
          cityAr,
          flag,
        };

        geoCache.set(cleanHost, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('ipwho.is lookup failed, trying fallback:', err);
  }

  // 4. Fallback to api.country.is (HTTPS, minimal, reliable)
  try {
    const controller3 = new AbortController();
    const timeoutId3 = setTimeout(() => controller3.abort(), 6000);

    const res3 = await fetch(`https://api.country.is/${cleanHost}`, {
      signal: controller3.signal,
    });
    clearTimeout(timeoutId3);

    if (res3.ok) {
      const data3 = await res3.json();
      if (data3 && data3.country) {
        const countryCode = (data3.country || '').toUpperCase();
        const flag = getFlagEmoji(countryCode);
        const countryAr = translateCountryToArabic(countryCode, '');
        const country = countryAr || countryCode;
        const city = country;
        const cityAr = countryAr;

        const result: DetectedLocation = {
          country,
          city,
          countryAr,
          cityAr,
          flag,
        };

        geoCache.set(cleanHost, result);
        return result;
      }
    }
  } catch (err3) {
    console.warn('country.is fallback lookup failed:', err3);
  }

  // 5. Fallback to freeipapi.com (HTTPS, free)
  try {
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 6000);

    const res2 = await fetch(`https://freeipapi.com/api/json/${cleanHost}`, {
      signal: controller2.signal,
    });
    clearTimeout(timeoutId2);

    if (res2.ok) {
      const data2 = await res2.json();
      if (data2 && data2.countryName) {
        const country = data2.countryName.trim();
        const city = (data2.cityName || data2.regionName || '').trim() || country;
        const countryCode = (data2.countryCode || '').toUpperCase();
        const flag = getFlagEmoji(countryCode);
        const countryAr = translateCountryToArabic(countryCode, country);
        const cityAr = translateCityToArabic(city);

        const result: DetectedLocation = {
          country,
          city,
          countryAr,
          cityAr,
          flag,
        };

        geoCache.set(cleanHost, result);
        return result;
      }
    }
  } catch (err2) {
    console.warn('freeipapi.com fallback lookup failed:', err2);
  }

  // 6. Return heuristic or Global Node (Do NOT cache Global Node so it can be re-queried later)
  return heuristicLoc;
}
