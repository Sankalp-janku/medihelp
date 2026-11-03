import { useState } from 'react';
import { authApi } from '../../services/api.js';
import { useAuth, useToast } from '../../app/providers.jsx';
import { Alert, Avatar, Button, CopyButton, Input } from '../../components/ui/index.jsx';

const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const show = (v) => (v ? v : <span className="muted">Not provided</span>);
const Info = ({ rows }) => <dl className="detail-grid">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{show(v)}</dd></div>)}</dl>;

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(null);
  const [state, setState] = useState({ loading: false, error: null });
  const { percent, missing } = user.profileCompletion;
  const errs = Object.fromEntries((state.error?.details || []).map((d) => [d.field, d.message]));

  const startEdit = () => {
    setV({ dateOfBirth: user.dateOfBirth?.slice(0, 10) || '', bloodGroup: user.bloodGroup || '',
      guardian: { name: user.guardian?.name || '', phone: user.guardian?.phone || '', email: user.guardian?.email || '' } });
    setState({ loading: false, error: null }); setEditing(true);
  };
  const setGuardian = (k) => (e) => setV({ ...v, guardian: { ...v.guardian, [k]: e.target.value } });
  const save = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: null });
    try { setUser(await authApi.updateProfile(v)); toast('Profile saved'); setEditing(false); }
    catch (error) { setState({ loading: false, error }); }
  };

  return (
    <>
      <div className="page-head"><Avatar userId={user.id} name={user.name} hasPhoto={user.hasPhoto} size={72} /><div><h1>{user.name}</h1><p className="muted">User profile</p></div>
        {!editing && <Button variant="ghost" onClick={startEdit}>Edit Profile</Button>}</div>

      <section className="card" aria-label="Profile completion">
        <div className="id-row"><strong>Profile completion</strong><strong>{percent}%</strong></div>
        <div className="progress-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /></div>
        {missing.length ? <><p className="muted">Complete your profile by adding:</p><ul className="chips">{missing.map((m) => <li key={m.key}>{m.label}</li>)}</ul></>
          : <p className="muted">Your profile is complete.</p>}
      </section>

      {editing ? (
        <form className="card" onSubmit={save}>
          <h2>Edit profile</h2>
          <Input label="Date of birth" type="date" max={new Date().toISOString().slice(0, 10)} value={v.dateOfBirth} onChange={(e) => setV({ ...v, dateOfBirth: e.target.value })} error={errs.dateOfBirth} />
          <label className="field"><span>Blood group</span><select value={v.bloodGroup} onChange={(e) => setV({ ...v, bloodGroup: e.target.value })}>
            <option value="">Select</option>{BLOOD.map((g) => <option key={g}>{g}</option>)}</select>{errs.bloodGroup && <small className="field-error">{errs.bloodGroup}</small>}</label>
          <Input label="Guardian name" value={v.guardian.name} onChange={setGuardian('name')} error={errs['guardian.name']} />
          <Input label="Guardian mobile" type="tel" value={v.guardian.phone} onChange={setGuardian('phone')} error={errs['guardian.phone']} />
          <Input label="Guardian email" type="email" value={v.guardian.email} onChange={setGuardian('email')} error={errs['guardian.email']} />
          <Alert>{state.error && !state.error.details ? state.error.message : ''}</Alert>
          <div className="actions"><Button loading={state.loading}>Save profile</Button><Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div>
        </form>
      ) : (
        <div className="grid two">
          <section className="card"><h2>Personal details</h2>
            <Info rows={[['Full name', user.name], ['Email', user.email], ['Phone', user.phone], ['Date of birth', user.dateOfBirth && new Date(user.dateOfBirth).toLocaleDateString(undefined, { timeZone: 'UTC' })],
              ['Age', user.age !== null && user.age !== undefined ? `${user.age} years` : null], ['Blood group', user.bloodGroup]]} /></section>
          <section className="card"><h2>Disha ID</h2><div className="id-row"><strong>{user.dishaId}</strong><CopyButton text={user.dishaId} /></div>
            <h2>Guardian</h2><Info rows={[['Name', user.guardian?.name], ['Contact number', user.guardian?.phone], ['Email', user.guardian?.email]]} /></section>
        </div>)}
    </>
  );
}
