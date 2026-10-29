import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export const metadata = {
  title: 'APK Hunter Grid — Discord Prospect Intelligence Platform',
  description: 'Discord community discovery, lead scoring, and outreach management for streaming infrastructure and app rebranding.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen w-screen overflow-hidden bg-[#080c14] text-slate-100">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-[#080c14] p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
