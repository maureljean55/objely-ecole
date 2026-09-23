"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type Ref, type TextareaHTMLAttributes } from "react";
import { Icon } from "../kiosk/Icon";

const CONTROL =
  "w-full rounded-field border-[1.5px] text-body-xl text-ink outline-none transition-[background-color,border-color,box-shadow] placeholder:text-slate/70";

// Focus halo is blue, or red while the field is invalid so the error never disappears under the cursor.
function tone(error?: string) {
  return error
    ? "border-danger bg-danger-tint focus:shadow-[0_0_0_4px_rgba(239,68,68,0.2)]"
    : "border-line bg-canvas focus:bg-white focus:border-blue focus:shadow-[0_0_0_4px_rgba(8,123,234,0.18)]";
}

type FieldShellProps = {
  id: string;
  label: string;
  required?: boolean;
  aside?: ReactNode;
  error?: string;
  /** Neutral line under the control (helper or "Valide"). */
  note?: ReactNode;
  children: ReactNode;
};

export function FieldShell({ id, label, required, aside, error, note, children }: FieldShellProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center justify-between gap-3 text-label-md text-ink">
        <span>
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-danger-ink">
              *
            </span>
          )}
        </span>
        {aside && <span className="text-label-sm font-medium text-slate">{aside}</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-note`} role="alert" className="flex items-center gap-1 text-label-sm font-medium text-danger-ink">
          <Icon name="info" size={16} />
          {error}
        </p>
      ) : (
        note && (
          <p id={`${id}-note`} className="flex items-center gap-1 text-label-sm font-medium text-slate">
            {note}
          </p>
        )
      )}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "size"> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  aside?: ReactNode;
  error?: string;
  note?: ReactNode;
  /** Leading icon. */
  icon?: string;
  /** Trailing non-interactive icon shown instead of the clear button. */
  trailingIcon?: string;
  inputRef?: Ref<HTMLInputElement>;
};

export function TextField({
  label,
  value,
  onChange,
  aside,
  error,
  note,
  icon,
  trailingIcon,
  required,
  inputRef,
  className = "",
  ...props
}: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={required} aside={aside} error={error} note={note}>
      <div className="relative flex items-center">
        {icon && <Icon name={icon} size={22} className="pointer-events-none absolute left-4 text-slate" />}
        <input
          id={id}
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || note ? `${id}-note` : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={`h-14 pr-14 ${icon ? "pl-12" : "pl-4"} ${CONTROL} ${tone(error)} ${className}`}
          {...props}
        />
        {error ? (
          <Icon name="error" size={24} className="pointer-events-none absolute right-4 text-danger" />
        ) : value ? (
          <button
            type="button"
            aria-label={`Effacer ${label.toLowerCase()}`}
            onClick={() => onChange("")}
            className="press absolute right-1.5 flex size-11 items-center justify-center rounded-full text-slate hover:bg-line/60 hover:text-ink"
          >
            <Icon name="cancel" size={22} />
          </button>
        ) : (
          trailingIcon && <Icon name={trailingIcon} size={22} className="pointer-events-none absolute right-4 text-slate" />
        )}
      </div>
    </FieldShell>
  );
}

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: string;
  maxLength: number;
};

export function TextArea({ label, value, onChange, optional, maxLength, className = "", ...props }: TextAreaProps) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-center justify-between text-label-md text-ink">
        <label htmlFor={id}>
          {label} {optional && <span className="font-normal text-slate">{optional}</span>}
        </label>
        <span className="text-label-sm font-medium tabular-nums text-slate">
          {value.length} / {maxLength} caractères
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={`resize-none px-4 py-3 leading-snug ${CONTROL} ${tone()} ${className}`}
        {...props}
      />
    </div>
  );
}
