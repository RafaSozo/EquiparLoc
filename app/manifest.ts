import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EquiparLoc | Locação de Máquinas e Ferramentas',
    short_name: 'EquiparLoc',
    description: 'Locação de máquinas pesadas e ferramentas para obras.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#101820',
    lang: 'pt-BR',
    icons: [
      { src: '/icon.png', sizes: '192x192', type: 'image/png' },
      { src: '/images/icone-equiparloc-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
