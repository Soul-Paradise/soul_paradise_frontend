import { HomeView } from '@/components/Home/HomeView';
import { getSiteContent } from '@/lib/site-content';

// Copy, photos and section visibility come from the admin panel (Site Content → Home).
export default async function Home() {
  const content = await getSiteContent('home');
  return <HomeView content={content} />;
}
