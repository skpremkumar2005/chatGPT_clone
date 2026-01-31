import React from "react";
import { Link } from "react-router-dom";

const Register = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-cyan-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Company Registration
          </h2>
          <p className="text-zinc-400 text-sm">
            Enterprise multi-tenant platform
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            <span className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></span>
            Public Registration Disabled
          </h3>
          <p className="text-zinc-400 text-sm mb-4">
            Individual user registration is not available. This is a B2B
            enterprise platform where companies register and manage their
            employees.
          </p>

          <div className="space-y-3">
            <div className="border-l-2 border-cyan-500 pl-4">
              <h4 className="text-white text-sm font-medium mb-1">
                For Companies:
              </h4>
              <p className="text-zinc-500 text-xs">
                Register your organization to get started with employee
                management, role-based access control, and activity monitoring.
              </p>
            </div>

            <div className="border-l-2 border-zinc-700 pl-4">
              <h4 className="text-white text-sm font-medium mb-1">
                For Employees:
              </h4>
              <p className="text-zinc-500 text-xs">
                Contact your company administrator to create an account for you.
                They will provide your credentials.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-block w-full p-3 bg-cyan-500 hover:bg-cyan-600 rounded text-black font-semibold transition-colors duration-200"
          >
            Back to Login
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800">
          <p className="text-center text-zinc-500 text-xs">
            Need to register a company?{" "}
            <a
              href="mailto:support@example.com"
              className="text-cyan-400 hover:text-cyan-300"
            >
              Contact Sales
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
