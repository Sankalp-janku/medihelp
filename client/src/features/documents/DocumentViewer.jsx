import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { documentsApi } from '../../services/api.js';
import { useAsync, useBlobUrl } from '../../hooks.js';
import { useAuth } from '../../app/providers.jsx';
import { Alert, Icon, Skeleton } from '../../components/ui/index.jsx';

export default function DocumentViewer() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const patientId = params.get('patientId') || undefined;
  const { user } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();
  const meta = useAsync(() => documentsApi.get(id, patientId), [id, patientId]);
  const file = useBlobUrl(() => documentsApi.file(id, patientId), [id, patientId]);

  const fallback = user.role === 'doctor' && patientId ? `/doctor/patient/${patientId}` : '/documents';
  const back = () => navigate(state?.backTo || fallback); // returns to the list with its filters and page
  const error = meta.error || file.error;

  return (
    <>
      <div className="viewer-head">
        <div>
          <h1>{meta.data?.title || 'Document'}</h1>
          {meta.data && <p className="muted">Uploaded Date: {new Date(meta.data.createdAt).toLocaleString()}</p>}
        </div>
        <button className="icon-btn" onClick={back} aria-label="Back to documents" title="Back to documents"><Icon name="back" /></button>
      </div>
      <Alert>{error?.message}</Alert>
      {file.loading || meta.loading ? <Skeleton lines={5} /> : file.url && (meta.data?.mimeType === 'application/pdf'
        ? <iframe className="viewer" src={file.url} title={meta.data.title} />
        : <img className="viewer-img" src={file.url} alt={meta.data?.title} />)}
    </>
  );
}
