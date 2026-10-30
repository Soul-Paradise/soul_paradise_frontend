import type { Metadata } from 'next';
import { HallOfFameView } from '@/components/HallOfFame/HallOfFameView';
import { getSiteContent, heroMetadata } from '@/lib/site-content';

// Copy, gallery photos (Site Content → Media) and section visibility come from the admin panel.
export async function generateMetadata(): Promise<Metadata> {
  const { sections, gallery } = await getSiteContent('hall_of_fame');
  const meta = heroMetadata(sections.hero, 'hall_of_fame');
  const shareImage = gallery?.[0];
  return {
    ...meta,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      ...(shareImage ? { images: [{ url: shareImage.url, width: 1200, height: 630, alt: shareImage.title }] } : {}),
    },
  };
}

export default async function HallOfFamePage() {
  const content = await getSiteContent('hall_of_fame');
  return <HallOfFameView content={content} />;
}
