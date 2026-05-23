'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Home, FilePlus, ListChecks, User, Bell,
} from 'lucide-react';
import { useBildirimStore } from '@/store';

const PUBLIC_ROUTES = ['/giris', '/giris/edevlet-callback', '/offline'];

const NAV_ITEMS = [
    { href: '/', label: 'Ana Sayfa', icon: Home },
    { href: '/talep', label: 'Yeni Talep', icon: FilePlus },
    { href: '/taleplerim', label: 'Taleplerim', icon: ListChecks },
    { href: '/profil', label: 'Profil', icon: User },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { okunmamisSayi } = useBildirimStore();

    const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

    if (isPublic) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col min-h-screen max-w-[430px] mx-auto bg-white shadow-sm">

            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#1a4f8a] text-white pt-safe">
                <div className="flex items-center justify-between px-4 h-14">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">B</span>
                        </div>
                        <span className="font-semibold text-[15px]">BelediyeApp</span>
                    </div>
                    <Link href="/bildirimler" className="relative p-1.5">
                        <Bell size={22} className="text-white" />
                        {okunmamisSayi > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500
                               text-white text-[10px] font-bold flex items-center justify-center">
                                {okunmamisSayi > 9 ? '9+' : okunmamisSayi}
                            </span>
                        )}
                    </Link>
                </div>
            </header>

            {/* İçerik */}
            <main className="flex-1 overflow-y-auto scroll-container pb-safe">
                <div className="page-enter">{children}</div>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]
                      bg-white border-t border-gray-100 nav-safe-bottom z-40">
                <div className="flex">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors
                  ${active ? 'text-[#1a4f8a]' : 'text-gray-400'}`}
                            >
                                <Icon
                                    size={22}
                                    className={active ? 'stroke-[#1a4f8a]' : 'stroke-gray-400'}
                                    strokeWidth={active ? 2.2 : 1.8}
                                />
                                <span className={`text-[10px] font-medium ${active ? 'text-[#1a4f8a]' : 'text-gray-400'}`}>
                                    {label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

        </div>
    );
}
