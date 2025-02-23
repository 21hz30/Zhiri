import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, startOfWeek as getWeekStart, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { AttendanceStatus, STATUS_COLORS } from '@/types';
import { groups } from '@/data/groups';
import { useState } from 'react';

const locales = {
  'zh-CN': zhCN,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarViewProps {
  dutySchedule: Array<{
    weekStart: Date;
    group: {
      id: string;
      name: string;
      members: Array<{
        id: string;
        name: string;
      }>;
    };
  }>;
  attendanceRecords: AttendanceStatus[];
  onSelectDate?: (date: Date) => void;
  isAdmin: boolean;
  currentDate: Date;
  onUpdateSchedule?: (weekStart: Date, newGroupId: string) => void;
  extraDutyMembers?: { memberId: string; date: string }[];
  onAddExtraDuty?: (date: Date) => void;
}

// 确认弹窗组件
const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentGroup, 
  newGroup,
  weekStart 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  currentGroup: string;
  newGroup: string;
  weekStart: Date;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-6 w-[400px] relative z-[10000]">
        <h2 className="text-xl font-semibold mb-4 text-[#2a63b7]">确认修改值日组</h2>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">修改周次</div>
            <div className="font-medium">
              {format(weekStart, 'yyyy年MM月dd日', { locale: zhCN })} - 
              {format(addDays(weekStart, 4), 'MM月dd日', { locale: zhCN })}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">当前值日组</div>
            <div className="font-medium">{currentGroup}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">更改为</div>
            <div className="font-medium text-[#2a63b7]">{newGroup}</div>
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
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-[#2a63b7] text-white rounded hover:bg-[#245091]"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

// 自定义事件组件
const CustomEvent = ({ 
  event, 
  isAdmin, 
  onUpdateSchedule,
  extraDutyMembers,
  onAddExtraDuty 
}: { 
  event: any; 
  isAdmin: boolean; 
  onUpdateSchedule?: (weekStart: Date, newGroupId: string) => void;
  extraDutyMembers?: { memberId: string; date: string }[];
  onAddExtraDuty?: (date: Date) => void;
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // 获取当前日期的额外值日人员
  const currentDateExtraMembers = extraDutyMembers?.filter(
    m => {
      const isSameDate = m.date === event.start.toISOString();
      console.log('Checking extra duty member:', {
        memberDate: m.date,
        eventDate: event.start.toISOString(),
        isSameDate
      });
      return isSameDate;
    }
  ) || [];

  // 获取额外值日人员的详细信息
  const extraMemberDetails = currentDateExtraMembers.map(em => {
    const memberGroup = groups.find(g => 
      g.members.some(m => m.id === em.memberId)
    );
    const member = memberGroup?.members.find(m => m.id === em.memberId);
    console.log('Extra duty member details:', {
      memberId: em.memberId,
      foundMember: member,
      foundGroup: memberGroup
    });
    return {
      member,
      group: memberGroup
    };
  });

  // 添加调试日志
  console.log('Rendering event:', {
    date: event.start,
    extraMembers: currentDateExtraMembers,
    extraMemberDetails
  });

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newGroupId = e.target.value;
    console.log('Selected group:', newGroupId);
    setSelectedGroupId(newGroupId);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (onUpdateSchedule && selectedGroupId) {
      // 获取周一的日期
      const date = new Date(event.start);
      const dayOfWeek = date.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(date);
      monday.setDate(date.getDate() + diff);
      monday.setHours(0, 0, 0, 0);

      console.log('Confirming group change:', {
        originalDate: event.start,
        monday,
        selectedGroupId
      });
      
      onUpdateSchedule(monday, selectedGroupId);
    }
  };

  const handleMemberClick = (e: React.MouseEvent, member: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdmin && event.onSelectDate) {
      event.onSelectDate(new Date(event.start), member);
    }
  };

  return (
    <>
      <div 
        className="p-2 overflow-y-auto h-full bg-white text-gray-800" 
        style={{ maxHeight: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-bold text-base mb-2 border-b border-gray-200 pb-1 sticky top-0 bg-white z-10 text-[#2a63b7] flex items-center justify-between">
          {isAdmin ? (
            <select
              value={event.group.id}
              onChange={handleGroupChange}
              onClick={(e) => e.stopPropagation()}
              className="border border-gray-200 rounded px-2 py-1 text-sm font-normal focus:outline-none focus:border-[#2a63b7] w-full"
            >
              {groups.map((group, index) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          ) : (
            <span>{event.group.name}</span>
          )}
        </div>

        {/* 原有值日组成员 */}
        <div className="space-y-1.5">
          {event.records.map((record: any) => (
            <div 
              key={record.member.id} 
              className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
              onClick={(e) => handleMemberClick(e, record.member)}
            >
              <span className="font-medium whitespace-nowrap">{record.member.name}</span>
              <span className="flex items-center gap-1 ml-2">
                <span className="text-base">
                  {record.status === 'present' ? '✅' :
                   record.status === 'absent' ? '❌' :
                   record.status === 'late' ? '⚠️' : ''}
                </span>
                {record.penaltyDays ? (
                  <span className="text-xs bg-red-500 text-white px-1 rounded whitespace-nowrap">
                    +{record.penaltyDays}
                  </span>
                ) : null}
              </span>
            </div>
          ))}
        </div>

        {/* 额外值日人员 */}
        {extraMemberDetails.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">额外值日人员</div>
            <div className="space-y-1">
              {extraMemberDetails.map(({ member, group }) => (
                member && (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between text-sm p-2 rounded bg-blue-50 hover:bg-blue-100"
                    onClick={(e) => handleMemberClick(e, member)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-[#2a63b7] text-white rounded">
                        {group?.name}
                      </span>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* 添加额外值日人员按钮 */}
        {isAdmin && onAddExtraDuty && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddExtraDuty(new Date(event.start));
            }}
            className="mt-3 w-full text-sm bg-[#2a63b7] text-white py-2 px-4 rounded-md hover:bg-[#245091] flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加额外值日人员
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        currentGroup={event.group.name}
        newGroup={groups.find(g => g.id === selectedGroupId)?.name || ''}
        weekStart={new Date(event.start)}
      />
    </>
  );
};

const CalendarView = ({
  dutySchedule,
  attendanceRecords,
  onSelectDate,
  isAdmin,
  currentDate,
  onUpdateSchedule,
  extraDutyMembers,
  onAddExtraDuty,
}: CalendarViewProps) => {
  // 获取当前月份的开始和结束日期
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // 将值日安排转换为日历事件格式
  const events = dutySchedule.flatMap(({ weekStart, group }) => {
    // 生成这一周的工作日
    const weekEvents = [];
    for (let i = 0; i < 5; i++) {
      const currentDay = new Date(weekStart);
      currentDay.setDate(currentDay.getDate() + i);
      
      // 只显示当前选择月份的事件
      if (currentDay < monthStart || currentDay > monthEnd) {
        continue;
      }
      
      // 获取当天的考勤记录
      const dayRecords = group.members.map(member => {
        const record = attendanceRecords.find(
          r => r.memberId === member.id && r.date === currentDay.toISOString()
        );
        return {
          member,
          status: record?.status || 'pending',
          score: record?.score,
          penaltyDays: record?.penaltyDays,
        };
      });

      weekEvents.push({
        id: `${currentDay.toISOString()}-${group.id}`,
        title: `${group.name}`,
        start: currentDay,
        end: currentDay,
        group,
        records: dayRecords,
      });
    }
    return weekEvents;
  });

  // 自定义事件渲染样式
  const eventStyleGetter = (event: any) => {
    const style = {
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '4px',
      height: '100%',
      minHeight: '180px',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    };
    return { style };
  };

  return (
    <div className="h-[1000px] bg-white rounded-lg shadow p-4">
      <style jsx global>{`
        .rbc-calendar {
          min-height: 900px;
        }
        .rbc-month-view {
          flex: 1;
        }
        .rbc-month-row {
          min-height: 180px !important;
        }
        .rbc-row-content {
          height: 100%;
        }
        .rbc-event {
          padding: 0 !important;
        }
        /* 隐藏事件图标 */
        .rbc-event-content:before {
          display: none !important;
        }
        .rbc-event-label {
          display: none !important;
        }
        /* 修改事件样式 */
        .rbc-event {
          background-color: white !important;
          color: #374151 !important;
        }
        .rbc-event.rbc-selected {
          background-color: #f3f4f6 !important;
        }
        .rbc-day-bg.rbc-today {
          background-color: #f3f4f6 !important;
        }
        /* 下拉框样式 */
        select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
        }
      `}</style>
      <Calendar
        localizer={localizer}
        events={events.map(event => ({
          ...event,
          onSelectDate: (date: Date, member: any) => {
            if (isAdmin && onSelectDate) {
              onSelectDate(date);
            }
          }
        }))}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        views={['month']}
        defaultView="month"
        date={currentDate}
        onNavigate={(date: Date) => {}}
        selectable={true}
        onSelectSlot={(slotInfo: { start: Date }) => {
          if (isAdmin && onAddExtraDuty) {
            onAddExtraDuty(slotInfo.start);
          }
        }}
        components={{
          event: (props: any) => (
            <CustomEvent
              {...props}
              event={props.event}
              isAdmin={isAdmin}
              onUpdateSchedule={onUpdateSchedule}
              extraDutyMembers={extraDutyMembers}
              onAddExtraDuty={onAddExtraDuty}
            />
          ),
        }}
        messages={{
          today: '今天',
          previous: '上个月',
          next: '下个月',
          month: '月',
          week: '周',
          day: '日',
          agenda: '议程',
        }}
        formats={{
          monthHeaderFormat: (date: Date) => format(date, 'yyyy年MM月', { locale: zhCN }),
          dayHeaderFormat: (date: Date) => format(date, 'yyyy年MM月dd日', { locale: zhCN }),
          dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, 'yyyy年MM月dd日', { locale: zhCN })} - ${format(
              end,
              'yyyy年MM月dd日',
              { locale: zhCN }
            )}`,
        }}
      />
    </div>
  );
};

export default CalendarView; 