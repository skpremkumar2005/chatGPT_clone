import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loadUser } from "../../redux/slices/authSlice";
import axios from "axios";
import toast from "react-hot-toast";
import { XMarkIcon, UserCircleIcon, LockClosedIcon } from "@heroicons/react/24/outline";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

const inputCls = "w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white text-sm placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all";
const labelCls = "block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5";

const ProfileSettings = ({ onClose }) => {
  const dispatch = useDispatch();
  const { user, role_name } = useSelector((state) => state.auth);
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    department: user?.department || "",
    position: user?.position || "",
  });

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await axios.put(`${API_URL}/auth/me`, {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        department: profile.department.trim(),
        position: profile.position.trim(),
      }, { withCredentials: true });
      await dispatch(loadUser());
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) { toast.error("Passwords do not match"); return; }
    if (passwords.new_password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSaving(true);
    try {
      await axios.post(`${API_URL}/auth/change-password`, {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      }, { withCredentials: true });
      toast.success("Password changed");
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const tabBtn = (id, Icon, label) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
        tab === id
          ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
          : "border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Account Settings</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Avatar strip */}
        <div className="flex items-center gap-4 px-6 py-4 bg-zinc-50 dark:bg-black/30 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0 shadow-lg shadow-cyan-500/20">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-zinc-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-full border border-cyan-200 dark:border-cyan-500/20 uppercase tracking-wide">
              {role_name}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-800">
          {tabBtn("profile", UserCircleIcon, "Profile")}
          {tabBtn("password", LockClosedIcon, "Password")}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {tab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
                  <input type="text" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Email</label>
                  <input type="email" value={user?.email || ""} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
                  <p className="text-[11px] text-zinc-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="tel" value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+1 234 567 8900" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Department</label>
                  <input type="text" value={profile.department} onChange={(e) => setProfile(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Engineering" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Position / Title</label>
                  <input type="text" value={profile.position} onChange={(e) => setProfile(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Senior Developer" className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:text-zinc-400 text-white rounded-xl transition-all shadow-md shadow-cyan-500/20">
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {tab === "password" && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className={labelCls}>Current Password</label>
                <input type="password" value={passwords.current_password} onChange={(e) => setPasswords(p => ({ ...p, current_password: e.target.value }))} placeholder="Enter current password" autoComplete="current-password" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>New Password</label>
                <input type="password" value={passwords.new_password} onChange={(e) => setPasswords(p => ({ ...p, new_password: e.target.value }))} placeholder="Min. 6 characters" autoComplete="new-password" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirm_password}
                  onChange={(e) => setPasswords(p => ({ ...p, confirm_password: e.target.value }))}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  className={`${inputCls} ${passwords.confirm_password && passwords.new_password !== passwords.confirm_password ? "!border-red-400 dark:!border-red-500/60" : ""}`}
                />
                {passwords.confirm_password && passwords.new_password !== passwords.confirm_password && (
                  <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-200 dark:disabled:bg-zinc-700 disabled:text-zinc-400 text-white rounded-xl transition-all shadow-md shadow-cyan-500/20">
                  {saving ? "Saving…" : "Change Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
