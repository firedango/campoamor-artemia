import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ARTEMIA · Portale Progetti',
  description: 'Portale operativo ARTEMIA Group per Campoamor e Villaggio Aurora.',
  openGraph: {
    title: 'ARTEMIA · Portale Progetti',
    description: 'Campoamor e Villaggio Aurora in un unico portale operativo.',
    type: 'website',
    images: ['https://firedango.github.io/campoamor-artemia/assets/images/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ARTEMIA · Portale Progetti',
    description: 'Campoamor e Villaggio Aurora in un unico portale operativo.',
    images: ['https://firedango.github.io/campoamor-artemia/assets/images/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it"><body>{children}</body></html>;
}
