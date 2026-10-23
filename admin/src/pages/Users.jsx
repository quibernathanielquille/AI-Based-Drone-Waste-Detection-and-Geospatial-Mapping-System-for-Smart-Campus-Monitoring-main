import { useEffect, useState } from 'react';
import { userService } from '../services/api';
import { formatRoleLabel } from '../utils/constants';
import ConfirmModal from '../components/ConfirmModal';

const emptyUser = { first_name: '', last_name: '', email: '', password: '', role_id: 2, phone: '', is_active: 1 };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyUser);
  const [resetId, setResetId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = () => {
    userService.getAll({ page, search }).then((res) => {
      if (res.data.success) {
        setUsers(res.data.data.items);
        setPagination(res.data.data.pagination);
      }
    });
  };

  useEffect(() => {
    userService.getRoles().then((res) => { if (res.data.success) setRoles(res.data.data); });
    load();
  }, [page, search]);

  const openModal = (user = null) => {
    setForm(user ? { ...user, password: '' } : emptyUser);
    setModal(user ? 'edit' : 'add');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, role_id: parseInt(form.role_id), is_active: parseInt(form.is_active) };
    if (modal === 'edit') {
      const { password, ...rest } = payload;
      await userService.update(form.id, password ? payload : rest);
    } else {
      await userService.create(payload);
    }
    setModal(null);
    load();
  };

  const handleDelete = (id) => setDeleteTarget(id);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await userService.delete(deleteTarget);
      setDeleteTarget(null);
      load();
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetPassword = async () => {
    await userService.resetPassword(resetId, newPassword);
    setResetId(null);
    setNewPassword('');
  };

  return (
    <div>
      <div className="page-toolbar">
        <div className="page-toolbar-actions">
          <input className="form-control" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button className="btn btn-success" onClick={() => openModal()}><i className="bi bi-person-plus me-1" />Add User</button>
      </div>

      <div className="card-panel">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.email}</td>
                  <td><span className="badge bg-success-subtle text-success">{formatRoleLabel(u)}</span></td>
                  <td>{u.is_active ? <span className="text-success">Active</span> : <span className="text-danger">Inactive</span>}</td>
                  <td>{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-success me-1" onClick={() => openModal(u)}><i className="bi bi-pencil" /></button>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => setResetId(u.id)}><i className="bi bi-key" /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.id)}><i className="bi bi-trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header"><h5>{modal === 'edit' ? 'Edit' : 'Add'} User</h5><button className="btn-close" onClick={() => setModal(null)} /></div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body row g-3">
                  <div className="col-6"><label className="form-label">First Name</label><input className="form-control" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required /></div>
                  <div className="col-6"><label className="form-label">Last Name</label><input className="form-control" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required /></div>
                  <div className="col-12"><label className="form-label">Email</label><input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                  <div className="col-12"><label className="form-label">{modal === 'edit' ? 'New Password (optional)' : 'Password'}</label><input type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={modal === 'add' ? 8 : 0} required={modal === 'add'} /></div>
                  <div className="col-6"><label className="form-label">Role</label><select className="form-select" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                  <div className="col-6"><label className="form-label">Status</label><select className="form-select" value={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.value })}><option value={1}>Active</option><option value={0}>Inactive</option></select></div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-success">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {resetId && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header"><h5>Reset Password</h5><button className="btn-close" onClick={() => setResetId(null)} /></div>
              <div className="modal-body">
                <input type="password" className="form-control" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={handleResetPassword}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete user?"
        message="This user account will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
