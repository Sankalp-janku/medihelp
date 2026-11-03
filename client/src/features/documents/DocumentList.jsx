import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../../components/ui/index.jsx';

export default function DocumentList({ docs, patientId, onDelete }) {
  const location = useLocation();
  const backTo = location.pathname + location.search; // lets the viewer return to the same filters and page
  return (
    <ul className="list">
      {docs.map((d) => (
        <li key={d._id} className="list-item">
          <div className="doc-title"><Icon name="file" /><div><strong>{d.title}</strong>
            <small>{d.type.replace('_', ' ')} · Uploaded Date: {new Date(d.createdAt).toLocaleString()}</small></div></div>
          <div className="actions">
            <Link className="btn btn-ghost" to={`/documents/${d._id}${patientId ? `?patientId=${patientId}` : ''}`} state={{ backTo }}>View</Link>
            {onDelete && <button className="btn btn-danger" onClick={() => onDelete(d._id)}>Delete</button>}
          </div>
        </li>
      ))}
    </ul>
  );
}
