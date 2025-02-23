import { useState, useEffect } from 'react';
import { groups } from '@/data/groups';
import { format, eachWeekOfInterval, isWeekend, addDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import AttendanceModal from '@/components/AttendanceModal';
import CalendarView from '@/components/CalendarView';
import { AttendanceStatus, STATUS_COLORS } from '@/types';
import Link from 'next/link';
import LoginModal from '@/components/LoginModal';
import AddExtraDutyModal from '@/components/AddExtraDutyModal';

const Home = () => {
  const [currentDate, setCurrentDate] = useState(new Date('2025-01-01'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    member: any;
    date: Date;
  } | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceStatus[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [scheduleOverrides, setScheduleOverrides] = useState<{[key: string]: string}>({});
  const [extraDutyMembers, setExtraDutyMembers] = useState<Array<{
    memberId: string;
    date: string;
  }>>([]);
  const [showAddExtraDutyModal, setShowAddExtraDutyModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // 从 localStorage 加载值日组更改记录
  useEffect(() => {
    const savedOverrides = localStorage.getItem('scheduleOverrides');
    if (savedOverrides) {
      setScheduleOverrides(JSON.parse(savedOverrides));
    }
  }, []);

  // 从 localStorage 加载额外值日人员记录
  useEffect(() => {
    const savedExtraMembers = localStorage.getItem('extraDutyMembers');
    if (savedExtraMembers) {
      setExtraDutyMembers(JSON.parse(savedExtraMembers));
    }
  }, []);

  // 生成2025-2027年的所有周一
  const weekStarts = eachWeekOfInterval(
    {
      start: new Date('2025-01-01'),
      end: new Date('2027-12-31')
    },
    { weekStartsOn: 1 }
  );

  // 生成值日安排，考虑覆盖的情况
  const dutySchedule = weekStarts.map((weekStart, index) => {
    const weekKey = weekStart.toISOString();
    const overrideGroupId = scheduleOverrides[weekKey];
    
    console.log('Processing week:', { 
      weekKey, 
      overrideGroupId,
      defaultGroupId: groups[index % 8]?.id,
      defaultGroupName: groups[index % 8]?.name,
      hasOverride: !!overrideGroupId
    });
    
    let group;
    if (overrideGroupId) {
      group = groups.find(g => g.id === overrideGroupId);
      if (!group) {
        console.error('Override group not found:', overrideGroupId);
        group = groups[index % 8];
      }
    } else {
      group = groups[index % 8];
    }
    
    return {
      weekStart,
      group: {
        ...group,
        id: group.id // 确保 ID 被正确传递
      }
    };
  });

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

  // 处理年份选择
  const handleYearChange = (year: string) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(parseInt(year));
    setCurrentDate(newDate);
  };

  // 处理月份选择
  const handleMonthChange = (month: string) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(parseInt(month));
    setCurrentDate(newDate);
  };

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

  // 处理日期选择（用于日历视图）
  const handleDateSelect = (date: Date) => {
    const weekSchedule = dutySchedule.find(schedule => {
      const scheduleWeekEnd = addDays(schedule.weekStart, 4);
      return date >= schedule.weekStart && date <= scheduleWeekEnd;
    });

    if (weekSchedule) {
      const member = weekSchedule.group.members[0]; // 默认选择第一个成员
      setSelectedMember({ member, date });
    }
  };

  // 处理值日组更改
  const handleUpdateSchedule = (weekStart: Date, newGroupId: string) => {
    console.log('Updating schedule:', { weekStart, newGroupId });
    const weekKey = weekStart.toISOString();
    const newOverrides = { ...scheduleOverrides, [weekKey]: newGroupId };
    console.log('New overrides:', newOverrides);
    
    // 确保新组存在
    const newGroup = groups.find(g => g.id === newGroupId);
    if (!newGroup) {
      console.error('New group not found:', newGroupId);
      return;
    }

    setScheduleOverrides(newOverrides);
    localStorage.setItem('scheduleOverrides', JSON.stringify(newOverrides));

    // 强制重新渲染
    setCurrentDate(new Date(currentDate));
  };

  // 处理添加额外值日人员
  const handleAddExtraDuty = (date: Date) => {
    setSelectedDate(date);
    setShowAddExtraDutyModal(true);
  };

  // 保存额外值日人员
  const handleSaveExtraDuty = (memberId: string) => {
    if (selectedDate) {
      console.log('Saving extra duty member:', {
        memberId,
        date: selectedDate.toISOString()
      });

      const newExtraMembers = [
        ...extraDutyMembers,
        {
          memberId,
          date: selectedDate.toISOString()
        }
      ];

      console.log('Updated extra duty members:', newExtraMembers);
      
      // 更新状态
      setExtraDutyMembers(newExtraMembers);
      
      // 保存到 localStorage
      localStorage.setItem('extraDutyMembers', JSON.stringify(newExtraMembers));
      
      // 关闭弹窗
      setShowAddExtraDutyModal(false);
      setSelectedDate(null);

      // 强制重新渲染日历
      setCurrentDate(new Date(currentDate));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-[#2a63b7]">
        值日排班表
      </h1>
      
      {/* 导航按钮 */}
      <div className="max-w-6xl mx-auto mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded ${
              viewMode === 'list'
                ? 'bg-[#2a63b7] text-white'
                : 'bg-white text-[#2a63b7] border border-[#2a63b7]'
            }`}
          >
            列表视图
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded ${
              viewMode === 'calendar'
                ? 'bg-[#2a63b7] text-white'
                : 'bg-white text-[#2a63b7] border border-[#2a63b7]'
            }`}
          >
            日历视图
          </button>
          {viewMode === 'calendar' && (
            <div className="flex gap-2 ml-4">
              <div className="relative">
                <select
                  value={currentDate.getFullYear()}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-[100px] px-3 py-2 border rounded text-gray-700 appearance-none bg-white pr-8"
                >
                  <option value="2025">2025年</option>
                  <option value="2026">2026年</option>
                  <option value="2027">2027年</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <select
                  value={currentDate.getMonth()}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-[80px] px-3 py-2 border rounded text-gray-700 appearance-none bg-white pr-8"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {i + 1}月
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
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

      {/* 视图切换 */}
      {viewMode === 'calendar' ? (
        <div className="max-w-6xl mx-auto">
          <CalendarView
            dutySchedule={dutySchedule}
            attendanceRecords={attendanceRecords}
            onSelectDate={handleDateSelect}
            isAdmin={isAdmin}
            currentDate={currentDate}
            onUpdateSchedule={isAdmin ? handleUpdateSchedule : undefined}
            extraDutyMembers={extraDutyMembers}
            onAddExtraDuty={isAdmin ? handleAddExtraDuty : undefined}
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-8">
          {dutySchedule.map(({ weekStart, group }) => {
            const weekDays = Array.from({ length: 5 }, (_, i) => 
              addDays(weekStart, i)
            ).filter(date => !isWeekend(date));

            return (
              <div 
                key={weekStart.toISOString()} 
                className="border rounded-lg p-4 bg-white"
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

                <div className="space-y-4">
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
      )}

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

      {/* 添加额外值日人员弹窗 */}
      {selectedDate && (
        <AddExtraDutyModal
          isOpen={showAddExtraDutyModal}
          onClose={() => setShowAddExtraDutyModal(false)}
          onSave={handleSaveExtraDuty}
          date={selectedDate}
        />
      )}
    </div>
  );
};

export default Home; 