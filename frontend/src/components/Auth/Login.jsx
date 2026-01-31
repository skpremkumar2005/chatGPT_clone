import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../redux/slices/authSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/"); // Redirect to chat if already logged in
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password, company_domain: companyDomain }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold text-center text-white mb-6 tracking-tight">
          Sign In
        </h2>
        <form onSubmit={handleSubmit}>
          {error && (
            <p className="text-red-400 text-sm text-center mb-4 bg-red-500/10 p-3 rounded border border-red-500/20">
              {error}
            </p>
          )}

          <div className="mb-4">
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Company ID
            </label>
            <input
              type="text"
              value={companyDomain}
              onChange={(e) => setCompanyDomain(e.target.value)}
              placeholder="techcorp"
              className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
              required
            />
            <p className="text-xs text-zinc-600 mt-1">
              Your company identifier
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com"
              className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-cyan-500 hover:bg-cyan-600 rounded text-black font-semibold transition-colors duration-200 disabled:bg-zinc-800 disabled:text-zinc-600"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800">
          <p className="text-center text-zinc-500 text-sm">
            Don't have a company account?{" "}
            <Link
              to="/register"
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Register your company
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
