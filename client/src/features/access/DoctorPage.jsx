import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { accessApi, emergencyApi } from '../../services/api.js';
import { useAsync } from '../../hooks.js';
import { useAuth } from '../../app/providers.jsx';
import { Alert, Avatar, Button, EmptyState, Input } from '../../components/ui/index.jsx';
import EmergencyCard from '../emergency/EmergencyCard.jsx';

export default function DoctorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dishaId, setDishaId] = useState('');
  const [card, setCard] = useState(null);
  const [otpId, setOtpId] = useState(null);
  const [code, setCode] = useState('');
  const [showGuardian, setShowGuardian] = useState(false);
  const [state, setState] = useState({ loading: false, error: null });
  const sessions = useAsync(() => accessApi.sessions(), []);

  const run = (fn) => async (e) => {
    e?.preventDefault();
    setState({ loading: true, error: null });
    try { await fn(); setState({ loading: false, error: null }); } catch (error) { setState({ loading: false, error }); }
  };
  const find = run(async () => { setCard(null); setOtpId(null); setShowGuardian(false); setCard(await emergencyApi.lookup(dishaId.trim())); });
  const requestOtp = run(async () => { setOtpId((await accessApi.request(card.dishaId)).otpId); setCode(''); });
  const verify = run(async () => { const { patient } = await accessApi.verify(otpId, code); navigate(`/doctor/patient/${patient.id}`); });
  const { guardian } = card || {};

  return (
    <>
      <div className="page-head"><Avatar userId={user.id} name={user.name} hasPhoto={user.hasPhoto} size={56} />
        <div><h1>Dr. {user.name}</h1><p className="muted">{user.speciality} · {user.hospitalName}</p></div></div>
      <form className="card narrow" onSubmit={find}>
        <h2>Find a user</h2>
        <Input label="User Disha ID" value={dishaId} onChange={(e) => setDishaId(e.target.value)} placeholder="DSH-XXXXXX" required />
        {!card && <Alert>{state.error?.message}</Alert>}
        <Button loading={state.loading && !card && !otpId}>Find user</Button>
      </form>
      {card && (
        <EmergencyCard card={card}>
          <div className="actions">
            <Button type="button" onClick={requestOtp} loading={state.loading && !!card && !otpId}>View Documents</Button>
            <Button type="button" variant="ghost" onClick={() => setShowGuardian(!showGuardian)}>Contact Guardian</Button>
          </div>
          {showGuardian && (guardian.phone
            ? <p><strong>{guardian.name || 'Guardian'}</strong>: <a href={`tel:${guardian.phone}`}>{guardian.phone}</a></p>
            : <Alert kind="info">This user has not added guardian contact details.</Alert>)}
          {otpId && (
            <form className="otp-form" onSubmit={verify}>
              <Input label="OTP sent to the user and guardian" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required />
              <Button loading={state.loading}>Verify OTP</Button>
            </form>)}
          <Alert>{state.error?.message}</Alert>
        </EmergencyCard>)}
      <h2>Active user sessions</h2>
      {!sessions.loading && !sessions.data?.length && <EmptyState>No active sessions. Access expires automatically.</EmptyState>}
      <ul className="list">{(sessions.data || []).map(({ patient, expiresAt }) => (
        <li key={patient.id} className="list-item">
          <div className="doc-title"><Avatar userId={patient.id} name={patient.name} hasPhoto={patient.hasPhoto} /><div><strong>{patient.name}</strong>
            <small>{patient.dishaId} · access until {new Date(expiresAt).toLocaleTimeString()}</small></div></div>
          <Link className="btn btn-ghost" to={`/doctor/patient/${patient.id}`}>Open records</Link>
        </li>))}</ul>
    </>
  );
}
