import React from "react";
import { useSelector } from "react-redux";
import {
  XMarkIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

const ProfileSettings = ({ onClose }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
          {/* Profile Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Profile
            </h3>

            <div className="flex items-center gap-4 p-4 bg-black rounded-lg border border-zinc-800">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-lg font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-zinc-500">{user?.email}</p>
              </div>
              <button className="px-3 py-1.5 text-xs font-medium text-white bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors">
                Edit
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Notifications
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-zinc-800">
                <div className="flex items-center gap-3">
                  <BellIcon className="w-5 h-5 text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Email notifications
                    </p>
                    <p className="text-xs text-zinc-500">
                      Receive updates via email
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Privacy & Security
            </h3>

            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-4 bg-black hover:bg-zinc-950 rounded-lg border border-zinc-800 transition-colors text-left">
                <ShieldCheckIcon className="w-5 h-5 text-zinc-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Data privacy</p>
                  <p className="text-xs text-zinc-500">
                    Manage your data preferences
                  </p>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-4 bg-black hover:bg-zinc-950 rounded-lg border border-zinc-800 transition-colors text-left">
                <GlobeAltIcon className="w-5 h-5 text-zinc-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Language</p>
                  <p className="text-xs text-zinc-500">English (US)</p>
                </div>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
              Account
            </h3>

            <div className="space-y-2">
              <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                Download your data
              </button>
              <br />
              <button className="text-sm text-red-400 hover:text-red-300 transition-colors">
                Delete account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
