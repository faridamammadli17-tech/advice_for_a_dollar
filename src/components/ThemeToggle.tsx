import { useTheme } from '../theme/useTheme';
import { type ThemePreference } from '../theme/ThemeContext';

const OPTIONS: readonly { value: ThemePreference; label: string; title: string }[] = [
  { value: 'system', label: 'Auto', title: 'Follow my device' },
  { value: 'day', label: 'Day', title: 'Always day' },
  { value: 'night', label: 'Night', title: 'Always night' },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div className="theme-toggle" role="group" aria-label="Day or night">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.title}
          aria-pressed={preference === option.value}
          onClick={() => setPreference(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
