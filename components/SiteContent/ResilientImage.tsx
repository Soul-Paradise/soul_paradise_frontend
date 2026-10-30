'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

/**
 * next/image for CMS photos that never sticks on a broken tile: if the
 * optimised version fails (e.g. the optimiser times out fetching a large
 * original from the bucket), it retries once with the original file.
 */
export function ResilientImage({ alt, unoptimized, onError, ...props }: ImageProps) {
  const [direct, setDirect] = useState(false);
  return (
    <Image
      {...props}
      alt={alt}
      unoptimized={unoptimized || direct}
      onError={(e) => {
        if (!direct) setDirect(true);
        onError?.(e);
      }}
    />
  );
}
