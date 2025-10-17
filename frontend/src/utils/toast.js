import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function showSuccess(message) {
  toast.success(message, { position: 'bottom-right', autoClose: 3000 });
}

export function showError(message) {
  toast.error(message, { position: 'bottom-right', autoClose: 5000 });
}

export default { showSuccess, showError };