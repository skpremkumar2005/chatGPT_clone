import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const API = process.env.REACT_APP_API_URL;

const inputCls = "w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all";
const selectCls = "w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all";
const labelCls = "block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const { permissions } = useSelector((state) => state.auth);
  const canManageUsers = permissions?.includes("manage:users");

  const emptyForm = { name: "", email: "", password: "", role_id: "", department: "" };
  const [formData, setFormData] = useState(emptyForm);

  const fetchRoles = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/admin/roles`, { withCredentials: true });
      setRoles(r.data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (showCreateModal && roles.length === 0) fetchRoles();
  }, [showCreateModal, roles.length, fetchRoles]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/admin/users`, {
        params: { page, limit: 20, search: searchQuery },
        withCredentials: true,
      });
      setUsers(r.data.data.users || []);
      setTotalUsers(r.data.data.total || 0);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await axios.post(`${API}/admin/users`, { ...formData, is_active: true }, { withCredentials: true });
      setShowCreateModal(false);
      setFormData(emptyForm);
      fetchUsers();
      toast.success("User created successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally { setCreateLoading(false); }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: "", role_id: user.role_id, department: user.department || "" });
    if (roles.length === 0) fetchRoles();
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const data = { name: formData.name, role_id: formData.role_id, department: formData.department };
      if (formData.password) data.password = formData.password;
      await axios.put(`${API}/admin/users/${editingUser.id}`, data, { withCredentials: true });
      setShowEditModal(false);
      setEditingUser(null);
      setFormData(emptyForm);
      fetchUsers();
      toast.success("User updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user");
    } finally { setCreateLoading(false); }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm("Deactivate this user?")) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { withCredentials: true });
      fetchUsers();
      toast.success("User deactivated");
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleActivateUser = async (userId) => {
    if (!window.confirm("Activate this user?")) return;
    try {
      await axios.put(`${API}/admin/users/${userId}`, { is_active: true }, { withCredentials: true });
      fetchUsers();
      toast.success("User activated");
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const totalPages = Math.ceil(totalUsers / 20);

  const UserModal = ({ title, onSubmit, onClose, isEdit }) => (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isEdit ? "Update user information" : "Add a new user to your company"}
          </p>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder="John Doe" />
            </div>
            <div>
              <label className={labelCls}>Email Address {!isEdit && <span className="text-red-400">*</span>}</label>
              <input type="email" required={!isEdit} disabled={isEdit} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`${inputCls} ${isEdit ? "opacity-50 cursor-not-allowed" : ""}`} placeholder="john@company.com" />
              {isEdit && <p className="text-xs text-zinc-400 mt-1">Email cannot be changed</p>}
            </div>
          </div>
          <div>
            <label className={labelCls}>{isEdit ? "New Password (leave blank to keep current)" : <>Password <span className="text-red-400">*</span></>}</label>
            <input type="password" required={!isEdit} minLength={6} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={inputCls} placeholder="Min 6 characters" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Role <span className="text-red-400">*</span></label>
              <select required value={formData.role_id} onChange={(e) => setFormData({ ...formData, role_id: e.target.value })} className={selectCls}>
                <option value="">Select role…</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name.replace(/_/g, " ").toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Department</label>
              <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={inputCls} placeholder="Engineering, Sales…" />
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium transition-all">Cancel</button>
            <button type="submit" disabled={createLoading} className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-cyan-500/20">
              {createLoading ? (isEdit ? "Updating…" : "Creating…") : (isEdit ? "Update User" : "Create User")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">User Management</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage company users, roles, and permissions</p>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search users by name, email, or department…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`${inputCls} max-w-sm`}
        />
        {canManageUsers && (
          <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-cyan-500/20">
            Create User
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Users", value: totalUsers, cls: "text-zinc-900 dark:text-white" },
          { label: "Active Users", value: users.filter(u => u.is_active).length, cls: "text-green-600 dark:text-green-400" },
          { label: "Inactive Users", value: users.filter(u => !u.is_active).length, cls: "text-red-500 dark:text-red-400" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {error && <div className="mb-5 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">No users found</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  {["User", "Role", "Department", "Status", "Last Login", "Actions"].map((h, i) => (
                    <th key={h} className={`px-6 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">{user.name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 rounded-lg text-xs font-medium">
                        {user.role_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">{user.department || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${user.is_active ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {canManageUsers && (
                        <>
                          <button onClick={() => handleEditUser(user)} className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors">Edit</button>
                          {user.is_active
                            ? <button onClick={() => handleDeactivateUser(user.id)} className="text-sm font-medium text-red-500 dark:text-red-400 hover:text-red-400 transition-colors">Deactivate</button>
                            : <button onClick={() => handleActivateUser(user.id)} className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-500 transition-colors">Activate</button>
                          }
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <p className="text-sm text-zinc-500">{(page - 1) * 20 + 1}–{Math.min(page * 20, totalUsers)} of {totalUsers}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium disabled:opacity-40 transition-all">Previous</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium disabled:opacity-40 transition-all">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCreateModal && <UserModal title="Create New User" onSubmit={handleCreateUser} onClose={() => { setShowCreateModal(false); setFormData(emptyForm); }} isEdit={false} />}
      {showEditModal && <UserModal title="Edit User" onSubmit={handleUpdateUser} onClose={() => { setShowEditModal(false); setEditingUser(null); setFormData(emptyForm); }} isEdit={true} />}
    </div>
  );
};

export default UserManagement;
