import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, metaApi } from '../../services/api.js';
import { useAuth, useToast } from '../../app/providers.jsx';
import { useAsync } from '../../hooks.js';
import { Alert, Button, Input } from '../../components/ui/index.jsx';

const PHOTO_TYPES = ['image/jpeg', 'image/png'];
const PHOTO_MAX = 2 * 1024 * 1024;
const HOME = { admin: '/admin', doctor: '/doctor', patient: '/documents' };
const useForm = (initial) => {
  const [values, setValues] = useState(initial);
  return [values, (k) => (e) => setValues({ ...values, [k]: e.target.value })];
};
const fieldErrors = (err) => Object.fromEntries((err?.details || []).map((d) => [d.field, d.message]));

const ROLE_OPTIONS = [['patient', 'User'], ['doctor', 'Doctor'], ['admin', 'Administrator']];
const TITLES = { patient: 'User login', doctor: 'Doctor login', admin: 'Administrator login' };

export function LoginPage() {
  const [params] = useSearchParams();
  const [role, setRole] = useState({ doctor: 'doctor', admin: 'admin' }[params.get('role')] || 'patient');
  const [v, bind] = useForm({ email: '', password: '' });
  const [state, setState] = useState({ loading: false, error: null });
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: null });
    try { const session = await authApi.login({ ...v, expectedRole: role }); signIn(session); navigate(HOME[session.user.role]); }
    catch (error) { setState({ loading: false, error }); }
  };
  return (
    <form className="card narrow" onSubmit={submit}>
      <h1>{TITLES[role]}</h1>
      <label className="field"><span>Login as</span>
        <select value={role} onChange={(e) => setRole(e.target.value)}>{ROLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <Input label="Email" type="email" value={v.email} onChange={bind('email')} required />
      <Input label="Password" type="password" value={v.password} onChange={bind('password')} required />
      <Alert>{state.error?.message}</Alert>
      <Button loading={state.loading}>Log in</Button>
      {role !== 'admin' && <p>New here? <Link to={`/register?role=${role}`}>Create {role === 'doctor' ? 'a doctor' : 'a user'} account</Link></p>}
    </form>
  );
}

function PhotoPicker({ file, onChange, error }) {
  const [preview, setPreview] = useState(null);
  const [localError, setLocalError] = useState('');
  useEffect(() => { if (!file) return setPreview(null); const u = URL.createObjectURL(file); setPreview(u); return () => URL.revokeObjectURL(u); }, [file]);
  const pick = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!PHOTO_TYPES.includes(f.type)) { setLocalError('Photo must be a JPG or PNG image'); return onChange(null); }
    if (f.size > PHOTO_MAX) { setLocalError('Photo must be smaller than 2 MB'); return onChange(null); }
    setLocalError(''); onChange(f);
  };
  return (
    <div className="field">
      <span>Profile photo (required)</span>
      <div className="photo-pick">
        {preview ? <img className="avatar" style={{ width: 72, height: 72 }} src={preview} alt="Selected profile preview" /> : <span className="avatar avatar-fallback" style={{ width: 72, height: 72 }}>Photo</span>}
        <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={pick} aria-label="Profile photo" />
      </div>
      {(localError || error) && <small className="field-error">{localError || error}</small>}
    </div>
  );
}

export function RegisterPage() {
  const [params] = useSearchParams();
  const [v, bind] = useForm({ role: params.get('role') === 'doctor' ? 'doctor' : 'patient', name: '', email: '', phone: '', password: '',
    speciality: '', specialityOther: '', qualifications: '', councilRegNumber: '', hospitalName: '', area: '' });
  const [photo, setPhoto] = useState(null);
  const [docs, setDocs] = useState([]);
  const [otp, setOtp] = useState({ id: null, code: '' });
  const [state, setState] = useState({ loading: false, error: null });
  const specialities = useAsync(() => metaApi.specialities(), []);
  const toast = useToast();
  const navigate = useNavigate();
  const errs = fieldErrors(state.error);
  const isDoctor = v.role === 'doctor';

  const submit = async (e) => {
    e.preventDefault();
    if (!photo) return setState({ loading: false, error: Object.assign(new Error('Please fix the errors'), { details: [{ field: 'photo', message: 'Profile photo is required' }] }) });
    const form = new FormData();
    Object.entries(v).forEach(([k, val]) => { if (val && (isDoctor || ['role', 'name', 'email', 'phone', 'password'].includes(k))) form.append(k, val); });
    form.append('photo', photo);
    if (isDoctor) docs.forEach((d) => form.append('verificationDocs', d));
    setState({ loading: true, error: null });
    try { const { otpId } = await authApi.register(form); setOtp({ id: otpId, code: '' }); setState({ loading: false, error: null }); }
    catch (error) { setState({ loading: false, error }); }
  };
  const verify = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: null });
    try {
      const { status } = await authApi.verifyPhone({ otpId: otp.id, code: otp.code });
      toast(status === 'active' ? 'Phone verified. You can log in.' : 'Verified. Your account will be reviewed by an administrator.');
      navigate('/login');
    } catch (error) { setState({ loading: false, error }); }
  };

  if (otp.id) return (
    <form className="card narrow" onSubmit={verify}>
      <h1>Verify your phone</h1>
      <p>Enter the 6-digit code sent to {v.phone}.</p>
      <Input label="Code" inputMode="numeric" maxLength={6} value={otp.code} onChange={(e) => setOtp({ ...otp, code: e.target.value })} required />
      <Alert>{state.error?.message}</Alert>
      <Button loading={state.loading}>Verify</Button>
    </form>
  );
  return (
    <form className="card narrow" onSubmit={submit} noValidate>
      <h1>{isDoctor ? 'Doctor registration' : 'Create your account'}</h1>
      <label className="field"><span>I am a</span>
        <select value={v.role} onChange={bind('role')}><option value="patient">User</option><option value="doctor">Doctor</option></select></label>
      <PhotoPicker file={photo} onChange={setPhoto} error={errs.photo} />
      <Input label="Full name" value={v.name} onChange={bind('name')} error={errs.name} required />
      <Input label="Email" type="email" value={v.email} onChange={bind('email')} error={errs.email} required />
      <Input label="Phone (with country code)" type="tel" value={v.phone} onChange={bind('phone')} error={errs.phone} required />
      <Input label="Password" type="password" value={v.password} onChange={bind('password')} error={errs.password} required />
      {isDoctor && <>
        <label className="field"><span>Speciality</span>
          <select value={v.speciality} onChange={bind('speciality')} aria-invalid={!!errs.speciality}>
            <option value="">Select speciality</option>{(specialities.data || []).map((s) => <option key={s}>{s}</option>)}</select>
          {errs.speciality && <small className="field-error">{errs.speciality}</small>}</label>
        {v.speciality === 'Other' && <Input label="Your speciality" value={v.specialityOther} onChange={bind('specialityOther')} error={errs.specialityOther} />}
        <Input label="Qualifications (e.g. MBBS, MD)" value={v.qualifications} onChange={bind('qualifications')} error={errs.qualifications} />
        <Input label="Medical council registration no." value={v.councilRegNumber} onChange={bind('councilRegNumber')} error={errs.councilRegNumber} />
        <Input label="Hospital name" value={v.hospitalName} onChange={bind('hospitalName')} error={errs.hospitalName} />
        <Input label="Area" value={v.area} onChange={bind('area')} error={errs.area} />
        <div className="field"><span>Verification documents (licence, degree; PDF/JPG/PNG, up to 3)</span>
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDocs([...e.target.files].slice(0, 3))} />
          {errs.verificationDocs && <small className="field-error">{errs.verificationDocs}</small>}</div>
      </>}
      <Alert>{state.error && !state.error.details ? state.error.message : ''}</Alert>
      <Button loading={state.loading}>Continue</Button>
      <p>Have an account? <Link to={`/login${isDoctor ? '?role=doctor' : ''}`}>Log in</Link></p>
    </form>
  );
}
