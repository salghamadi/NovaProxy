# NovaProxy (v4.2.5) 🛡️⚡

**NovaProxy** هو تطبيق بروكسي وVPN فائق السرعة والأداء مبني بتقنيات الويب الحديثة (React 19 + TypeScript + Vite + Tailwind CSS) مع دعم منصات متعددة تشمل **أندرويد (Android APK)** و**أجهزة سطح المكتب (Electron)**.

يحاكي التطبيق واجهة وتجربة **INCY** الشهيرة بدقة واحترافية متناهية مع دعم ثنائي كامل للغتين **العربية (RTL)** و**الإنجليزية (LTR)**.

---

## 🌟 أبرز المميزات (Key Features)

### 1. 🎨 واجهة وتصميم عصري متكامل (Modern UI / UX):
- **4 مظاهر ألوان كاملة:** الوضع الداكن (Dark)، الوضع الأخضر النيوني (Green)، الوضع الفاتح عالي التباين (Light)، والوضع الأسود الحالك (OLED).
- **قوائم منسدلة وعناصر تحكم مخصصة بالكامل:** خالية من أخطاء العرض ومتوافقة تماماً مع أندرويد والشاشات الكبيرة.
- **شاشات إعدادات كاملة ومستقلة:**
  - 📊 **إحصائيات استهلاك البيانات (Statistics):** شريط استهلاك ثنائي تفاعلي، عداد الوقت الكلي، رسم بياني أسبوعي، وعداد الاتصالات.
  - ⚡ **إعدادات الفحص السريع (Ping Settings):** بروتوكولات الفحص (Nova Ping, TCP, HTTP GET, HTTP HEAD)، أنماط عرض البينج، وقوائم الروابط المسبقة.
  - ⚙️ **إعدادات متقدمة (Advanced Settings):** تحكم رقمي بمهلة الخمول، والحد الأقصى لاتصالات TCP وUDP، وإدارة المسارات المستثناة (Excluded Routes).
  - 📜 **سجلات النفق (Tunnel Logs):** عارض كونسول طرفي داكن مع أرقام الأسطر والبحث السريع والنسخ والتصدير كملف `.log`.
  - 🔗 **روابط التشغيل السريع (URL Schemes):** دعم كامل للتحكم عن بعد والأتمتة الخارجية (`novaproxy://`).
  - 💾 **النسخ الاحتياطي (Backup & Restore):** تصدير واسترجاع الإعدادات والخوادم بصيغة JSON وبكود QR مباشر.
  - ℹ️ **حول التطبيق (About):** تفاصيل المحرك الأساسي (NovaCore)، معلومات العتاد ومعرف الجهاز (HWID).

### 2. 🚀 دعم البروتوكولات الحديثة وتجاوز الحجب (Protocols & DPI Circumvention):
- **VLESS** مع تقنية **Reality** وتجاوز الفحص العميق للحزم (XTLS Vision).
- **Hysteria 2 (hy2)** للأداء الأقصى عبر بروتوكول UDP / QUIC.
- **Trojan** بتشفير TLS قوي.
- **VMess** عبر WebSocket و gRPC و TCP.
- **Shadowsocks (SS)**.
- **SOCKS5 / HTTP Proxy**.
- دعم استيراد الروابط الفردية والاشتراكات المجمعة والنصوص المشفرة Base64.

### 3. 🌐 مزامنة التلفزيون والجوال (TV & Mobile Proxy Sync):
- تبادل الخوادم والاشتراكات بين شاشات التلفزيون الذكية (Android TV) والهواتف الذكية بنقرة واحدة عبر كود QR أو الاتصال المحلي.

### 4. 🔀 نفق التطبيقات المحددة (Per-App Proxy):
- اختيار تطبيقات محددة لتمرير بياناتها عبر البروكسي (Proxy Only) أو استثنائها (Bypass).

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Mobile Runtime:** Capacitor 6 / Android SDK 34 (Java 21)
- **Desktop Runtime:** Electron 34
- **Core Engine:** NovaCore (Xray-Core / Sing-box architecture)

---

## 🚀 طريقة التثبيت والتشغيل (Getting Started)

### 1. تثبيت الاعتماديات:
```bash
npm install
```

### 2. التشغيل في وضع التطوير (Web Dev Mode):
```bash
npm run dev
```
افتح المتصفح على: `http://localhost:5173`

### 3. تشغيل كبرنامج سطح مكتب (Desktop App):
```bash
npm start
```
أو بالضغط المزدوج على ملف:
```cmd
start.bat
```

### 4. بناء ملفات الإنتاج (Production Build):
```bash
npm run build
```

### 5. بناء تطبيق أندرويد (Android APK):
```bash
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleRelease
```
ستجد ملف الـ APK الجاهز والموقع باسم: `NovaProxy.apk`

---

## 📁 هيكلية المشروع (Repository Structure)

```text
NovaProxy/
├── android/            # مشروع أندرويد الأصلي (Capacitor Android Project)
├── dist/               # مخرجات بناء الواجهة (Vite Output)
├── electron/           # ملفات تشغيل سطح المكتب (Main & Preload scripts)
├── public/             # الأيقونات والملفات الثابتة والشعارات
├── scripts/            # سكربتات مساعدة للبناء وتوليد الأصول
├── src/
│   ├── components/     # واجهات التطبيق الرئيسية والنوافذ المنبثقة
│   │   ├── settings/   # شاشات الإعدادات الفرعية والمظاهر
│   │   ├── HomeView.tsx
│   │   ├── ServersView.tsx
│   │   ├── SettingsView.tsx
│   │   ├── AddServerModal.tsx
│   │   └── TvSyncModal.tsx
│   ├── services/       # دوال الاتصال ومحلل البروتوكولات والترجمة والتخزين
│   ├── types/          # تعريفات الأنواع (TypeScript Interfaces)
│   ├── App.tsx         # المكون الجذري
│   └── index.css       # تنسيقات Tailwind ومحاذاة المظاهر
├── package.json        # معلومات الحزمة والاعتماديات
├── README.md           # دليل وتوثيق المشروع
└── NovaProxy.apk       # حزمة الأندرويد المجمعة والموقعة
```

---

## 📄 الترخيص (License)
هذا المشروع مرخص تحت رخصة **MIT**.
