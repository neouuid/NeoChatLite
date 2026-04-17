// 提及功能相关工具函数

import { User } from '../types';

export interface MentionMatch {
  original: string;
  username: string;
  startIndex: number;
  endIndex: number;
}

export interface ParsedMention {
  type: 'text' | 'mention';
  content: string;
  userId?: string;
  username?: string;
}

/**
 * 从文本中提取 @提及
 * 格式: @username 或 @[username](user_id)
 */
export function extractMentions(text: string): MentionMatch[] {
  const mentions: MentionMatch[] = [];

  // 匹配格式 1: @[username](user_id) - 带用户ID的完整格式
  const fullPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = fullPattern.exec(text)) !== null) {
    mentions.push({
      original: match[0],
      username: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // 匹配格式 2: @username - 简单格式
  const simplePattern = /@(\w+)/g;
  while ((match = simplePattern.exec(text)) !== null) {
    // 检查是否已经被完整格式匹配过
    const isAlreadyMatched = mentions.some(
      m => match!.index >= m.startIndex && match!.index < m.endIndex
    );
    if (!isAlreadyMatched) {
      mentions.push({
        original: match[0],
        username: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // 按位置排序
  return mentions.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * 将文本解析为带提及的分段
 */
export function parseMessageText(text: string, members?: User[]): ParsedMention[] {
  const parts: ParsedMention[] = [];
  const mentions = extractMentions(text);

  let lastIndex = 0;

  for (const mention of mentions) {
    // 添加提及前的文本
    if (mention.startIndex > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, mention.startIndex),
      });
    }

    // 查找对应用户
    const user = members?.find(
      m => m.username === mention.username || m.id === mention.username
    );

    parts.push({
      type: 'mention',
      content: mention.original,
      username: mention.username,
      userId: user?.id,
    });

    lastIndex = mention.endIndex;
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  // 如果没有提及，返回整个文本
  if (parts.length === 0) {
    return [{ type: 'text', content: text }];
  }

  return parts;
}

/**
 * 创建提及格式的文本
 */
export function createMentionText(user: User): string {
  return `@[${user.username}](${user.id})`;
}

/**
 * 检测文本中是否有触发提及的 @符号
 * 返回光标前的查询词（如果有）
 */
export function detectMentionTrigger(
  text: string,
  cursorPosition: number
): { trigger: boolean; query: string; startIndex: number } {
  // 从光标位置向前查找 @ 符号
  const textBeforeCursor = text.slice(0, cursorPosition);
  const lastAtIndex = textBeforeCursor.lastIndexOf('@');

  if (lastAtIndex === -1) {
    return { trigger: false, query: '', startIndex: -1 };
  }

  // 检查 @ 符号后面是否有空格（说明不是在输入提及）
  const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
  if (textAfterAt.includes(' ')) {
    return { trigger: false, query: '', startIndex: -1 };
  }

  return {
    trigger: true,
    query: textAfterAt,
    startIndex: lastAtIndex,
  };
}

/**
 * 在文本中插入提及
 */
export function insertMention(
  text: string,
  cursorPosition: number,
  user: User
): { newText: string; newCursorPosition: number } {
  const { trigger, startIndex } = detectMentionTrigger(text, cursorPosition);

  if (!trigger || startIndex === -1) {
    // 没有触发，直接在光标处插入
    const mentionText = createMentionText(user) + ' ';
    return {
      newText: text.slice(0, cursorPosition) + mentionText + text.slice(cursorPosition),
      newCursorPosition: cursorPosition + mentionText.length,
    };
  }

  // 替换触发位置的文本
  const mentionText = createMentionText(user) + ' ';
  return {
    newText: text.slice(0, startIndex) + mentionText + text.slice(cursorPosition),
    newCursorPosition: startIndex + mentionText.length,
  };
}
