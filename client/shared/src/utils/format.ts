// 格式化工具函数

import { formatDistanceToNow, format } from 'date-fns';
import zhCN from 'date-fns/locale/zh-CN';

/**
 * 格式化时间为相对时间
 * @param date 日期字符串或 Date 对象
 * @returns 相对时间字符串，如 "5分钟前"
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: zhCN,
    });
  } catch {
    return '';
  }
}

/**
 * 格式化聊天时间显示
 * @param date 日期字符串或 Date 对象
 * @returns 格式化的时间字符串
 */
export function formatChatTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // 今天，显示时间
      return format(dateObj, 'HH:mm');
    } else if (diffDays === 1) {
      // 昨天
      return '昨天';
    } else if (diffDays < 7) {
      // 一周内，显示星期
      return format(dateObj, 'EEE', { locale: zhCN });
    } else {
      // 更早，显示日期
      return format(dateObj, 'MM/dd');
    }
  } catch {
    return '';
  }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的文件大小，如 "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 格式化用户名显示
 * @param nickname 昵称
 * @param username 用户名
 * @returns 优先显示昵称，如果没有则显示用户名
 */
export function formatDisplayName(nickname?: string, username?: string): string {
  if (nickname && nickname.trim()) {
    return nickname.trim();
  }
  if (username && username.trim()) {
    return username.trim();
  }
  return '未知用户';
}

/**
 * 获取用户头像文字
 * @param nickname 昵称
 * @param username 用户名
 * @returns 头像文字（通常是第一个字或字母）
 */
export function getAvatarText(nickname?: string, username?: string): string {
  const name = formatDisplayName(nickname, username);
  if (!name) return '?';

  // 取第一个字符
  const firstChar = name.charAt(0);

  // 如果是中文，返回第一个字
  if (/[\u4e00-\u9fa5]/.test(firstChar)) {
    return firstChar;
  }

  // 如果是英文，返回大写首字母
  return firstChar.toUpperCase();
}

/**
 * 格式化消息预览（截取前 N 个字符）
 * @param content 消息内容
 * @param maxLength 最大长度，默认 30
 * @returns 格式化的消息预览
 */
export function formatMessagePreview(content: string, maxLength: number = 30): string {
  if (!content) return '';

  // 移除换行符
  const singleLine = content.replace(/\n/g, ' ');

  if (singleLine.length <= maxLength) {
    return singleLine;
  }

  return singleLine.slice(0, maxLength) + '...';
}

/**
 * 格式化群成员数量显示
 * @param count 成员数量
 * @returns 格式化的字符串，如 "12人"
 */
export function formatMemberCount(count: number): string {
  return `${count}人`;
}

/**
 * 格式化未读数显示
 * @param count 未读数
 * @returns 格式化的未读数，超过 99 显示 "99+"
 */
export function formatUnreadCount(count: number): string {
  if (count <= 0) return '';
  if (count > 99) return '99+';
  return count.toString();
}
