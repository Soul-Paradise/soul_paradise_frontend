import type { MetadataRoute } from 'next';
import { IS_STAGING } from '@/lib/app-env';

/** /robots.txt: the staging copy is closed to all crawlers; production is open. */
export default function robots(): MetadataRoute.Robots {
  if (IS_STAGING) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return { rules: { userAgent: '*', allow: '/' } };
}
