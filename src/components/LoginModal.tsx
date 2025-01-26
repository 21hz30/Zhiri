import { useState } from 'react';
import { ADMIN_USERS } from '@/config/admin';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证用户名和密码
    if (username in ADMIN_USERS && ADMIN_USERS[username as keyof typeof ADMIN_USERS] === password) {
      setError('');
      onLogin();
      onClose();
      // 保存登录状态到 localStorage
      localStorage.setItem('adminUser', username);
    } else {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">管理员登录</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="请输入用户名"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <div className="text-[#ff2300] text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2a63b7] text-white rounded hover:bg-[#245091]"
            >
              登录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal; 