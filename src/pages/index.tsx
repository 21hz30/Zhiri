import { useState, useEffect } from 'react';
import { groups } from '@/data/groups';
import { format, eachWeekOfInterval, isWeekend, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import AttendanceModal from '@/components/AttendanceModal';
import { AttendanceStatus, STATUS_COLORS } from '@/types';
import Link from 'next/link';
import LoginModal from '@/components/LoginModal';

const Home = () => {
  const [currentDate] = useState(new Date('2025-01-01'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    member: any;
    date: Date;
  } | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceStatus[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // 生成2025年的所有周一
  const weekStarts = eachWeekOfInterval(
    {
      start: currentDate,
      end: new Date('2025-12-31')
    },
    { weekStartsOn: 1 }
  );

  // 生成值日安排
  const dutySchedule = weekStarts.map((weekStart, index) => ({
    weekStart,
    group: groups[index % 8]
  }));

  // 从 localStorage 加载考勤记录
  useEffect(() => {
    const savedRecords = localStorage.getItem('attendanceRecords');
    if (savedRecords) {
      setAttendanceRecords(JSON.parse(savedRecords));
    }
  }, []);

  // 检查登录状态
  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      setIsAdmin(true);
    }
  }, []);

  // 修改 handleAttendanceSave 函数
  const handleAttendanceSave = (status: Partial<AttendanceStatus>) => {
    setAttendanceRecords(prev => {
      const existingIndex = prev.findIndex(
        r => r.memberId === status.memberId && r.date === status.date
      );
      
      let newRecords;
      if (existingIndex >= 0) {
        newRecords = [...prev];
        newRecords[existingIndex] = { ...newRecords[existingIndex], ...status } as AttendanceStatus;
      } else {
        newRecords = [...prev, { id: Date.now().toString(), ...status } as AttendanceStatus];
      }
      
      // 保存到 localStorage
      localStorage.setItem('attendanceRecords', JSON.stringify(newRecords));
      return newRecords;
    });
  };

  const getAttendanceStatus = (memberId: string, date: Date) => {
    return attendanceRecords.find(
      r => r.memberId === memberId && r.date === date.toISOString()
    );
  };

  // 处理登出
  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('adminUser');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-[#2a63b7]">
        值日排班表
      </h1>
      
      {/* 导航按钮 */}
      <div className="max-w-6xl mx-auto mb-4 flex justify-end gap-2">
        <Link
          href="/statistics"
          className="px-4 py-2 bg-[#2a63b7] text-white rounded hover:bg-[#245091]"
        >
          考核统计
        </Link>
        <button
          onClick={() => isAdmin ? handleLogout() : setShowLoginModal(true)}
          className={`px-4 py-2 rounded ${
            isAdmin ? 'bg-[#ff2300] text-white' : 'bg-[#2a63b7] text-white'
          }`}
        >
          {isAdmin ? '退出管理' : '管理员登录'}
        </button>
      </div>
      
      {/* 组别说明 */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-[#2a63b7]">值日组成员</h2>
          <div className="grid grid-cols-4 gap-4">
            {groups.map(group => (
              <div key={group.id} className="border rounded-lg p-3">
                <div className="font-medium mb-2">{group.name}</div>
                <div className="space-y-1">
                  {group.members.map(member => (
                    <div key={member.id} className="text-sm text-gray-600">
                      {member.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 排班表 */}
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="space-y-8">
          {dutySchedule.map(({ weekStart, group }) => {
            const weekDays = Array.from({ length: 5 }, (_, i) => 
              addDays(weekStart, i)
            ).filter(date => !isWeekend(date));

            return (
              <div 
                key={weekStart.toISOString()} 
                className="border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {format(weekStart, 'yyyy年MM月dd日', { locale: zhCN })} - 
                    {format(addDays(weekStart, 4), 'MM月dd日', { locale: zhCN })}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#2a63b7]">本周值日组:</span>
                    <span className="px-4 py-1.5 bg-[#2a63b7] text-white rounded-full font-medium">
                      {group.name}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  {weekDays.map((date) => (
                    <div 
                      key={date.toISOString()}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="text-center mb-3">
                        <div className="text-sm text-gray-600">
                          {format(date, 'MM月dd日', { locale: zhCN })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {format(date, 'EEEE', { locale: zhCN })}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {group.members.map((member) => {
                          const attendance = getAttendanceStatus(member.id, date);
                          
                          return (
                            <div 
                              key={member.id}
                              onClick={() => isAdmin && setSelectedMember({ member, date })}
                              className={`flex items-center justify-between bg-white p-2 rounded shadow-sm ${
                                isAdmin ? 'cursor-pointer hover:bg-gray-50' : ''
                              }`}
                            >
                              <span className="text-sm">{member.name}</span>
                              <div className="flex items-center gap-2">
                                {attendance?.penaltyDays ? (
                                  <span className="text-xs text-[#ff2300]">
                                    +{attendance.penaltyDays}天
                                  </span>
                                ) : null}
                                <span 
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: attendance 
                                      ? STATUS_COLORS[attendance.status]
                                      : STATUS_COLORS.pending
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 考勤评分弹窗 */}
      {selectedMember && (
        <AttendanceModal
          isOpen={true}
          onClose={() => setSelectedMember(null)}
          member={selectedMember.member}
          date={selectedMember.date}
          currentStatus={getAttendanceStatus(
            selectedMember.member.id,
            selectedMember.date
          )}
          onSave={handleAttendanceSave}
        />
      )}

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => setIsAdmin(true)}
      />
    </div>
  );
};

export default Home; 