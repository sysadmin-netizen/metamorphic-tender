import { type TextareaHTMLAttributes, forwardRef, useId } from 'react';

interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      hint,
      error,
      required,
      className = '',
      id: providedId,
      rows = 4,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const textareaId = providedId ?? generatedId;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;
    const describedBy =
      [hintId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <label
          htmlFor={textareaId}
          className="text-sm font-medium text-stone-900"
        >
          {label}
          {required && <span className="ml-0.5 text-red-700">*</span>}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={[
            'w-full rounded-md border px-3 py-2',
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
  },
);
