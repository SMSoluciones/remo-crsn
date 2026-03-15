import { BeatLoader } from 'react-spinners';

export default function LoadingSpinner({
  message = 'Cargando...',
  className = '',
  textClassName = 'text-sm text-slate-500',
  color = '#1E40AF',
  size = 10,
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`} role="status" aria-live="polite" aria-label="Cargando">
      <BeatLoader color={color} size={size} />

      {message ? <p className={textClassName}>{message}</p> : null}
    </div>
  );
}