import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../redux/slices/authSlice';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.auth);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(registerUser({ name, email, password }));
    if (registerUser.fulfilled.match(resultAction)) {
      setRegistrationSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="p-8 bg-gray-800 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold text-center text-white mb-6">Register</h2>
        {registrationSuccess ? (
          <div className="text-green-400 text-center">
            <p>Registration successful!</p>
            <p>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="mb-4">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className="w-full p-3 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full p-3 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-6">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full p-3 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full p-3 bg-blue-600 rounded text-white font-bold hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-500">
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
        <p className="text-center text-gray-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

// --- MAKE SURE THIS LINE EXISTS ---
export default Register;