import Link from 'next/link';

export default function Logo() {
  return (
    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 lg:top-6 lg:left-6 z-20">
      <Link href="/" className="block transition-transform duration-200 hover:scale-105 active:scale-95">
        <img
          src="/logo.png"
          alt="Soul Paradise"
          className="h-10 sm:h-12 md:h-14 w-auto cursor-pointer"
        />
      </Link>
    </div>
  );
}
