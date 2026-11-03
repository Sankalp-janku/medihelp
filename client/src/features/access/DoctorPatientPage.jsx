import { Link, useParams } from 'react-router-dom';
import { accessApi } from '../../services/api.js';
import { useAsync } from '../../hooks.js';
import { Alert, Avatar, Skeleton } from '../../components/ui/index.jsx';
import DocumentBrowser from '../documents/DocumentBrowser.jsx';

export default function DoctorPatientPage() {
  const { patientId } = useParams();
  const { data, loading } = useAsync(() => accessApi.sessions(), []);
  const session = data?.find((s) => s.patient.id === patientId);
  if (loading) return <Skeleton />;
  if (!session) return <Alert>Access has expired or was not granted. <Link to="/doctor">Request access again</Link></Alert>;
  const { patient, expiresAt } = session;
  return (
    <>
      <div className="page-head"><Avatar userId={patient.id} name={patient.name} hasPhoto={patient.hasPhoto} size={56} />
        <div><h1>{patient.name}</h1><p className="muted">{patient.dishaId} · {patient.bloodGroup || 'blood group not set'} · read-only until {new Date(expiresAt).toLocaleTimeString()}</p></div></div>
      <DocumentBrowser patientId={patientId} />
    </>
  );
}
