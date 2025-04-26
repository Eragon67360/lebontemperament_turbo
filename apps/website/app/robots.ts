import { MetadataRoute } from 'next'
const WEBSITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.lebontemperament.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/membres/*','/api/*','/copie-de-contact','/copie-de-nous-decouvrir','/videos','/copie-de-ete-2019-pub-concerts','/copie-de-contact-1','/nos-concerts','/calendrier','/questions-pratiques','/telechargements','/#!nos-concerts/nk142','/?_escaped_fragment_=pub-concerts/xhijg','/_frog','/travail','/#!pub-concerts/xhijg','/copie-de-travail-reserve-2','/copie-de-nous-decouvrir?lightbox=dataItem-ji4s7kkd7','/copie-de-nous-decouvrir?lightbox=dataItem-ji4s7kkg7','/copie-de-nous-decouvrir?*'],
    },
    sitemap: `${WEBSITE_URL}/sitemap.xml`,
  }
}