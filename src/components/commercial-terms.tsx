'use client';

interface CommercialTermsProps {
  terms: Record<string, unknown>;
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
  error?: string;
}

export function CommercialTerms({
  terms,
  accepted,
  onAcceptChange,
  error,
}: CommercialTermsProps) {
  const entries = Object.entries(terms);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Inline numbered terms box — dark bg, grey text, white strong text */}
      <div className="bg-[var(--md-dark)] border border-[#444] p-5 mb-6 text-[13px] leading-[1.8] text-[var(--md-grey)]">
        <p className="mb-4">
          <strong className="text-[var(--text-inverse)]">
            By submitting this tender, you acknowledge and accept the following terms:
          </strong>
        </p>
        {entries.map(([key, value], idx) => (
          <p key={key} className="mb-1">
            <strong className="text-[var(--text-inverse)]">{idx + 1}.</strong>{' '}
            <strong className="text-[var(--text-inverse)]">
              {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </strong>
            {' — '}
            {String(value)}
          </p>
        ))}
      </div>

      {/* Acceptance checkbox */}
      <div className="flex items-center gap-2 py-3">
        <input
          type="checkbox"
          id="terms_accepted"
          checked={accepted}
          onChange={(e) => onAcceptChange(e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        <label htmlFor="terms_accepted" className="text-sm text-[var(--text-inverse)] cursor-pointer select-none">
          I have read and accept all commercial terms above{' '}
          <span className="text-[var(--accent)]">*</span>
        </label>
      </div>
      {error && (
        <p className="text-xs text-[var(--md-red)] mt-1">{error}</p>
      )}
    </div>
  );
}
