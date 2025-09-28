
// components/Layout.js

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-blue-700 text-xl font-bold">TECHNIK</Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <nav className="hidden sm:flex space-x-6 text-sm font-semibold">
            <Link href="/auto-rezerwacja" className="hover:text-purple-600 text-purple-700 font-bold">
              🤖 Auto-Rezerwacja
            </Link>
            <Link href="/rezerwacja" className="hover:text-blue-600">Umów wizytę</Link>
            <Link href="/kalendarz" className="hover:text-blue-600">Dostępność</Link>
            <Link href="/cennik" className="hover:text-green-600 text-green-700 font-medium">💰 Cennik</Link>
            <Link href="/mapa" className="hover:text-blue-600">Mapa</Link>
            <Link href="/admin" className="hover:text-blue-600">Admin</Link>
          </nav>
        </div>
        {menuOpen && (
          <nav className="sm:hidden bg-white px-6 pb-4 pt-2 flex flex-col space-y-2 text-sm font-medium border-t">
            <Link href="/auto-rezerwacja" onClick={() => setMenuOpen(false)} className="hover:text-purple-600 text-purple-700 font-bold">
              🤖 Auto-Rezerwacja
            </Link>
            <Link href="/rezerwacja" onClick={() => setMenuOpen(false)} className="hover:text-blue-600">Umów wizytę</Link>
            <Link href="/kalendarz" onClick={() => setMenuOpen(false)} className="hover:text-blue-600">Dostępność</Link>
            <Link href="/cennik" onClick={() => setMenuOpen(false)} className="hover:text-green-600 text-green-700 font-medium">💰 Cennik</Link>
            <Link href="/mapa" onClick={() => setMenuOpen(false)} className="hover:text-blue-600">Mapa</Link>
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="hover:text-blue-600">Admin</Link>
          </nav>
        )}
      </header>
      <main className="flex-grow">{children}</main>
      <footer className="text-center text-sm text-gray-400 py-6">© {new Date().getFullYear()} Technik</footer>
    </div>
  );
}
