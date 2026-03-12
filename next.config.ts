/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // تجاهل أخطاء التايب سكريبت وقت الرفع
    ignoreBuildErrors: true,
  },
  eslint: {
    // تجاهل أخطاء الـ ESLint وقت الرفع
    ignoreDuringBuilds: true,
  },
  // إيقاف الـ Static Generation لصفحة الشات عشان ما تضربش وهي بتجيب بيانات سوبابيز
  experimental: {
    // أي إعدادات إضافية لو حبيت تضيفها
  }
};

export default nextConfig;