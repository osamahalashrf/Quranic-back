// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({ locales: ['en','ar'], defaultLocale: 'en' });

export default async function middleware(request: NextRequest) {
  // مثال: حماية مسارات الـ /admin بالتحقق من كوكي أو هيدر
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      // إعادة توجيه للصفحة المناسبة (مع إضافة اللغة إن لزم)
      const url = new URL(`/en/login`, request.url); // أو استخدم اكتشاف اللغة
      return NextResponse.redirect(url);
    }
    // لا تقم بعمليات DB ثقيلة في Middleware — تجنب عمليات blocking.
  }

  // وفي النهاية استدعِ middleware الخاص بالـ intl ليكمل التوجيه/الوضعية
  return intlMiddleware(request);
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
