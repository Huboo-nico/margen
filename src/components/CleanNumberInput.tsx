import React, { useState, useEffect, useRef } from 'react';

export interface CleanNumberInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number | string;
  className?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  decimals?: number;
  integerOnly?: boolean;
  fallbackValue?: number;
  disabled?: boolean;
  autoSelectOnFocus?: boolean;
}

export const CleanNumberInput: React.FC<CleanNumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  className = '',
  placeholder,
  id,
  name,
  decimals,
  integerOnly = false,
  fallbackValue,
  disabled = false,
  autoSelectOnFocus = false,
}) => {
  // Format initial display
  const formatVal = (v: number | undefined | null): string => {
    if (v === undefined || v === null || isNaN(v)) return '';
    if (decimals !== undefined) return Number(v).toFixed(decimals);
    return String(v);
  };

  const [localStr, setLocalStr] = useState<string>(() => formatVal(value));
  const isFocusedRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize when value changes externally AND field is not focused
  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalStr(formatVal(value));
    }
  }, [value, decimals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalStr(raw);

    // If completely cleared or just a minus/dot, don't force parent yet or pass 0 safely
    if (raw.trim() === '' || raw === '-' || raw === '.') {
      const emptyVal = fallbackValue !== undefined ? fallbackValue : (min !== undefined && min <= 0 ? 0 : (min ?? 0));
      onChange(emptyVal);
      return;
    }

    const parsed = integerOnly ? parseInt(raw, 10) : parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = true;
    if (autoSelectOnFocus) {
      e.target.select();
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    let num = integerOnly ? parseInt(localStr, 10) : parseFloat(localStr);
    const fallback = fallbackValue ?? (min !== undefined ? min : 0);

    if (isNaN(num) || localStr.trim() === '') {
      num = fallback;
    } else {
      if (min !== undefined && num < min) {
        num = min;
      }
      if (max !== undefined && num > max) {
        num = max;
      }
    }

    onChange(num);
    setLocalStr(formatVal(num));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="number"
      id={id}
      name={name}
      min={min}
      max={max}
      step={step}
      value={localStr}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
};
