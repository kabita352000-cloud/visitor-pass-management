export default function Notice({ type = 'error', children, onDismiss }) {
  if (!children) return null;
  const className = type === 'success' ? 'success-banner' : 'alert';

  return (
    <div className={className} role={type === 'success' ? 'status' : 'alert'}>
      <span>{children}</span>
      {onDismiss && <button type="button" aria-label="Dismiss message" onClick={onDismiss}>×</button>}
    </div>
  );
}
