import { type SelectHTMLAttributes, forwardRef, useId } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  options: SelectOption[];
  hint?: string;
  error?: string;
  id?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, options, hint, error, required, className = '', id: providedId, ...rest },
    ref,
  ) {
    const generatedId = useId();
    const selectId = providedId ?? generatedId;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    const describedBy =
      [hintId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-stone-900"
        >
          {label}
          {required && <span className="ml-0.5 text-red-700">*</span>}
        </label>
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={[
            'min-h-[44px] w-full rounded-md border bg-white px-3 py-2',
            'text-[16px] text-stone-900',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700',
            error
              ? 'border-red-600 focus:ring-red-600 focus:border-red-600'
              : 'border-stone-300',
          ].join(' ')}
          {...rest}
        >
          <option value="">Select&hellip;</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error && (
          <p id={hintId} className="text-xs text-stone-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-red-700" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
