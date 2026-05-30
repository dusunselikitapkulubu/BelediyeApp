'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Home, FilePlus, ListChecks, User, Bell, Megaphone,
} from 'lucide-react';
import { useBildirimStore } from '@/store';

const PUBLIC_ROUTES = ['/giris', '/giris/edevlet-callback', '/offline'];

const NAV_ITEMS = [
    { href: '/', label: 'Ana Sayfa', icon: Home },
    { href: '/talep', label: 'Yeni Talep', icon: FilePlus },
    { href: '/sikayetler', label: 'Şikayetler', icon: Megaphone },
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
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 text-slate-800 pt-safe">
                <div className="flex items-center justify-between px-4 h-14">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                            <span className="text-white font-black text-sm">B</span>
                        </div>
                        <span className="font-extrabold text-[15px] bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            BelediyeApp
                        </span>
                    </div>
                    <Link href="/bildirimler" className="relative p-1.5 hover:bg-slate-50 rounded-xl transition-all duration-200">
                        <Bell size={20} className="text-slate-600" />
                        {okunmamisSayi > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500
                               text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
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
                      bg-white/95 backdrop-blur-md border-t border-slate-100/80 nav-safe-bottom z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.03)]">
                <div className="flex px-2 py-1">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all duration-300 relative
                                  ${active ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>
                                    <Icon
                                        size={20}
                                        className={active ? 'stroke-blue-600' : 'stroke-slate-400'}
                                        strokeWidth={active ? 2.2 : 1.8}
                                    />
                                </div>
                                <span className={`text-[9px] font-semibold tracking-wide transition-colors ${active ? 'text-blue-700' : 'text-slate-400'}`}>
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
