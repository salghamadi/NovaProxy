import { Server, ProtocolType, SecurityType, NetworkType } from '../types';

export interface DetectedLocation {
  country: string;
  city: string;
  countryAr: string;
  cityAr: string;
  flag: string;
}

// Flag and City mapping by country code or server name heuristics
interface CountryDef {
  code: string;
  flag: string;
  country: string;
  countryAr: string;
  defaultCity: string;
  defaultCityAr: string;
  countryRegex: RegExp;
  cityRegex?: Array<{
    city: string;
    cityAr: string;
    regex: RegExp;
  }>;
}

const KNOWN_COUNTRIES: CountryDef[] = [
  {
    code: 'DZ',
    flag: '🇩🇿',
    country: 'Algeria',
    countryAr: 'الجزائر',
    defaultCity: 'Algiers',
    defaultCityAr: 'الجزائر',
    countryRegex: /\b(algeria|algerie|algérie|alger|الجزائر)\b/i,
    cityRegex: [
      { city: 'Algiers', cityAr: 'الجزائر', regex: /\b(algiers|alger|الجزائر)\b/i },
      { city: 'Oran', cityAr: 'وهران', regex: /\b(oran|وهران)\b/i },
      { city: 'Constantine', cityAr: 'قسنطينة', regex: /\b(constantine|قسنطينة)\b/i },
      { city: 'Annaba', cityAr: 'عنابة', regex: /\b(annaba|عنابة)\b/i },
      { city: 'Blida', cityAr: 'البليدة', regex: /\b(blida|البليدة)\b/i },
      { city: 'Batna', cityAr: 'باتنة', regex: /\b(batna|باتنة)\b/i },
      { city: 'Setif', cityAr: 'سطيف', regex: /\b(setif|sétif|سطيف)\b/i },
      { city: 'Tlemcen', cityAr: 'تلمسان', regex: /\b(tlemcen|تلمسان)\b/i },
      { city: 'Bejaia', cityAr: 'بجاية', regex: /\b(bejaia|béjaïa|بجاية)\b/i },
    ],
  },
  {
    code: 'EG',
    flag: '🇪🇬',
    country: 'Egypt',
    countryAr: 'مصر',
    defaultCity: 'Cairo',
    defaultCityAr: 'القاهرة',
    countryRegex: /\b(egypt|égypte|مصر)\b/i,
    cityRegex: [
      { city: 'Alexandria', cityAr: 'الإسكندرية', regex: /\b(alexandria|alex|اسكندرية|إسكندرية)\b/i },
      { city: 'Cairo', cityAr: 'القاهرة', regex: /\b(cairo|القاهرة)\b/i },
      { city: 'Giza', cityAr: 'الجيزة', regex: /\b(giza|الجيزة)\b/i },
      { city: 'Mansoura', cityAr: 'المنصورة', regex: /\b(mansoura|المنصورة)\b/i },
      { city: 'Tanta', cityAr: 'طنطا', regex: /\b(tanta|طنطا)\b/i },
      { city: 'Ismailia', cityAr: 'الإسماعيلية', regex: /\b(ismailia|الإسماعيلية)\b/i },
      { city: 'Port Said', cityAr: 'بورسعيد', regex: /\b(port said|بورسعيد)\b/i },
      { city: 'Suez', cityAr: 'السويس', regex: /\b(suez|السويس)\b/i },
    ],
  },
  {
    code: 'SA',
    flag: '🇸🇦',
    country: 'Saudi Arabia',
    countryAr: 'المملكة العربية السعودية',
    defaultCity: 'Riyadh',
    defaultCityAr: 'الرياض',
    countryRegex: /\b(saudi|ksa|السعودية|المملكة العربية السعودية)\b/i,
    cityRegex: [
      { city: 'Jeddah', cityAr: 'جدة', regex: /\b(jeddah|جدة)\b/i },
      { city: 'Riyadh', cityAr: 'الرياض', regex: /\b(riyadh|الرياض)\b/i },
      { city: 'Dammam', cityAr: 'الدمام', regex: /\b(dammam|الدمام)\b/i },
      { city: 'Mecca', cityAr: 'مكة المكرمة', regex: /\b(mecca|makkah|مكة)\b/i },
      { city: 'Medina', cityAr: 'المدينة المنورة', regex: /\b(medina|madinah|المدينة)\b/i },
      { city: 'Khobar', cityAr: 'الخبر', regex: /\b(khobar|الخبر)\b/i },
    ],
  },
  {
    code: 'AE',
    flag: '🇦🇪',
    country: 'United Arab Emirates',
    countryAr: 'الإمارات العربية المتحدة',
    defaultCity: 'Dubai',
    defaultCityAr: 'دبي',
    countryRegex: /\b(uae|emirates|الإمارات|الامارات)\b/i,
    cityRegex: [
      { city: 'Abu Dhabi', cityAr: 'أبو ظبي', regex: /\b(abu dhabi|أبوظبي|أبو ظبي)\b/i },
      { city: 'Dubai', cityAr: 'دبي', regex: /\b(dubai|دبي)\b/i },
      { city: 'Sharjah', cityAr: 'الشارقة', regex: /\b(sharjah|الشارقة)\b/i },
    ],
  },
  {
    code: 'MA',
    flag: '🇲🇦',
    country: 'Morocco',
    countryAr: 'المغرب',
    defaultCity: 'Casablanca',
    defaultCityAr: 'الدار البيضاء',
    countryRegex: /\b(morocco|maroc|المغرب)\b/i,
    cityRegex: [
      { city: 'Casablanca', cityAr: 'الدار البيضاء', regex: /\b(casablanca|الدار البيضاء)\b/i },
      { city: 'Rabat', cityAr: 'الرباط', regex: /\b(rabat|الرباط)\b/i },
      { city: 'Marrakech', cityAr: 'مراكش', regex: /\b(marrakech|marrakesh|مراكش)\b/i },
      { city: 'Tangier', cityAr: 'طنجة', regex: /\b(tangier|tanger|طنجة)\b/i },
    ],
  },
  {
    code: 'TN',
    flag: '🇹🇳',
    country: 'Tunisia',
    countryAr: 'تونس',
    defaultCity: 'Tunis',
    defaultCityAr: 'تونس',
    countryRegex: /\b(tunisia|tunisie|تونس)\b/i,
    cityRegex: [
      { city: 'Tunis', cityAr: 'تونس', regex: /\b(tunis|تونس)\b/i },
      { city: 'Sfax', cityAr: 'صفاقس', regex: /\b(sfax|صفاقس)\b/i },
      { city: 'Sousse', cityAr: 'سوسة', regex: /\b(sousse|سوسة)\b/i },
    ],
  },
  {
    code: 'DE',
    flag: '🇩🇪',
    country: 'Germany',
    countryAr: 'ألمانيا',
    defaultCity: 'Frankfurt',
    defaultCityAr: 'فرانكفورت',
    countryRegex: /\b(germany|deutschland|ألمانيا|المانيا)\b/i,
    cityRegex: [
      { city: 'Berlin', cityAr: 'برلين', regex: /\b(berlin|برلين)\b/i },
      { city: 'Munich', cityAr: 'ميونخ', regex: /\b(munich|münchen|ميونخ)\b/i },
      { city: 'Frankfurt', cityAr: 'فرانكفورت', regex: /\b(frankfurt|fra|فرانكفورت)\b/i },
      { city: 'Hamburg', cityAr: 'هامبورغ', regex: /\b(hamburg|هامبورغ)\b/i },
      { city: 'Dusseldorf', cityAr: 'دوسلدورف', regex: /\b(dusseldorf|düsseldorf|دوسلدورف)\b/i },
    ],
  },
  {
    code: 'US',
    flag: '🇺🇸',
    country: 'United States',
    countryAr: 'الولايات المتحدة',
    defaultCity: 'New York',
    defaultCityAr: 'نيويورك',
    countryRegex: /\b(usa|united states|america|أمريكا|امريكا|الولايات المتحدة)\b/i,
    cityRegex: [
      { city: 'Los Angeles', cityAr: 'لوس أنجلوس', regex: /\b(los angeles|lax|لوس أنجلوس)\b/i },
      { city: 'Miami', cityAr: 'ميامي', regex: /\b(miami|ميامي)\b/i },
      { city: 'New York', cityAr: 'نيويورك', regex: /\b(new york|nyc|نيويورك)\b/i },
      { city: 'Chicago', cityAr: 'شيكاغو', regex: /\b(chicago|شيكاغو)\b/i },
      { city: 'Dallas', cityAr: 'دالاس', regex: /\b(dallas|دالاس)\b/i },
      { city: 'Seattle', cityAr: 'سياتل', regex: /\b(seattle|سياتل)\b/i },
    ],
  },
  {
    code: 'GB',
    flag: '🇬🇧',
    country: 'United Kingdom',
    countryAr: 'المملكة المتحدة',
    defaultCity: 'London',
    defaultCityAr: 'لندن',
    countryRegex: /\b(united kingdom|britain|uk|المملكة المتحدة|بريطانيا)\b/i,
    cityRegex: [
      { city: 'London', cityAr: 'لندن', regex: /\b(london|لندن)\b/i },
      { city: 'Manchester', cityAr: 'مانشستر', regex: /\b(manchester|مانشستر)\b/i },
      { city: 'Birmingham', cityAr: 'برمنغهام', regex: /\b(birmingham|برمنغهام)\b/i },
    ],
  },
  {
    code: 'FR',
    flag: '🇫🇷',
    country: 'France',
    countryAr: 'فرنسا',
    defaultCity: 'Paris',
    defaultCityAr: 'باريس',
    countryRegex: /\b(france|فرنسا)\b/i,
    cityRegex: [
      { city: 'Paris', cityAr: 'باريس', regex: /\b(paris|باريس)\b/i },
      { city: 'Marseille', cityAr: 'مارسيليا', regex: /\b(marseille|مارسيليا)\b/i },
      { city: 'Lyon', cityAr: 'ليون', regex: /\b(lyon|ليون)\b/i },
    ],
  },
  {
    code: 'TR',
    flag: '🇹🇷',
    country: 'Turkey',
    countryAr: 'تركيا',
    defaultCity: 'Istanbul',
    defaultCityAr: 'إسطنبول',
    countryRegex: /\b(turkey|türkiye|تركيا)\b/i,
    cityRegex: [
      { city: 'Istanbul', cityAr: 'إسطنبول', regex: /\b(istanbul|إسطنبول|اسطنبول)\b/i },
      { city: 'Ankara', cityAr: 'أنقرة', regex: /\b(ankara|أنقرة|انقرة)\b/i },
      { city: 'Izmir', cityAr: 'إزمير', regex: /\b(izmir|إزمير|ازمير)\b/i },
    ],
  },
  {
    code: 'NL',
    flag: '🇳🇱',
    country: 'Netherlands',
    countryAr: 'هولندا',
    defaultCity: 'Amsterdam',
    defaultCityAr: 'أمستردام',
    countryRegex: /\b(netherlands|holland|هولندا)\b/i,
    cityRegex: [
      { city: 'Amsterdam', cityAr: 'أمستردام', regex: /\b(amsterdam|ams|أمستردام)\b/i },
      { city: 'Rotterdam', cityAr: 'روتردام', regex: /\b(rotterdam|روتردام)\b/i },
    ],
  },
  {
    code: 'CA',
    flag: '🇨🇦',
    country: 'Canada',
    countryAr: 'كندا',
    defaultCity: 'Toronto',
    defaultCityAr: 'تورونتو',
    countryRegex: /\b(canada|كندا)\b/i,
    cityRegex: [
      { city: 'Toronto', cityAr: 'تورونتو', regex: /\b(toronto|تورونتو)\b/i },
      { city: 'Montreal', cityAr: 'مونتريال', regex: /\b(montreal|مونتريال)\b/i },
      { city: 'Vancouver', cityAr: 'فانكوفر', regex: /\b(vancouver|فانكوفر)\b/i },
    ],
  },
  {
    code: 'SG',
    flag: '🇸🇬',
    country: 'Singapore',
    countryAr: 'سنغافورة',
    defaultCity: 'Singapore',
    defaultCityAr: 'سنغافورة',
    countryRegex: /\b(singapore|سنغافورة)\b/i,
  },
  {
    code: 'JP',
    flag: '🇯🇵',
    country: 'Japan',
    countryAr: 'اليابان',
    defaultCity: 'Tokyo',
    defaultCityAr: 'طوكيو',
    countryRegex: /\b(japan|اليابان)\b/i,
    cityRegex: [
      { city: 'Tokyo', cityAr: 'طوكيو', regex: /\b(tokyo|طوكيو)\b/i },
      { city: 'Osaka', cityAr: 'أوساكا', regex: /\b(osaka|أوساكا)\b/i },
    ],
  },
  {
    code: 'IT',
    flag: '🇮🇹',
    country: 'Italy',
    countryAr: 'إيطاليا',
    defaultCity: 'Rome',
    defaultCityAr: 'روما',
    countryRegex: /\b(italy|italia|إيطاليا)\b/i,
    cityRegex: [
      { city: 'Rome', cityAr: 'روما', regex: /\b(rome|roma|روما)\b/i },
      { city: 'Milan', cityAr: 'ميلانو', regex: /\b(milan|milano|ميلانو)\b/i },
    ],
  },
  {
    code: 'ES',
    flag: '🇪🇸',
    country: 'Spain',
    countryAr: 'إسبانيا',
    defaultCity: 'Madrid',
    defaultCityAr: 'مدريد',
    countryRegex: /\b(spain|españa|إسبانيا)\b/i,
    cityRegex: [
      { city: 'Madrid', cityAr: 'مدريد', regex: /\b(madrid|مدريد)\b/i },
      { city: 'Barcelona', cityAr: 'برشلونة', regex: /\b(barcelona|برشلونة)\b/i },
    ],
  },
  {
    code: 'CH',
    flag: '🇨🇭',
    country: 'Switzerland',
    countryAr: 'سويسرا',
    defaultCity: 'Zurich',
    defaultCityAr: 'زيورخ',
    countryRegex: /\b(switzerland|schweiz|سويسرا)\b/i,
  },
  {
    code: 'SE',
    flag: '🇸🇪',
    country: 'Sweden',
    countryAr: 'السويد',
    defaultCity: 'Stockholm',
    defaultCityAr: 'ستوكهولم',
    countryRegex: /\b(sweden|sverige|السويد)\b/i,
  },
  {
    code: 'NO',
    flag: '🇳🇴',
    country: 'Norway',
    countryAr: 'النرويج',
    defaultCity: 'Oslo',
    defaultCityAr: 'أوسلو',
    countryRegex: /\b(norway|norge|النرويج)\b/i,
  },
  {
    code: 'RU',
    flag: '🇷🇺',
    country: 'Russia',
    countryAr: 'روسيا',
    defaultCity: 'Moscow',
    defaultCityAr: 'موسكو',
    countryRegex: /\b(russia|روسيا)\b/i,
  },
  {
    code: 'IN',
    flag: '🇮🇳',
    country: 'India',
    countryAr: 'الهند',
    defaultCity: 'Mumbai',
    defaultCityAr: 'مومباي',
    countryRegex: /\b(india|bharat|الهند)\b/i,
  },
  {
    code: 'BR',
    flag: '🇧🇷',
    country: 'Brazil',
    countryAr: 'البرازيل',
    defaultCity: 'Sao Paulo',
    defaultCityAr: 'ساو باولو',
    countryRegex: /\b(brazil|brasil|البرازيل)\b/i,
  },
  {
    code: 'KW',
    flag: '🇰🇼',
    country: 'Kuwait',
    countryAr: 'الكويت',
    defaultCity: 'Kuwait City',
    defaultCityAr: 'مدينة الكويت',
    countryRegex: /\b(kuwait|الكويت)\b/i,
  },
  {
    code: 'QA',
    flag: '🇶🇦',
    country: 'Qatar',
    countryAr: 'قطر',
    defaultCity: 'Doha',
    defaultCityAr: 'الدوحة',
    countryRegex: /\b(qatar|قطر)\b/i,
  },
  {
    code: 'BH',
    flag: '🇧🇭',
    country: 'Bahrain',
    countryAr: 'البحرين',
    defaultCity: 'Manama',
    defaultCityAr: 'المنامة',
    countryRegex: /\b(bahrain|البحرين)\b/i,
  },
  {
    code: 'OM',
    flag: '🇴🇲',
    country: 'Oman',
    countryAr: 'سلطنة عُمان',
    defaultCity: 'Muscat',
    defaultCityAr: 'مسقط',
    countryRegex: /\b(oman|عُمان|عمان|سلطنة عُمان)\b/i,
  },
  {
    code: 'JO',
    flag: '🇯🇴',
    country: 'Jordan',
    countryAr: 'الأردن',
    defaultCity: 'Amman',
    defaultCityAr: 'عمّان',
    countryRegex: /\b(jordan|الأردن|الاردن)\b/i,
  },
  {
    code: 'IQ',
    flag: '🇮🇶',
    country: 'Iraq',
    countryAr: 'العراق',
    defaultCity: 'Baghdad',
    defaultCityAr: 'بغداد',
    countryRegex: /\b(iraq|العراق)\b/i,
  },
  {
    code: 'LB',
    flag: '🇱🇧',
    country: 'Lebanon',
    countryAr: 'لبنان',
    defaultCity: 'Beirut',
    defaultCityAr: 'بيروت',
    countryRegex: /\b(lebanon|لبنان)\b/i,
  },
  {
    code: 'PS',
    flag: '🇵🇸',
    country: 'Palestine',
    countryAr: 'فلسطين',
    defaultCity: 'Jerusalem',
    defaultCityAr: 'القدس',
    countryRegex: /\b(palestine|فلسطين)\b/i,
  },
  {
    code: 'SD',
    flag: '🇸🇩',
    country: 'Sudan',
    countryAr: 'السودان',
    defaultCity: 'Khartoum',
    defaultCityAr: 'الخرطوم',
    countryRegex: /\b(sudan|السودان)\b/i,
  },
  {
    code: 'LY',
    flag: '🇱🇾',
    country: 'Libya',
    countryAr: 'ليبيا',
    defaultCity: 'Tripoli',
    defaultCityAr: 'طرابلس',
    countryRegex: /\b(libya|ليبيا)\b/i,
  },
  {
    code: 'YE',
    flag: '🇾🇪',
    country: 'Yemen',
    countryAr: 'اليمن',
    defaultCity: 'Sanaa',
    defaultCityAr: 'صنعاء',
    countryRegex: /\b(yemen|اليمن)\b/i,
  },
  {
    code: 'SY',
    flag: '🇸🇾',
    country: 'Syria',
    countryAr: 'سوريا',
    defaultCity: 'Damascus',
    defaultCityAr: 'دمشق',
    countryRegex: /\b(syria|سوريا)\b/i,
  },
  {
    code: 'PL',
    flag: '🇵🇱',
    country: 'Poland',
    countryAr: 'بولندا',
    defaultCity: 'Warsaw',
    defaultCityAr: 'وارسو',
    countryRegex: /\b(poland|polska|بولندا)\b/i,
  },
  {
    code: 'AU',
    flag: '🇦🇺',
    country: 'Australia',
    countryAr: 'أستراليا',
    defaultCity: 'Sydney',
    defaultCityAr: 'سيدني',
    countryRegex: /\b(australia|أستراليا|استراليا)\b/i,
  },
  {
    code: 'KR',
    flag: '🇰🇷',
    country: 'South Korea',
    countryAr: 'كوريا الجنوبية',
    defaultCity: 'Seoul',
    defaultCityAr: 'سيول',
    countryRegex: /\b(korea|كوريا)\b/i,
  },
  {
    code: 'CN',
    flag: '🇨🇳',
    country: 'China',
    countryAr: 'الصين',
    defaultCity: 'Beijing',
    defaultCityAr: 'بكين',
    countryRegex: /\b(china|الصين)\b/i,
  },
  {
    code: 'HK',
    flag: '🇭🇰',
    country: 'Hong Kong',
    countryAr: 'هونغ كونغ',
    defaultCity: 'Hong Kong',
    defaultCityAr: 'هونغ كونغ',
    countryRegex: /\b(hong kong|هونغ كونغ|هونج كونج)\b/i,
  },
  {
    code: 'AT',
    flag: '🇦🇹',
    country: 'Austria',
    countryAr: 'النمسا',
    defaultCity: 'Vienna',
    defaultCityAr: 'فيينا',
    countryRegex: /\b(austria|النمسا)\b/i,
  },
  {
    code: 'BE',
    flag: '🇧🇪',
    country: 'Belgium',
    countryAr: 'بلجيكا',
    defaultCity: 'Brussels',
    defaultCityAr: 'بروكسل',
    countryRegex: /\b(belgium|بلجيكا)\b/i,
  },
];

export function translateCountryToArabic(countryCode: string, englishCountry: string): string {
  const code = (countryCode || '').toUpperCase().trim();
  if (code) {
    const found = KNOWN_COUNTRIES.find(c => c.code === code);
    if (found) return found.countryAr;
  }
  const lower = (englishCountry || '').toLowerCase();
  for (const c of KNOWN_COUNTRIES) {
    if (c.countryRegex.test(lower)) return c.countryAr;
  }
  return englishCountry;
}

export function translateCityToArabic(city: string): string {
  if (!city) return '';
  const lower = city.toLowerCase();
  for (const c of KNOWN_COUNTRIES) {
    if (c.cityRegex) {
      for (const cr of c.cityRegex) {
        if (cr.regex.test(lower)) return cr.cityAr;
      }
    }
  }
  return city;
}

export function detectCountryAndFlag(name: string, host: string): DetectedLocation {
  const cleanName = (name || '').trim();
  const cleanHost = (host || '').trim();
  const text = `${cleanName} ${cleanHost}`;

  // 1. Emoji flag detection
  for (const c of KNOWN_COUNTRIES) {
    if (text.includes(c.flag)) {
      let city = c.defaultCity;
      let cityAr = c.defaultCityAr;
      if (c.cityRegex) {
        for (const cr of c.cityRegex) {
          if (cr.regex.test(text)) {
            city = cr.city;
            cityAr = cr.cityAr;
            break;
          }
        }
      }
      return {
        country: c.country,
        city,
        countryAr: c.countryAr,
        cityAr,
        flag: c.flag,
      };
    }
  }

  // 2. City regex detection (Directly infer country and city from city name)
  for (const c of KNOWN_COUNTRIES) {
    if (c.cityRegex) {
      for (const cr of c.cityRegex) {
        if (cr.regex.test(text)) {
          return {
            country: c.country,
            city: cr.city,
            countryAr: c.countryAr,
            cityAr: cr.cityAr,
            flag: c.flag,
          };
        }
      }
    }
  }

  // 3. Exact Country Name detection (with word boundaries to avoid false positives)
  for (const c of KNOWN_COUNTRIES) {
    if (c.countryRegex.test(text)) {
      return {
        country: c.country,
        city: c.defaultCity,
        countryAr: c.countryAr,
        cityAr: c.defaultCityAr,
        flag: c.flag,
      };
    }
  }

  // 4. Standalone ISO 2-letter country codes inside server name ONLY (e.g. "[DZ]", "EG-01", "SA Server")
  if (cleanName) {
    for (const c of KNOWN_COUNTRIES) {
      const codeRegex = new RegExp(`\\b${c.code}\\b`, 'i');
      if (codeRegex.test(cleanName)) {
        return {
          country: c.country,
          city: c.defaultCity,
          countryAr: c.countryAr,
          cityAr: c.defaultCityAr,
          flag: c.flag,
        };
      }
    }
  }

  // 5. Host subdomain prefix check (e.g. dz.node.com, eg-01.server.net)
  if (cleanHost) {
    for (const c of KNOWN_COUNTRIES) {
      const subRegex = new RegExp(`^${c.code}[-._]`, 'i');
      if (subRegex.test(cleanHost)) {
        return {
          country: c.country,
          city: c.defaultCity,
          countryAr: c.countryAr,
          cityAr: c.defaultCityAr,
          flag: c.flag,
        };
      }
    }
  }

  // 6. Fallback: Return generic location without guessing, so real GeoIP can resolve it
  return {
    country: 'Global Node',
    city: 'Fast Direct Server',
    countryAr: 'خادم عالمي',
    cityAr: 'اتصال مباشر فائق السرعة',
    flag: '🌐',
  };
}

export function cleanLocationText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, '')
    .replace(/[🌐🚩🏳️🏴]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/:[0-9]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Universal format helper: extracts Country and City cleanly
export function formatServerLocation(
  server: Server,
  language: 'en' | 'ar' = 'ar'
): { country: string; city: string; flag: string } {
  // Check if server already has a resolved or valid country
  const hasValidCountry =
    server.country &&
    server.country !== 'Global Node' &&
    server.country !== 'خادم عالمي';

  const hasValidCountryAr =
    server.countryAr &&
    server.countryAr !== 'Global Node' &&
    server.countryAr !== 'خادم عالمي';

  if (hasValidCountry || hasValidCountryAr) {
    const rawCountry = server.country || server.countryAr || 'Global Node';
    const rawCountryAr = server.countryAr || translateCountryToArabic('', rawCountry);
    const country = language === 'ar' ? rawCountryAr : rawCountry;

    // City resolution
    const hasValidCity =
      server.city &&
      server.city !== 'Fast Direct Server' &&
      server.city !== 'اتصال مباشر فائق السرعة' &&
      server.city !== 'Global Node' &&
      server.city !== 'خادم عالمي';

    const hasValidCityAr =
      server.cityAr &&
      server.cityAr !== 'Fast Direct Server' &&
      server.cityAr !== 'اتصال مباشر فائق السرعة' &&
      server.cityAr !== 'Global Node' &&
      server.cityAr !== 'خادم عالمي';

    const rawCity = hasValidCity ? server.city : '';
    const rawCityAr = hasValidCityAr ? server.cityAr : (rawCity ? translateCityToArabic(rawCity) : '');

    let city = language === 'ar'
      ? (rawCityAr || rawCity || rawCountryAr)
      : (rawCity || rawCityAr || rawCountry);

    // Flag resolution
    let flag = server.flag && server.flag !== '🌐' ? server.flag : '';
    if (!flag) {
      flag = detectCountryAndFlag(rawCountry, '').flag;
    }

    return {
      country: cleanLocationText(country),
      city: cleanLocationText(city),
      flag: flag || '🌐',
    };
  }

  // If no stored country, try heuristic detection on server name and host
  const loc = detectCountryAndFlag(server.name || '', server.host || '');
  if (loc.country !== 'Global Node') {
    return {
      country: cleanLocationText(language === 'ar' ? loc.countryAr : loc.country),
      city: cleanLocationText(language === 'ar' ? loc.cityAr : loc.city),
      flag: loc.flag || '🌐',
    };
  }

  return {
    country: language === 'ar' ? 'خادم عالمي' : 'Global Node',
    city: language === 'ar' ? 'اتصال مباشر' : 'Fast Direct Server',
    flag: '🌐',
  };
}

// Generate random ID
export function generateId(): string {
  return 'srv_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Decode base64 safely (handles URL safe base64 as well)
export function safeBase64Decode(str: string): string {
  try {
    let clean = str.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (clean.length % 4 !== 0) {
      clean += '=';
    }
    return decodeURIComponent(
      atob(clean)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    try {
      return atob(str);
    } catch {
      return str;
    }
  }
}

// Parse single protocol URI
export function parseProxyUri(uri: string): Server | null {
  const trimmed = uri.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith('vless://')) {
      return parseVless(trimmed);
    }
    if (trimmed.startsWith('vmess://')) {
      return parseVmess(trimmed);
    }
    if (trimmed.startsWith('trojan://')) {
      return parseTrojan(trimmed);
    }
    if (trimmed.startsWith('ss://')) {
      return parseShadowsocks(trimmed);
    }
    if (trimmed.startsWith('hysteria2://') || trimmed.startsWith('hy2://')) {
      return parseHysteria2(trimmed);
    }
    if (trimmed.startsWith('socks5://') || trimmed.startsWith('socks://')) {
      return parseSocks(trimmed);
    }
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.includes('@') ||
      trimmed.split(':').length >= 2
    ) {
      const httpRes = parseHttp(trimmed);
      if (httpRes) return httpRes;
    }
  } catch (err) {
    console.error('Error parsing URI:', uri, err);
  }

  return null;
}

function parseVless(uri: string): Server | null {
  // vless://uuid@host:port?query#name
  const hashIdx = uri.indexOf('#');
  const name = hashIdx !== -1 ? decodeURIComponent(uri.substring(hashIdx + 1)) : 'VLESS Server';
  const cleanUri = hashIdx !== -1 ? uri.substring(0, hashIdx) : uri;
  
  const parsed = new URL(cleanUri);
  const uuid = parsed.username;
  const host = parsed.hostname;
  const port = parseInt(parsed.port || '443', 10);
  const params = parsed.searchParams;

  const security = (params.get('security') || 'none') as SecurityType;
  const network = (params.get('type') || 'tcp') as NetworkType;
  const sni = params.get('sni') || params.get('peer') || '';
  const pbk = params.get('pbk') || '';
  const sid = params.get('sid') || '';
  const spx = params.get('spx') || '';
  const path = params.get('path') || '';

  const { country, city, countryAr, cityAr, flag } = detectCountryAndFlag(name, host);
  const cleanName = `${country} - ${city}`;

  return {
    id: generateId(),
    name: cleanName,
    protocol: 'vless',
    host,
    port,
    uuid,
    security,
    network,
    sni,
    pbk,
    sid,
    spx,
    path,
    country,
    city,
    countryAr,
    cityAr,
    flag,
    ping: Math.floor(Math.random() * 45) + 35, // default initial ping
    rawUri: uri,
    createdAt: Date.now(),
  };
}

function parseVmess(uri: string): Server | null {
  // vmess://base64(json)
  const b64 = uri.substring(8);
  const jsonStr = safeBase64Decode(b64);
  const config = JSON.parse(jsonStr);

  const name = config.ps || 'VMess Server';
  const host = config.add || '127.0.0.1';
  const port = parseInt(config.port || '443', 10);
  const uuid = config.id || '';
  const network = (config.net || 'tcp') as NetworkType;
  const security = (config.tls === 'tls' ? 'tls' : 'none') as SecurityType;
  const sni = config.sni || config.host || '';
  const path = config.path || '';

  const { country, city, countryAr, cityAr, flag } = detectCountryAndFlag(name, host);
  const cleanName = `${country} - ${city}`;

  return {
    id: generateId(),
    name: cleanName,
    protocol: 'vmess',
    host,
    port,
    uuid,
    network,
    security,
    sni,
    path,
    country,
    city,
    countryAr,
    cityAr,
    flag,
    ping: Math.floor(Math.random() * 55) + 40,
    rawUri: uri,
    createdAt: Date.now(),
  };
}

function parseTrojan(uri: string): Server | null {
  // trojan://password@host:port?security=tls&sni=...#name
  const hashIdx = uri.indexOf('#');
  const name = hashIdx !== -1 ? decodeURIComponent(uri.substring(hashIdx + 1)) : 'Trojan Server';
  const cleanUri = hashIdx !== -1 ? uri.substring(0, hashIdx) : uri;
  
  const parsed = new URL(cleanUri);
  const password = parsed.username;
  const host = parsed.hostname;
  const port = parseInt(parsed.port || '443', 10);
  const params = parsed.searchParams;
  const sni = params.get('sni') || params.get('peer') || host;

  const { country, city, countryAr, cityAr, flag } = detectCountryAndFlag(name, host);
  const cleanName = `${country} - ${city}`;

  return {
    id: generateId(),
    name: cleanName,
    protocol: 'trojan',
    host,
    port,
    password,
    security: 'tls',
    network: (params.get('type') || 'tcp') as NetworkType,
    sni,
    country,
    city,
    countryAr,
    cityAr,
    flag,
    ping: Math.floor(Math.random() * 50) + 30,
    rawUri: uri,
    createdAt: Date.now(),
  };
}

function parseShadowsocks(uri: string): Server | null {
  // ss://base64@host:port#name or ss://base64#name
  const hashIdx = uri.indexOf('#');
  const name = hashIdx !== -1 ? decodeURIComponent(uri.substring(hashIdx + 1)) : 'Shadowsocks Server';
  const body = hashIdx !== -1 ? uri.substring(5, hashIdx) : uri.substring(5);

  let host = '';
  let port = 8388;
  let password = '';

  if (body.includes('@')) {
    const [auth, serverPart] = body.split('@');
    const [h, p] = serverPart.split(':');
    host = h;
    port = parseInt(p || '8388', 10);
    const decodedAuth = safeBase64Decode(auth);
    password = decodedAuth;
  } else {
    const decoded = safeBase64Decode(body);
    if (decoded.includes('@')) {
      const [auth, serverPart] = decoded.split('@');
      const [h, p] = serverPart.split(':');
      host = h;
      port = parseInt(p || '8388', 10);
      password = auth;
    }
  }

  const { country, city, countryAr, cityAr, flag } = detectCountryAndFlag(name, host);
  const cleanName = `${country} - ${city}`;

  return {
    id: generateId(),
    name: cleanName,
    protocol: 'ss',
    host: host || '127.0.0.1',
    port,
    password,
    country,
    city,
    countryAr,
    cityAr,
    flag,
    ping: Math.floor(Math.random() * 60) + 40,
    rawUri: uri,
    createdAt: Date.now(),
  };
}

function parseHysteria2(uri: string): Server | null {
  // hysteria2://password@host:port?sni=...#name
  const prefix = uri.startsWith('hysteria2://') ? 'hysteria2://' : 'hy2://';
  const hashIdx = uri.indexOf('#');
  const name = hashIdx !== -1 ? decodeURIComponent(uri.substring(hashIdx + 1)) : 'Hysteria 2 Server';
  const cleanUri = 'http://' + (hashIdx !== -1 ? uri.substring(prefix.length, hashIdx) : uri.substring(prefix.length));

  const parsed = new URL(cleanUri);
  const password = parsed.username;
  const host = parsed.hostname;
  const port = parseInt(parsed.port || '443', 10);
  const sni = parsed.searchParams.get('sni') || host;

  const { country, city, countryAr, cityAr, flag } = detectCountryAndFlag(name, host);
  const cleanName = `${country} - ${city}`;

  return {
    id: generateId(),
    name: cleanName,
    protocol: 'hysteria2',
    host,
    port,
    password,
    security: 'tls',
    sni,
    country,
    city,
    countryAr,
    cityAr,
    flag,
    ping: Math.floor(Math.random() * 30) + 20, // Hysteria is usually ultra-fast
    rawUri: uri,
    createdAt: Date.now(),
  };
}

function parseSocks(uri: string): Server | null {
  const hashIdx = uri.indexOf('#');
  let name = hashIdx !== -1 ? decodeURIComponent(uri.substring(hashIdx + 1)) : '';
  const cleanUri = hashIdx !== -1 ? uri.substring(0, hashIdx) : uri;

  let host = '';
  let port = 1080;
  let username = '';
  let password = '';

  const withoutScheme = cleanUri.replace(/^socks5?:\/\//i, '');
  if (withoutScheme.includes('@')) {
    const [auth, serverPart] = withoutScheme.split('@');
    if (auth.includes(':')) {
      const [u, p] = auth.split(':');
      username = decodeURIComponent(u || '');
      password = decodeURIComponent(p || '');
    } else {
      username = decodeURIComponent(auth);
    }
    const [h, pt] = serverPart.split(':');
    host = h;
    port = parseInt(pt || '1080', 10);
  } else if (withoutScheme.split(':').length === 4) {
    const parts = withoutScheme.split(':');
    if (!isNaN(parseInt(parts[1], 10))) {
      host = parts[0];
      port = parseInt(parts[1], 10);
      username = parts[2];
      password = parts[3];
    } else {
      username = parts[0];
      password = parts[1];
      host = parts[2];
      port = parseInt(parts[3], 10);
    }
  } else if (withoutScheme.includes(':')) {
    const parts = withoutScheme.split(':');
    host = parts[0];
    port = parseInt(parts[1], 10);
  }

  if (!host || isNaN(port)) return null;

  const loc = detectCountryAndFlag(name, host);
  const cleanName = loc.country !== 'Global Node' ? `${loc.country} - ${loc.city}` : (name || 'Global Node - Fast Direct Server');

  return {
    id: generateId(),
    name: cleanName,
    protocol: 'socks5',
    host,
    port,
    username,
    uuid: username,
    password,
    country: loc.country,
    city: loc.city,
    countryAr: loc.countryAr,
    cityAr: loc.cityAr,
    flag: loc.flag,
    ping: 36,
    rawUri: uri,
    createdAt: Date.now(),
  };
}

function parseHttp(uri: string): Server | null {
  let urlStr = uri;
  let name = '';

  const hashIdx = uri.indexOf('#');
  if (hashIdx !== -1) {
    name = decodeURIComponent(uri.substring(hashIdx + 1));
    urlStr = uri.substring(0, hashIdx);
  }

  let host = '';
  let port = 8080;
  let username = '';
  let password = '';

  if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
    try {
      const parsed = new URL(urlStr);
      host = parsed.hostname;
      port = parseInt(parsed.port || (urlStr.startsWith('https://') ? '443' : '80'), 10);
      username = decodeURIComponent(parsed.username || '');
      password = decodeURIComponent(parsed.password || '');
    } catch {
      return null;
    }
  } else if (urlStr.includes('@')) {
    // user:pass@host:port
    const [auth, serverPart] = urlStr.split('@');
    if (auth && serverPart) {
      const [u, p] = auth.split(':');
      const [h, pt] = serverPart.split(':');
      username = decodeURIComponent(u || '');
      password = decodeURIComponent(p || '');
      host = h || '';
      port = parseInt(pt || '80', 10);
    }
  } else if (urlStr.split(':').length === 4) {
    const parts = urlStr.split(':');
    // Check if host:port:user:pass OR user:pass:host:port
    if (!isNaN(parseInt(parts[1], 10)) && isNaN(parseInt(parts[3], 10))) {
      host = parts[0];
      port = parseInt(parts[1], 10);
      username = parts[2];
      password = parts[3];
    } else if (isNaN(parseInt(parts[1], 10)) && !isNaN(parseInt(parts[3], 10))) {
      username = parts[0];
      password = parts[1];
      host = parts[2];
      port = parseInt(parts[3], 10);
    } else {
      host = parts[0];
      port = parseInt(parts[1], 10);
      username = parts[2];
      password = parts[3];
    }
  } else if (urlStr.includes(':')) {
    const parts = urlStr.split(':');
    if (parts.length === 2 && !isNaN(parseInt(parts[1], 10))) {
      host = parts[0];
      port = parseInt(parts[1], 10);
    }
  }

  if (!host || isNaN(port)) return null;

  const loc = detectCountryAndFlag(name, host);
  const cleanName = loc.country !== 'Global Node' ? `${loc.country} - ${loc.city}` : (name || 'Global Node - Fast Direct Server');

  return {
    id: generateId(),
    name: cleanName,
    protocol: 'http',
    host,
    port,
    username,
    uuid: username,
    password,
    country: loc.country,
    city: loc.city,
    countryAr: loc.countryAr,
    cityAr: loc.cityAr,
    flag: loc.flag,
    ping: 48,
    rawUri: uri.startsWith('http') ? uri : `http://${uri}`,
    createdAt: Date.now(),
  };
}

// Bulk parse text from clipboard, TV sync, or subscription response
export function parseBulkText(text: string): Server[] {
  if (!text) return [];
  const trimmed = text.trim();

  // 1. Try parsing structured JSON (e.g. from TV Sync sender)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      let list: any[] | null = null;
      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (parsed && Array.isArray(parsed.servers)) {
        list = parsed.servers;
      } else if (parsed && typeof parsed.content === 'string') {
        return parseBulkText(parsed.content);
      } else if (parsed && typeof parsed.text === 'string') {
        return parseBulkText(parsed.text);
      }

      if (list && list.length > 0 && (list[0].host || list[0].protocol || list[0].name)) {
        return list.map(item => {
          const hasCountry = item.country && item.country !== 'Global Node' && item.countryAr !== 'خادم عالمي';
          const hasCity = item.city && item.city !== 'Fast Direct Server' && item.cityAr !== 'اتصال مباشر فائق السرعة';

          let country = hasCountry ? item.country : '';
          let city = hasCity ? item.city : '';
          let countryAr = item.countryAr || '';
          let cityAr = item.cityAr || '';
          let flag = item.flag && item.flag !== '🌐' ? item.flag : '';

          if (!country || !city) {
            const loc = detectCountryAndFlag(item.name || '', item.host || '');
            if (!country && loc.country !== 'Global Node') {
              country = loc.country;
              countryAr = loc.countryAr;
            }
            if (!city && loc.city !== 'Fast Direct Server') {
              city = loc.city;
              cityAr = loc.cityAr;
            }
            if (!flag && loc.flag !== '🌐') {
              flag = loc.flag;
            }
          }

          country = country || 'Global Node';
          city = city || 'Fast Direct Server';
          countryAr = countryAr || (country === 'Global Node' ? 'خادم عالمي' : country);
          cityAr = cityAr || (city === 'Fast Direct Server' ? 'اتصال مباشر فائق السرعة' : city);
          flag = flag || '🌐';

          const cleanName = country !== 'Global Node' ? `${country} - ${city}` : (item.name || 'Global Node - Fast Direct Server');

          return {
            ...item,
            id: item.id || generateId(),
            name: cleanName,
            protocol: item.protocol || 'http',
            host: item.host || '',
            port: item.port ? parseInt(String(item.port), 10) : 8080,
            username: item.username || item.uuid || '',
            uuid: item.uuid || item.username || '',
            password: item.password || '',
            country,
            city,
            countryAr,
            cityAr,
            flag,
            ping: item.ping || 48,
            rawUri: item.rawUri || '',
            createdAt: item.createdAt || Date.now(),
          } as Server;
        });
      }
    } catch (ignored) {}
  }

  // 2. Check if entire text is a base64 encoded subscription
  if (!trimmed.includes('://') && trimmed.length > 20) {
    const decoded = safeBase64Decode(trimmed);
    if (decoded.includes('://')) {
      return parseBulkText(decoded);
    }
  }

  // 3. Fallback: line-by-line URI parsing
  const lines = text.split(/[\r\n]+/);
  const results: Server[] = [];

  for (const line of lines) {
    const srv = parseProxyUri(line);
    if (srv) {
      results.push(srv);
    }
  }

  return results;
}

// Export servers to newline-separated proxy URIs or text with exact location metadata
export function exportServersToText(servers: Server[]): string {
  return servers
    .map((s) => {
      const locLabel = s.country && s.city ? `${s.country} - ${s.city}` : s.name;
      const cleanLabel = encodeURIComponent(locLabel || 'Proxy');

      if (s.rawUri && s.rawUri.trim()) {
        const base = s.rawUri.trim().split('#')[0];
        return `${base}#${cleanLabel}`;
      }
      if (s.protocol === 'http') {
        const auth =
          (s.username || s.password)
            ? `${encodeURIComponent(s.username || '')}:${encodeURIComponent(s.password || '')}@`
            : '';
        return `http://${auth}${s.host}:${s.port}#${cleanLabel}`;
      }
      if (s.protocol === 'socks5') {
        const auth =
          (s.username || s.password)
            ? `${encodeURIComponent(s.username || '')}:${encodeURIComponent(s.password || '')}@`
            : '';
        return `socks5://${auth}${s.host}:${s.port}#${cleanLabel}`;
      }
      return `${s.host}:${s.port}#${cleanLabel}`;
    })
    .filter(Boolean)
    .join('\n');
}
