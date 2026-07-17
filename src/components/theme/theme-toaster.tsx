'use client';

import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';

export function ThemeToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="bottom-center"
      toastOptions={{
        className: 'font-sans',
        style: {
          borderRadius: '12px',
        },
      }}
    />
  );
}
