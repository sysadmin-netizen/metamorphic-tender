'use client';

import { useState, useEffect } from 'react';

interface CommercialTermsProps {
  terms: Record<string, unknown>;
}

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    setDesktop(mq.matches);

    function handleChange(e: MediaQueryListEvent) {
      setDesktop(e.matches);
    }

    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  return desktop;
}

export function CommercialTerms({ terms }: CommercialTermsProps) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);

  // On desktop, default to expanded; on mobile, collapsed
  useEffect(() => {
    setOpen(isDesktop);
  }, [isDesktop]);

  const entries = Object.entries(terms);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-[44px] w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-stone-900">
          Commercial Terms
        </span>
        <svg
          className={[
            'h-5 w-5 text-stone-500 transition-transform duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-stone-200 px-4 py-3">
          <dl className="flex flex-col gap-2">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex flex-col gap-0.5 sm:flex-row sm:gap-4 py-2 border-b border-stone-100 last:border-0"
              >
                <dt className="text-sm font-medium text-stone-500 sm:w-1/3 sm:flex-shrink-0">
                  {key}
                </dt>
                {/* EC-24: XSS prevention via String() cast */}
                <dd className="text-sm text-stone-900 sm:w-2/3">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
