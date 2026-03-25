import { useId } from 'react';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  required?: boolean;
  id?: string;
}

export function Checkbox({
  label,
  checked,
  onChange,
  error,
  required,
  id: providedId,
}: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = providedId ?? generatedId;
  const errorId = error ? `${checkboxId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-3">
        <div className="flex min-h-[24px] min-w-[24px] items-center justify-center pt-0.5">
          <input
            type="checkbox"
            id={checkboxId}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={[
              'h-[24px] w-[24px] rounded border cursor-pointer',
              'text-amber-700 accent-amber-700',
              'focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2',
              error ? 'border-red-600' : 'border-stone-300',
            ].join(' ')}
          />
        </div>
        <label
          htmlFor={checkboxId}
          className="cursor-pointer text-sm text-stone-900 leading-relaxed select-none"
        >
          {label}
          {required && <span className="ml-0.5 text-red-700">*</span>}
        </label>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-red-700 ml-[36px]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
