/** Eyebrow + title + optional subtitle, used to open each page section. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  tone = 'light',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  /** `dark` for sections on a dark background. */
  tone?: 'light' | 'dark';
}) {
  const center = align === 'center';
  const dark = tone === 'dark';
  return (
    <div className={`mb-10 ${center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}>
      {eyebrow && (
        <p
          className={`text-xs font-bold uppercase tracking-[0.18em] ${dark ? 'text-sky-300' : 'text-(--color-links)'}`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl ${dark ? 'text-white' : 'text-(--color-foreground)'}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 text-base leading-relaxed ${dark ? 'text-white/75' : 'text-(--color-inactive)'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
