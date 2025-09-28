// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_LOCALES = ['en', 'ar'];
const DEFAULT_LOCALE = 'ar';
const BACKEND_URL = process.env.BACKEND_URL || 'https://your-backend.example.com';

// ---- تجزئة قواعد الحماية ----
// ضع هنا المسارات التي تتطلب تسجيل دخول
const PROTECTED_ROUTES = [
  '/dashboard',
  '/admin',        // مثال — عدّل حسب مساراتك
  '/teachers',     // صفحة المدرسين — تتطلب صلاحية/تحقق
  '/supervisors'   // مثال
];

// مسارات خاصة بالـ admin فقط
const ADMIN_ONLY_ROUTES = [
  '/admin/supervisors',   // عند دخول المدرس هنا: forbidden (كما طلبت)
  '/admin/*'              // أو أي مسارات أخرى تود حصرها بالـ admin
];

// ---- end rules ----

// init next-intl middleware (يكتشف اللغة ويعيد توجيهات locale إذا احتاج)
const intlMiddleware = createMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE
});

function extractLocaleFromPathname(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return DEFAULT_LOCALE;
  const first = segments[0];
  return SUPPORTED_LOCALES.includes(first) ? first : DEFAULT_LOCALE;
}

/**
 * Helper: تحقق من مسار إن كان محمي (startsWith)
 */
function isProtectedPath(pathname: string) {
  // افحص كل مسار محمي إن كان الـ pathname يبدأ به
  return PROTECTED_ROUTES.some((p) => {
    // دعم wildcard البسيط: '/admin/*'
    if (p.endsWith('/*')) {
      const base = p.replace('/*', '');
      return pathname.startsWith(base);
    }
    return pathname === p || pathname.startsWith(p + '/');
  });
}

function isAdminOnly(pathname: string) {
  return ADMIN_ONLY_ROUTES.some((p) => {
    if (p.endsWith('/*')) {
      const base = p.replace('/*', '');
      return pathname.startsWith(base);
    }
    return pathname === p || pathname.startsWith(p + '/');
  });
}

export default async function middleware(request: NextRequest) {
  // 1. اجعل next-intl يدير اكتشاف اللغة/الـ redirects أولًا
  //    (سينتهي بـ redirect إذا احتاج)
  const intlResult = await intlMiddleware(request);
  // intlMiddleware قد يعيد response (redirect) — في هذه الحالة أعده فورًا
  if (intlResult) return intlResult;

  // 2. الآن تعامل مع المصادقة/الصلاحيات
  const url = request.nextUrl.clone();
  const pathname = url.pathname; // مثال: /ar/dashboard أو /en/admin/...
  const locale = extractLocaleFromPathname(pathname);

  // مسارات غير مُهتم بها: اسمح بمرورها (static, _next, api static assets)
  const ignored = [
    '/_next/',
    '/favicon.ico',
    '/api/public', // عدّل لو لديك api عامة
    '/public/'
  ];
  if (ignored.some(p => pathname.startsWith(p))) {
    return; // لا تدخل في فحص auth
  }

  // إذا الصفحة محمية — تأكد وجود توكن
  if (isProtectedPath(pathname)) {
    // ابحث عن التوكن في الكوكيز — عدّل اسم الكوكي هنا طبقًا لبرنامجك
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('token')?.value;

    if (!token) {
      // لم يسجل الدخول -> أعِد توجيه للصفحة login بالـ locale
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    // تحقق من التوكن عبر backend
    try {
      const verifyRes = await fetch(`${BACKEND_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        // no cache to ensure fresh check
        cache: 'no-store'
      });

      if (!verifyRes.ok) {
        // توكن غير صالح -> اعد توجيه للـ login
        const loginUrl = new URL(`/${locale}/login`, request.url);
        return NextResponse.redirect(loginUrl);
      }

      const data = await verifyRes.json();
      // نتوقع JSON مثل: { authenticated: true, role: 'admin' }
      const role = data?.role || data?.user?.role || null;

      // لو حاول الوصول لمسار admin-only والـ role ليس admin -> forbidden
      if (isAdminOnly(pathname) && role !== 'admin') {
        const forbiddenUrl = new URL(`/${locale}/forbidden`, request.url);
        return NextResponse.redirect(forbiddenUrl);
      }

      // إن كنت تريد تطبيق لوجيك أكثر دقة (مثل: مشرف يمكن رؤية بعض الروابط فقط)
      // ضع هنا قواعد إضافية حسب data.permissions أو data.roles

      // Allow the request to continue
      return;
    } catch {
      // لو فشل الاتصال بالـ backend -> فضل إعادة توجيه للـ login أو عرض error page
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // غير محمي -> دع intl يكمّل أي توجيه آخر
  return;
}

/**
 * config -> matcher : أي مسارات ستمر عبر هذه الـ middleware
 * ضعها لتشمل كل المسارات التي تريد حمايتها أو اكتشاف اللغة لها.
 */
export const config = {
  matcher: [
    /*
     * كل المسارات عدا static assets
     * عدّل هذا إذا أردت أن يعمل middleware على كل شيء
     */
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
};
