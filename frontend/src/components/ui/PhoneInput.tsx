import React, { useState, useEffect } from 'react'
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react'

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string, isValid: boolean) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  label?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Normaliza cualquier string de entrada para extraer únicamente los 10 dígitos locales de Argentina.
 * Maneja casos como "+54 9 261 472-0339", "0261 15 4720339", "5492614720339", etc.
 */
export function extractLocalArgentinaDigits(input: string): string {
  if (!input) return ''
  let digits = input.replace(/\D/g, '')

  // Si empieza con 549 (13 dígitos)
  if (digits.startsWith('549')) {
    digits = digits.slice(3)
  } else if (digits.startsWith('54') && digits.length >= 12) {
    // Si empieza con 54 (sin 9)
    digits = digits.slice(2)
  }

  // Si empieza con 0 (código de área con 0)
  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  // Si contiene '15' después del código de área (ej: 261 + 15 + 4720339 = 12 dígitos)
  for (const areaLen of [2, 3, 4]) {
    if (digits.length === 12 && digits.slice(areaLen, areaLen + 2) === '15') {
      digits = digits.slice(0, areaLen) + digits.slice(areaLen + 2)
      break
    }
  }

  // Limitamos a los 10 dígitos locales estándar de Argentina
  return digits.slice(0, 10)
}

/**
 * Formatea 10 dígitos locales para visualización legible (ej: 261 472 0339 o 11 2345 6789)
 */
export function formatLocalDisplay(digits: string): string {
  if (!digits) return ''
  
  // Buenos Aires (11)
  if (digits.startsWith('11')) {
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  
  // Códigos de 3 dígitos (ej: 261, 351, 341)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export default function PhoneInput({
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = '261 472-0339',
  id,
  name,
  label,
  autoFocus = false,
  className = ''
}: PhoneInputProps) {
  const [localDigits, setLocalDigits] = useState(() => extractLocalArgentinaDigits(value || ''))

  useEffect(() => {
    const extracted = extractLocalArgentinaDigits(value || '')
    if (extracted !== localDigits) {
      setLocalDigits(extracted)
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value
    const cleaned = extractLocalArgentinaDigits(rawInput)
    setLocalDigits(cleaned)

    const fullNumber = cleaned.length > 0 ? `549${cleaned}` : ''
    const isValid = cleaned.length === 10
    onChange(fullNumber, isValid)
  }

  const fullNumberPreview = localDigits.length > 0 ? `549${localDigits}` : ''
  const isComplete = localDigits.length === 10

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-on-surface-variant">
          {label} {required && <span className="text-primary">*</span>}
        </label>
      )}

      {/* Input con prefijo +54 9 */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-surface-container border border-outline-variant/60 rounded-lg px-2.5 py-1 text-xs font-bold text-on-surface select-none pointer-events-none z-10 shadow-xs">
          <span className="text-sm leading-none" role="img" aria-label="Argentina">🇦🇷</span>
          <span className="text-primary font-black tracking-tight">+54 9</span>
        </div>

        <input
          id={id}
          name={name}
          type="tel"
          value={formatLocalDisplay(localDigits)}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          maxLength={14} // Con espacios y guiones
          className="w-full pl-28 pr-10 h-11 sm:h-12 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm sm:text-base font-semibold text-on-surface placeholder:text-on-surface-variant/40 disabled:opacity-50"
        />

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
          {isComplete ? (
            <CheckCircle2 size={18} className="text-primary" />
          ) : localDigits.length > 0 ? (
            <AlertCircle size={18} className="text-amber-500/80" />
          ) : (
            <Phone size={18} className="opacity-40" />
          )}
        </div>
      </div>

      {/* Preview en vivo */}
      {localDigits.length > 0 && (
        <div className="flex items-center justify-between text-xs px-1 pt-0.5 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <span className="text-on-surface-variant">Se guardará como:</span>
            <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
              isComplete 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}>
              {fullNumberPreview}
            </span>
          </div>

          {!isComplete && (
            <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
              {10 - localDigits.length} {10 - localDigits.length === 1 ? 'dígito faltante' : 'dígitos faltantes'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
