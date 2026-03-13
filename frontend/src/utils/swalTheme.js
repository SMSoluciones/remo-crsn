import Swal from 'sweetalert2';

export function getSwalThemeOptions() {
  const root = document.documentElement;
  const isDark = root.classList.contains('dark') || root.getAttribute('data-theme') === 'dark';

  if (!isDark) {
    return {
      background: '#ffffff',
      color: '#0f172a',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280',
    };
  }

  return {
    background: '#0f172a',
    color: '#e2e8f0',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#475569',
  };
}

export function fireThemedSwal(options) {
  return Swal.fire({
    ...getSwalThemeOptions(),
    ...options,
  });
}
