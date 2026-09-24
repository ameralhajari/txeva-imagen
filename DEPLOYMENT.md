# دليل نشر TXEVA Imagen على Cloudflare Pages و Turso

## 1. ما رأيك في استخدام Cloudflare Pages + Turso؟
هذا المزيج هو **أفضل وأحدث معمارية سحابية حالياً (Modern Serverless Edge Architecture)** للأسباب التالية:
- **سرعة استجابة فائقة (Zero Cold Starts):** تعمل Cloudflare Pages و Pages Functions على شبكة V8 Edge العالمية، وتعمل Turso كـ Edge SQLite موزعة ومتزامنة مع أقرب خادم للمستخدم.
- **تكلفة مجانية تماماً (0$ Free Tier):**
  - Cloudflare Pages: استضافة مجانية غير محدودة + 100,000 استدعاء دالة Edge Functions يومياً.
  - Turso Database: باقة مجانية تتيح حتى 500 قاعدة بيانات و 9GB تخزين وملايين القراءات.
- **أمان مفاتيح الـ API:** يتم إخفاء مفتاح `OPENAI_API_KEY` داخل وظائف Cloudflare Pages في الخلفية دون كشفه للمستخدمين في المتصفح.

---

## 2. دعم الموديلات وحاسبة الأسعار (كم صورة لكل 1 دولار)

### توضيح الفرق بين موديلات GPT وموديلات توليد الصور:
- **موديلات توليد الصور المباشرة من OpenAI:** هي `DALL·E 3` و `DALL·E 2`، وهي الموديلات المدعومة رسمياً لإنشاء ملفات الصور من الأوامر النصية.
- **موديلات GPT (مثل GPT-4o و GPT-4o-mini):** هي نماذج لغوية (LLM) لا تُنشئ ملفات بكسل للصور مباشرة بل تملك إمكانية قراءة الصور وصياغة وتوسيع الأوامر (Prompt Optimization).
- **موديلات خارجية:** يتيح التطبيق عبر **Custom API Endpoint** ربط أي مزود متوافق مع OpenAI API مثل Flux أو Stable Diffusion أو Midjourney Proxy.

### جدول الأسعار الرسمي وكمية الصور لكل 1 دولار:
| الموديل والجودة | المقاس | السعر للصورة | كم صورة لكل 1 دولار |
|---|---|---|---|
| **DALL·E 3 Standard** | 1024×1024 (مربع 1:1) | $0.040 | **25 صورة** |
| **DALL·E 3 Standard** | 1792×1024 (عرضي 16:9) | $0.080 | **12.5 صورة** |
| **DALL·E 3 Standard** | 1024×1792 (طولي 9:16) | $0.080 | **12.5 صورة** |
| **DALL·E 3 HD (فائقة)** | 1024×1024 (مربع 1:1) | $0.080 | **12.5 صورة** |
| **DALL·E 3 HD (فائقة)** | 1792×1024 أو 1024×1792 | $0.120 | **8.3 صور** |
| **DALL·E 2** | 1024×1024 | $0.020 | **50 صورة** |
| **DALL·E 2** | 512×512 | $0.018 | **55 صورة** |
| **DALL·E 2** | 256×256 | $0.016 | **62.5 صورة** |

---

## 3. خطوات تجهيز قاعدة بيانات Turso

1. قم بتثبيت أداة Turso CLI أو سجل الدخول على [Turso.tech](https://turso.tech/):
```bash
# تثبيت turso على الويندوز أو ماك
curl -sSfL https://get.tur.so/install.sh | bash
# أو عبر scoop في ويندوز
scoop install turso
```

2. أنشئ قاعدة بيانات جديدة:
```bash
turso db create txeva-imagen-db
```

3. احصل على رابط الاتصال:
```bash
turso db show txeva-imagen-db --url
# سيعطيك رابطاً مثل: libsql://txeva-imagen-db-youruser.turso.io
```

4. أنشئ رمز المصادقة (Auth Token):
```bash
turso db tokens create txeva-imagen-db
```

5. (اختياري) تنفيذ مخطط الجداول `schema.sql`:
```bash
turso db shell txeva-imagen-db < schema.sql
```
*(ملاحظة: النظام مهيأ أيضاً لإنشاء الجداول تلقائياً عند أول استدعاء)*

---

## 4. خطوات النشر على Cloudflare Pages

1. ارفع المشروع إلى حسابك على GitHub أو GitLab.
2. ادخل إلى [Cloudflare Dashboard](https://dash.cloudflare.com/) ثم:
   - اذهب إلى **Compute (Workers) > Workers & Pages > Create application > Pages > Connect to Git**.
   - اختر مستودع المشروع.
3. اضبط إعدادات البناء (Build Settings):
   - **Framework Preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. في قسم **Environment variables** أضف المتغيرات التالية:
   - `OPENAI_API_KEY`: مفتاح OpenAI الخاص بك (مثال: `sk-proj-...`).
   - `TURSO_DATABASE_URL`: رابط Turso (مثال: `libsql://...turso.io`).
   - `TURSO_AUTH_TOKEN`: رمز Turso السري.
   - `AUTH_USERNAME`: اسم المستخدم الخاص بفريقك لتسجيل الدخول.
   - `AUTH_PASSWORD`: كلمة المرور الخاصة بفريقك لتسجيل الدخول.
5. اضغط **Save and Deploy**.

---

## 5. التشغيل والتجربة محلياً

```bash
# تثبيت الحزم
npm install

# تشغيل واجهة التطوير
npm run dev

# أو تشغيل محاكي Cloudflare Pages Functions مع الـ API محلياً
npm run build
npx wrangler pages dev dist
```
