import { AttendanceStatus, STATUS_COLORS } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceStatus[];
  memberName: string;
}

const RecordDetailModal = ({
  isOpen,
  onClose,
  records,
  memberName,
}: RecordDetailModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {memberName} 的值日记录
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {records.map(record => (
            <div 
              key={record.id}
              className="border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-600">
                  {format(new Date(record.date), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[record.status] }}
                  />
                  <span>
                    {record.status === 'present' ? '已到' :
                     record.status === 'absent' ? '缺席' :
                     record.status === 'late' ? '迟到' : '待定'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <span className="text-sm text-gray-600">评分：</span>
                  <span className={`font-medium ${
                    record.score >= 8 ? 'text-[#00bd39]' :
                    record.score >= 6 ? 'text-[#ffa500]' :
                    'text-[#ff2300]'
                  }`}>
                    {record.score}分
                  </span>
                </div>
                {record.penaltyDays ? (
                  <div>
                    <span className="text-sm text-gray-600">惩罚天数：</span>
                    <span className="text-[#ff2300] font-medium">
                      +{record.penaltyDays}天
                    </span>
                  </div>
                ) : null}
              </div>

              {record.comment && (
                <div className="text-sm text-gray-600 mt-2">
                  <div className="font-medium mb-1">备注：</div>
                  <div className="bg-gray-50 p-2 rounded">
                    {record.comment}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecordDetailModal; 