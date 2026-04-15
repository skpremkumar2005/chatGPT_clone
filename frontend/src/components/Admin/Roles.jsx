import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ALL_PERMISSIONS = [
  { key: "manage:companies", label: "Manage Companies", group: "Super Admin" },
  { key: "view:all_companies", label: "View All Companies", group: "Super Admin" },
  { key: "manage:users", label: "Manage Users", group: "Company Admin" },
  { key: "view:users", label: "View Users", group: "Company Admin" },
  { key: "manage:roles", label: "Manage Roles", group: "Company Admin" },
  { key: "view:roles", label: "View Roles", group: "Company Admin" },
  { key: "manage:company_settings", label: "Manage Company Settings", group: "Company Admin" },
  { key: "view:activity_logs", label: "View Activity Logs", group: "Company Admin" },
  { key: "view:analytics", label: "View Analytics", group: "Company Admin" },
  { key: "view:team_users", label: "View Team Users", group: "Manager" },
  { key: "view:team_activity", label: "View Team Activity", group: "Manager" },
  { key: "manage:team_chats", label: "Manage Team Chats", group: "Manager" },
  { key: "create:chat", label: "Create Chat", group: "Employee" },
  { key: "view:own_chats", label: "View Own Chats", group: "Employee" },
  { key: "manage:own_chats", label: "Manage Own Chats", group: "Employee" },
  { key: "send:messages", label: "Send Messages", group: "Employee" },
  { key: "upload:documents", label: "Upload Documents", group: "Employee" },
  { key: "view:own_profile", label: "View Own Profile", group: "Employee" },
  { key: "edit:own_profile", label: "Edit Own Profile", group: "Employee" },
];

const PERMISSION_GROUPS = ["Super Admin", "Company Admin", "Manager", "Employee"];

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${process.env.REACT_APP_API_URL}/admin/roles`, { withCredentials: true });
      setRoles(r.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch roles");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const togglePermission = (permKey) => {
    setEditingRole((prev) => {
      const has = prev.permissions.includes(permKey);
      return { ...prev, permissions: has ? prev.permissions.filter(p => p !== permKey) : [...prev.permissions, permKey] };
    });
  };

  const handleSave = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/admin/roles/${editingRole.id}/permissions`, { permissions: editingRole.permissions }, { withCredentials: true });
      toast.success("Role permissions updated!");
      setEditingRole(null);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update permissions");
    } finally { setSaving(false); }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Roles & Permissions</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">View and manage permissions for each role in your organization</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-400">Loading roles…</div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white capitalize">
                    {role.display_name || role.name.replace(/_/g, " ")}
                  </h3>
                  {role.description && <p className="text-xs text-zinc-500 mt-0.5">{role.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{role.permissions?.length || 0} permissions</span>
                  {!role.is_system ? (
                    <button onClick={() => setEditingRole({ ...role, permissions: [...(role.permissions || [])] })} className="px-3.5 py-1.5 text-xs font-semibold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-all">
                      Edit
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 text-xs text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-lg">System</span>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 flex flex-wrap gap-2">
                {role.permissions?.length > 0 ? role.permissions.map((perm) => (
                  <span key={perm} className="inline-block px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-mono">
                    {perm}
                  </span>
                )) : (
                  <span className="text-xs text-zinc-400">No permissions assigned</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingRole && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white capitalize">
                  Edit: {editingRole.display_name || editingRole.name.replace(/_/g, " ")}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">Toggle permissions on/off for this role</p>
              </div>
              <button onClick={() => setEditingRole(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white text-lg transition-colors">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {PERMISSION_GROUPS.map((group) => {
                const perms = ALL_PERMISSIONS.filter(p => p.group === group);
                return (
                  <div key={group}>
                    <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">{group}</h3>
                    <div className="space-y-2">
                      {perms.map((perm) => {
                        const checked = editingRole.permissions.includes(perm.key);
                        return (
                          <label key={perm.key} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${checked ? "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20" : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"}`}>
                            <input type="checkbox" checked={checked} onChange={() => togglePermission(perm.key)} className="w-4 h-4 accent-cyan-500 rounded" />
                            <div>
                              <p className={`text-sm font-medium ${checked ? "text-cyan-700 dark:text-cyan-300" : "text-zinc-700 dark:text-zinc-300"}`}>{perm.label}</p>
                              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{perm.key}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
              <button onClick={() => setEditingRole(null)} className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl font-medium transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-sm shadow-cyan-500/20">
                {saving ? "Saving…" : "Save Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
