import { ClipboardList } from 'lucide-react';

export default function EmptyState({ children }) {
  return (
    <div className="empty">
      <div className="empty-icon"><ClipboardList size={20} /></div>
      <b>Nothing to show yet</b>
      <p>{children}</p>
    </div>
  );
}
