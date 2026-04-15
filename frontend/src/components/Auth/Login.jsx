import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../redux/slices/authSlice";
import ThemeToggle from "../UI/ThemeToggle";
import useTheme from "../../hooks/useTheme";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useTheme(); // initialize theme on public pages too

  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password, company_domain: companyDomain }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-50 via-white to-cyan-50/30 dark:from-black dark:via-zinc-950 dark:to-black relative">
      {/* Theme toggle top-right */}
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/25 mb-4">
            <span className="text-white text-base font-bold">EA</span>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">Welcome back</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Sign in to your workspace</p>
        </div>

        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-zinc-100 dark:shadow-none p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-200 dark:border-red-500/20">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Company ID
              </label>
              <input
                type="text"
                value={companyDomain}
                onChange={(e) => setCompanyDomain(e.target.value)}
                placeholder="techcorp"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all text-sm"
                required
              />
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Your company identifier</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 text-white font-semibold rounded-xl transition-all duration-200 text-sm shadow-md shadow-cyan-500/20 mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-400 dark:text-zinc-500 text-sm mt-6">
          Don't have a company account?{" "}
          <Link to="/register" className="text-cyan-500 hover:text-cyan-400 font-medium transition-colors">
            Register your company
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
