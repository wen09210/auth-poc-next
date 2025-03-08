import { updateSession } from "./lib";
import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from './lib'
import { cookies } from 'next/headers'

// 1. 指定受保護與公開的路由
const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/login', '/signup', '/'];

export default async function middleware(req: NextRequest) {
  await updateSession(req);

  // 2. 獲取當前請求的路徑
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route)); // 修正匹配方式
  const isPublicRoute = publicRoutes.includes(path);

  // 3. 取得 `session` Cookie，這裡 **不能用 `await`**
  const cookie = cookies().get('session')?.value;
  if (!cookie) {
    console.log('沒有 session，導向登入頁');
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
    return NextResponse.next();
  }

  // 4. 解密 Session
  const session = await decrypt(cookie);

  // 5. 未登入的用戶訪問受保護路由 -> 轉到 `/login`
  if (isProtectedRoute && !session?.userId) {
    console.log('未登入，導向登入頁');
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 6. 已登入的用戶訪問公共路由 -> 轉到 `/dashboard`
  if (isPublicRoute && session?.userId) {
    console.log('已登入，導向 Dashboard');
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware 應該作用的範圍
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
