import { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const LoginModal = ({ isOpen, onClose, onLogin }: LoginModalProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if ((username === 'admin1' || username === 'admin2') && password === 'admin123') {
      localStorage.setItem('adminUser', username);
      onLogin();
      onClose();
    } else {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 w-96 relative z-[10000]">
        <h2 className="text-xl font-semibold mb-4 text-[#2a63b7]">管理员登录</h2>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-600 rounded text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#2a63b7]"
              placeholder="请输入用户名"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#2a63b7]"
              placeholder="请输入密码"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#2a63b7] text-white rounded hover:bg-[#245091]"
          >
            登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 