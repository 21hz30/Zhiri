import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { groups } from '@/data/groups';

interface AddExtraDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberId: string) => void;
  date: Date;
}

const AddExtraDutyModal = ({ isOpen, onClose, onSave, date }: AddExtraDutyModalProps) => {
  const [selectedGroup, setSelectedGroup] = useState(groups[0].id);
  const [selectedMember, setSelectedMember] = useState('');

  if (!isOpen) return null;

  const currentGroup = groups.find(g => g.id === selectedGroup);

  const handleSave = () => {
    if (selectedMember) {
      onSave(selectedMember);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 w-[400px] relative z-[10000]">
        <h2 className="text-xl font-semibold mb-4 text-[#2a63b7]">添加额外值日人员</h2>
        
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">值日日期</div>
            <div className="font-medium">
              {format(date, 'yyyy年MM月dd日', { locale: zhCN })}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">选择组别</div>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setSelectedMember('');
              }}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#2a63b7]"
            >
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">选择成员</div>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#2a63b7]"
            >
              <option value="">请选择成员</option>
              {currentGroup?.members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
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
            onClick={handleSave}
            disabled={!selectedMember}
            className="px-4 py-2 bg-[#2a63b7] text-white rounded hover:bg-[#245091] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExtraDutyModal; 