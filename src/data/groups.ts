import { Group } from '@/types';

// 定义人员数据
const MEMBERS_DATA = [
  { name: '赵云', group: 1 },
  { name: '周比蒙', group: 1 },
  { name: '陈子盈', group: 1 },
  { name: '邱力之', group: 2 },
  { name: '洪声浩', group: 2 },
  { name: '甘倍结', group: 2 },
  { name: '王建', group: 3 },
  { name: '谢贝俊', group: 3 },
  { name: '夏多迪', group: 3 },
  { name: '徐南方', group: 4 },
  { name: '依雪融', group: 4 },
  { name: '赵鸿威', group: 4 },
  { name: '陈上', group: 5 },
  { name: '朱语歆', group: 5 },
  { name: '杨梅', group: 5 },
  { name: '蔡红美', group: 6 },
  { name: '崔邵程', group: 6 },
  { name: '周知街', group: 6 },
  { name: '周维杰', group: 7 },
  { name: '南陈住和', group: 7 },
  { name: '黄宇', group: 7 },
  { name: '刘完蓉', group: 8 },
  { name: '徐右轻', group: 8 },
  { name: '张浩言', group: 8 }
];

// 生成组别数据
export const groups: Group[] = Array.from({ length: 8 }, (_, i) => {
  const groupNumber = i + 1;
  const groupMembers = MEMBERS_DATA.filter(m => m.group === groupNumber);
  
  return {
    id: `group-${groupNumber}`,
    name: `小组${groupNumber}`,
    members: groupMembers.map((member, j) => ({
      id: `member-${groupNumber}-${j}`,
      name: member.name,
      groupId: `group-${groupNumber}`
    }))
  };
}); 