import React from 'react';

export interface StrengthResult {
  score: number;
  label: string;
  color: string;
  textColor: string;
  canSubmit: boolean;
}

export function getPasswordStrength(pwd: string): StrengthResult {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600', canSubmit: false };
  if (score === 2) return { score, label: 'Fair', color: 'bg-orange-500', textColor: 'text-orange-600', canSubmit: false };
  if (score === 3) return { score, label: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-600', canSubmit: true };
  if (score === 4) return { score, label: 'Strong', color: 'bg-green-400', textColor: 'text-green-600', canSubmit: true };
  return { score, label: 'Very Strong', color: 'bg-green-600', textColor: 'text-green-700', canSubmit: true };
}

interface PasswordStrengthMeterProps {
  password?: string;
  onStrengthChange?: (canSubmit: boolean) => void;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '', onStrengthChange }) => {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const barWidth = `${(strength.score / 5) * 100}%`;

  // Call the callback when strength changes if provided
  React.useEffect(() => {
    onStrengthChange?.(strength.canSubmit);
  }, [strength.canSubmit, onStrengthChange]);

  return (
    <div className="mt-2 space-y-1.5">
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
          style={{ width: barWidth }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-xs text-slate-400">
          <span className={/[A-Z]/.test(password) ? 'text-green-600 font-medium' : ''}>ABC</span>
          <span className={/[0-9]/.test(password) ? 'text-green-600 font-medium' : ''}>123</span>
          <span className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600 font-medium' : ''}>!@#</span>
          <span className={password.length >= 8 ? 'text-green-600 font-medium' : ''}>8+</span>
          <span className={password.length >= 12 ? 'text-green-600 font-medium' : ''}>12+</span>
        </div>
        <span className={`text-xs font-bold ${strength.textColor}`}>{strength.label}</span>
      </div>
      {!strength.canSubmit && (
        <p className="text-xs text-red-500 font-medium">
          Add uppercase letters, numbers, and symbols to continue.
        </p>
      )}
    </div>
  );
};
