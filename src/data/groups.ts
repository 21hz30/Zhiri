import { Group } from '@/types';

const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const groups: Group[] = GROUP_NAMES.map((name, i) => ({
  id: `group-${i + 1}`,
  name: `${name}组`,
  members: Array.from({ length: 3 }, (_, j) => ({
    id: `member-${i}-${j}`,
    name: `${name}${j + 1}号`,
    groupId: `group-${i + 1}`
  }))
})); 