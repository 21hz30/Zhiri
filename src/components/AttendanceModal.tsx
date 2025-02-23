import { useState } from 'react';
import { Member, AttendanceStatus, STATUS_COLORS } from '@/types';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  date: Date;
  currentStatus?: AttendanceStatus;
  onSave: (status: Partial<AttendanceStatus>) => void;
}

const AttendanceModal = ({
  isOpen,
  onClose,
  member,
  date,
  currentStatus,
  onSave,
}: AttendanceModalProps) => {
  const [status, setStatus] = useState<'present' | 'absent' | 'late' | 'pending'>(
    currentStatus?.status || 'pending'
  );
  const [score, setScore] = useState(currentStatus?.score || 5);
  const [comment, setComment] = useState(currentStatus?.comment || '');
  const [penaltyDays, setPenaltyDays] = useState(currentStatus?.penaltyDays || 0);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave({
      memberId: member.id,
      date: date.toISOString(),
      status,
      score,
      comment,
      penaltyDays
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 w-[480px] relative z-[10000]">
        <h2 className="text-xl font-semibold mb-4 text-[#2a63b7]">考勤评分</h2>
        
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">值日人员</div>
            <div className="font-medium">{member.name}</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">考勤状态</div>
            <div className="grid grid-cols-4 gap-2">
              {(['present', 'absent', 'late', 'pending'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`p-2 rounded transition-colors ${
                    status === s 
                      ? 'ring-2 ring-[#2a63b7] bg-[#2a63b7] text-white' 
                      : 'border hover:bg-gray-50'
                  }`}
                >
                  {s === 'present' ? '已到' : 
                   s === 'absent' ? '缺席' : 
                   s === 'late' ? '迟到' : '待定'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">评分 (1-10分)</div>
            <input
              type="number"
              min="1"
              max="10"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#2a63b7]"
            />
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">惩罚值日天数</div>
            <input
              type="number"
              min="0"
              value={penaltyDays}
              onChange={(e) => setPenaltyDays(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-[#2a63b7]"
            />
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">备注</div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border rounded px-3 py-2 h-20 focus:outline-none focus:border-[#2a63b7]"
              placeholder="请输入备注信息"
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
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal; 