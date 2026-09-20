import React, { useState, useEffect, useRef } from 'react';
import { parseSheetNumber } from '../utils/numberParser';

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

    const parsed = parseSheetNumber(raw, integerOnly);
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
    let num = parseSheetNumber(localStr, integerOnly);
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
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = parseSheetNumber(localStr, integerOnly) || (fallbackValue ?? 0);
      const stepNum = typeof step === 'number' ? step : parseFloat(step) || 1;
      let next = current + stepNum;
      if (max !== undefined && next > max) next = max;
      onChange(next);
      setLocalStr(formatVal(next));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseSheetNumber(localStr, integerOnly) || (fallbackValue ?? 0);
      const stepNum = typeof step === 'number' ? step : parseFloat(step) || 1;
      let next = current - stepNum;
      if (min !== undefined && next < min) next = min;
      onChange(next);
      setLocalStr(formatVal(next));
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={integerOnly ? "numeric" : "decimal"}
      id={id}
      name={name}
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
