import { type InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, className = '', id: providedId, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = providedId ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-stone-900"
      >
        {label}
        {required && <span className="ml-0.5 text-red-700">*</span>}
      </label>
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={[
          'min-h-[44px] w-full rounded-md border px-3 py-2',
          'text-[16px] text-stone-900 placeholder:text-stone-400',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700',
          error
            ? 'border-red-600 focus:ring-red-600 focus:border-red-600'
            : 'border-stone-300',
        ].join(' ')}
        {...rest}
      />
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
});
