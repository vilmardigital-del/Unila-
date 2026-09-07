import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface LoginModalProps {
  onLogin: (role: 'admin' | 'user') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (password === '2645') {
      onLogin('admin');
    } else if (password === '4526') {
      onLogin('user');
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-purple-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-purple-900 text-center space-y-6">
        <div className="w-20 h-20 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-purple-950">Acesso ao Sistema</h2>
          <p className="text-gray-600 text-sm mt-2">Digite sua senha para acessar.</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Senha"
          className={`w-full p-4 border-2 rounded-xl text-center text-xl font-mono ${
            error ? 'border-red-500' : 'border-purple-200'
          }`}
        />
        {error && <p className="text-red-500 font-bold text-sm">Senha incorreta!</p>}
        <button
          onClick={handleLogin}
          className="w-full py-4 bg-purple-900 text-white font-bold rounded-xl hover:bg-purple-800 transition-all"
        >
          Entrar
        </button>
      </div>
    </div>
  );
};
