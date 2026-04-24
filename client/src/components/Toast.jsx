function Toast({ toast }) {
  if (!toast) {
    return null;
  }

  return (
    <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}

export default Toast;
