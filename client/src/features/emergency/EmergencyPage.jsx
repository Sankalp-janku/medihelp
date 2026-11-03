import { emergencyApi } from '../../services/api.js';
import { useAsync } from '../../hooks.js';
import { useToast } from '../../app/providers.jsx';
import { Alert, EmptyState, Skeleton } from '../../components/ui/index.jsx';
import EmergencyCard from './EmergencyCard.jsx';

export default function EmergencyPage() {
  const card = useAsync(() => emergencyApi.me(), []);
  const sessions = useAsync(() => emergencyApi.sessions(), []);
  const toast = useToast();
  const revoke = async (id) => {
    try { await emergencyApi.revoke(id); toast('Doctor access ended'); sessions.reload(); } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <h1>Emergency Medical Profile</h1>
      <p className="muted">Approved doctors who know your Disha ID can see this card in an emergency. They cannot see your documents without your OTP.</p>
      {card.loading ? <Skeleton /> : card.error ? <Alert>{card.error.message}</Alert> : <EmergencyCard card={card.data} />}
      <h2>Doctors who can view your documents now</h2>
      {sessions.error && <Alert>{sessions.error.message}</Alert>}
      {!sessions.loading && !sessions.data?.length && <EmptyState>No doctor currently has access.</EmptyState>}
      <ul className="list">{(sessions.data || []).map((s) => (
        <li key={s.id} className="list-item"><div><strong>Dr. {s.doctor.name}</strong><small>{s.doctor.hospitalName} · until {new Date(s.expiresAt).toLocaleTimeString()}</small></div>
          <button className="btn btn-danger" onClick={() => revoke(s.id)}>End access</button></li>))}</ul>
    </>
  );
}
