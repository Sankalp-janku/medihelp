import { useEffect, useState } from 'react';
import { historyApi } from '../../services/api.js';
import { Alert, Button, EmptyState, Skeleton } from '../../components/ui/index.jsx';

const LABELS = { 'document.uploaded': 'Uploaded document', 'document.deleted': 'Deleted document', 'document.viewed': 'Viewed document', 'access.granted': 'Doctor access granted', 'access.revoked': 'You ended doctor access', 'emergency.viewed': 'Doctor viewed emergency profile' };
const roleName = (r) => (r === 'patient' ? 'user' : r);

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });

  const load = async (before) => {
    setState({ loading: true, error: null });
    try {
      const page = await historyApi.list(before);
      setItems((prev) => (before ? [...prev, ...page.items] : page.items));
      setCursor(page.nextCursor);
      setState({ loading: false, error: null });
    } catch (error) { setState({ loading: false, error }); }
  };
  useEffect(() => { load(); }, []);

  return (
    <>
      <h1>Activity History</h1>
      <p className="muted">A permanent record of every activity. Entries cannot be edited or deleted.</p>
      <Alert>{state.error?.message}</Alert>
      {!items.length && !state.loading && <EmptyState>No activity yet.</EmptyState>}
      <ul className="list">
        {items.map((a) => (
          <li key={a._id} className="list-item">
            <div><strong>{LABELS[a.action] || a.action}{a.entityTitle ? `: ${a.entityTitle}` : ''}</strong>
              <small>by {a.actorName} ({roleName(a.actorRole)})</small></div>
            <time>{new Date(a.occurredAt).toLocaleString()}</time>
          </li>
        ))}
      </ul>
      {state.loading && <Skeleton />}
      {cursor && !state.loading && <Button variant="ghost" onClick={() => load(cursor)}>Load more</Button>}
    </>
  );
}
