import { useState, useMemo, useEffect } from 'react';
import { groups } from '@/data/groups';
import { AttendanceStatus, STATUS_COLORS } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/router';
import RecordDetailModal from '@/components/RecordDetailModal';

const StatisticsPage = () => {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceStatus[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedMemberRecords, setSelectedMemberRecords] = useState<{
    records: AttendanceStatus[];
    memberName: string;
  } | null>(null);

  // 计算统计数据
  const statistics = useMemo(() => {
    const stats = groups.flatMap(group => 
      group.members.map(member => {
        const memberRecords = attendanceRecords.filter(r => r.memberId === member.id);
        
        return {
          id: member.id,
          name: member.name,
          groupName: group.name,
          totalPenaltyDays: memberRecords.reduce((sum, r) => sum + (r.penaltyDays || 0), 0),
          averageScore: memberRecords.length 
            ? (memberRecords.reduce((sum, r) => sum + r.score, 0) / memberRecords.length).toFixed(1)
            : '-',
          attendanceCount: {
            present: memberRecords.filter(r => r.status === 'present').length,
            absent: memberRecords.filter(r => r.status === 'absent').length,
            late: memberRecords.filter(r => r.status === 'late').length,
          },
          records: memberRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
      })
    );

    if (selectedGroup === 'all') return stats;
    return stats.filter(s => s.groupName === selectedGroup);
  }, [attendanceRecords, selectedGroup]);

  // 检查登录状态和加载考勤记录
  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      router.push('/');
    } else {
      setIsAdmin(true);
      // 加载考勤记录
      const savedRecords = localStorage.getItem('attendanceRecords');
      if (savedRecords) {
        setAttendanceRecords(JSON.parse(savedRecords));
      }
    }
  }, [router]);

  if (!isAdmin) {
    return <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
      <div className="text-gray-600">加载中...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#2a63b7]">值日考核统计</h1>
          <Link 
            href="/"
            className="px-4 py-2 bg-[#2a63b7] text-white rounded hover:bg-[#245091]"
          >
            返回排班表
          </Link>
        </div>

        {/* 筛选器 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">选择组别：</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="border rounded px-3 py-1.5"
            >
              <option value="all">全部组别</option>
              {groups.map(group => (
                <option key={group.id} value={group.name}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 统计表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">组别</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">成员</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">平均分</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">出勤情况</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">惩罚天数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">详细记录</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {statistics.map((stat) => (
                <tr key={stat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{stat.groupName}</td>
                  <td className="px-4 py-3">{stat.name}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${
                      Number(stat.averageScore) >= 8 ? 'text-[#00bd39]' :
                      Number(stat.averageScore) >= 6 ? 'text-[#ffa500]' :
                      'text-[#ff2300]'
                    }`}>
                      {stat.averageScore}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1" title="已到">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS.present }}></span>
                        <span className="text-sm">{stat.attendanceCount.present}</span>
                      </div>
                      <div className="flex items-center gap-1" title="迟到">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS.late }}></span>
                        <span className="text-sm">{stat.attendanceCount.late}</span>
                      </div>
                      <div className="flex items-center gap-1" title="缺席">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS.absent }}></span>
                        <span className="text-sm">{stat.attendanceCount.absent}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {stat.totalPenaltyDays > 0 && (
                      <span className="text-[#ff2300] font-medium">
                        +{stat.totalPenaltyDays}天
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => setSelectedMemberRecords({
                        records: stat.records,
                        memberName: stat.name
                      })}
                      className="text-[#2a63b7] hover:underline text-sm"
                    >
                      查看记录
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 详细记录弹窗 */}
      {selectedMemberRecords && (
        <RecordDetailModal
          isOpen={true}
          onClose={() => setSelectedMemberRecords(null)}
          records={selectedMemberRecords.records}
          memberName={selectedMemberRecords.memberName}
        />
      )}
    </div>
  );
};

export default StatisticsPage; 