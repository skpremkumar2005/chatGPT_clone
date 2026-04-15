import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const Settings = () => {
  const [company, setCompany] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const r = await axios.get(`${process.env.REACT_APP_API_URL}/admin/settings`, { withCredentials: true });
        setCompany(r.data.data.company);
        setSettings(r.data.data.settings);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load settings");
      } finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  const handleChange = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/admin/settings`, settings, { withCredentials: true });
      toast.success("Settings saved successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading settings…</div>;
  if (error) return <div className="p-8"><div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div></div>;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Company Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Configure platform behaviour for your organization</p>
      </div>

      {company && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Company Info</h2>
          <div className="grid grid-cols-2 gap-5 text-sm">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Name</p>
              <p className="font-semibold text-zinc-900 dark:text-white">{company.name}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Domain</p>
              <code className="text-cyan-600 dark:text-cyan-400 font-mono">{company.domain}</code>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Subscription</p>
              <span className="inline-block px-2.5 py-1 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 rounded-lg text-xs font-semibold capitalize">
                {company.subscription_tier}
              </span>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Max Users</p>
              <p className="font-semibold text-zinc-900 dark:text-white">{company.max_users}</p>
            </div>
          </div>
        </div>
      )}

      {settings && (
        <form onSubmit={handleSave} className="space-y-5">
          <SettingsCard title="Access & Authentication">
            <ToggleRow label="Allow User Self-Registration" description="Let users sign up on their own (not recommended for B2B)" value={settings.allow_user_registration} onChange={(v) => handleChange("allow_user_registration", v)} />
            <ToggleRow label="Require Email Verification" description="Users must verify their email before accessing the platform" value={settings.require_email_verification} onChange={(v) => handleChange("require_email_verification", v)} />
            <NumberRow label="Session Timeout (minutes)" description="How long before an idle session expires (0 = never)" value={settings.session_timeout} onChange={(v) => handleChange("session_timeout", v)} min={0} max={1440} />
          </SettingsCard>

          <SettingsCard title="Chat Limits">
            <NumberRow label="Max Chats per User" description="Maximum number of chat sessions a user can create (0 = unlimited)" value={settings.max_chats_per_user} onChange={(v) => handleChange("max_chats_per_user", v)} min={0} />
            <NumberRow label="Max Messages per Chat" description="Maximum messages allowed in a single chat thread (0 = unlimited)" value={settings.max_messages_per_chat} onChange={(v) => handleChange("max_messages_per_chat", v)} min={0} />
          </SettingsCard>

          <SettingsCard title="Document Upload">
            <ToggleRow label="Enable Document Upload" description="Allow users to upload documents into chats" value={settings.enable_document_upload} onChange={(v) => handleChange("enable_document_upload", v)} />
            <NumberRow label="Max Document Size (MB)" description="Maximum file size allowed per upload" value={Math.round((settings.max_document_size || 0) / (1024 * 1024))} onChange={(v) => handleChange("max_document_size", v * 1024 * 1024)} min={1} max={100} />
          </SettingsCard>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="px-8 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-sm shadow-cyan-500/20">
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const SettingsCard = ({ title, children }) => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
    <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-5">{title}</h2>
    <div className="space-y-5">{children}</div>
  </div>
);

const ToggleRow = ({ label, description, value, onChange }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${value ? "bg-cyan-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </div>
);

const NumberRow = ({ label, description, value, onChange, min = 0, max }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex-1">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
    </div>
    <input
      type="number"
      value={value ?? 0}
      min={min}
      max={max}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className="w-24 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white text-sm text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all flex-shrink-0"
    />
  </div>
);

export default Settings;
