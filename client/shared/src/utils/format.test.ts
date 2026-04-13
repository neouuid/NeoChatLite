// 格式化工具函数测试

import {
  formatRelativeTime,
  formatChatTime,
  formatFileSize,
  formatDisplayName,
  getAvatarText,
  formatMessagePreview,
  formatMemberCount,
  formatUnreadCount,
} from './format';

describe('formatRelativeTime', () => {
  it('应该返回空字符串当日期无效时', () => {
    expect(formatRelativeTime('invalid-date')).toBe('');
  });

  it('应该格式化相对时间', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = formatRelativeTime(oneHourAgo);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatChatTime', () => {
  it('应该返回空字符串当日期无效时', () => {
    expect(formatChatTime('invalid-date')).toBe('');
  });

  it('应该格式化今天的时间为 HH:mm', () => {
    const now = new Date();
    const result = formatChatTime(now);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('应该格式化昨天为"昨天"', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatChatTime(yesterday)).toBe('昨天');
  });
});

describe('formatFileSize', () => {
  it('应该格式化 0 字节', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('应该格式化字节', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('应该格式化 KB', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('应该格式化 MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
  });

  it('应该格式化 GB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });
});

describe('formatDisplayName', () => {
  it('应该优先显示昵称', () => {
    expect(formatDisplayName('张三', 'zhangsan')).toBe('张三');
  });

  it('应该显示用户名当没有昵称时', () => {
    expect(formatDisplayName('', 'zhangsan')).toBe('zhangsan');
    expect(formatDisplayName(undefined, 'zhangsan')).toBe('zhangsan');
  });

  it('应该返回"未知用户"当昵称和用户名都为空时', () => {
    expect(formatDisplayName('', '')).toBe('未知用户');
    expect(formatDisplayName(undefined, undefined)).toBe('未知用户');
  });

  it('应该修剪昵称和用户名的空白字符', () => {
    expect(formatDisplayName('  张三  ', '  zhangsan  ')).toBe('张三');
    expect(formatDisplayName('', '  zhangsan  ')).toBe('zhangsan');
  });
});

describe('getAvatarText', () => {
  it('应该返回中文的第一个字', () => {
    expect(getAvatarText('张三', 'zhangsan')).toBe('张');
  });

  it('应该返回英文的大写首字母', () => {
    expect(getAvatarText('', 'john')).toBe('J');
    expect(getAvatarText('John', '')).toBe('J');
  });

  it('应该返回问号当没有名称时', () => {
    expect(getAvatarText('', '')).toBe('?');
  });
});

describe('formatMessagePreview', () => {
  it('应该返回空字符串当内容为空时', () => {
    expect(formatMessagePreview('')).toBe('');
  });

  it('应该移除换行符', () => {
    expect(formatMessagePreview('hello\nworld')).toBe('hello world');
  });

  it('应该返回完整内容当长度小于最大限制时', () => {
    expect(formatMessagePreview('hello world', 20)).toBe('hello world');
  });

  it('应该截断长内容并添加省略号', () => {
    const longText = '这是一段非常长的消息内容，需要被截断显示';
    const result = formatMessagePreview(longText, 10);
    expect(result.length).toBeLessThan(longText.length);
    expect(result.endsWith('...')).toBe(true);
  });

  it('应该使用默认最大长度 30', () => {
    const text = 'a'.repeat(50);
    const result = formatMessagePreview(text);
    expect(result.length).toBe(33); // 30 + 3 dots
  });
});

describe('formatMemberCount', () => {
  it('应该格式化成员数量', () => {
    expect(formatMemberCount(0)).toBe('0人');
    expect(formatMemberCount(1)).toBe('1人');
    expect(formatMemberCount(100)).toBe('100人');
  });
});

describe('formatUnreadCount', () => {
  it('应该返回空字符串当计数为 0 或负数时', () => {
    expect(formatUnreadCount(0)).toBe('');
    expect(formatUnreadCount(-1)).toBe('');
  });

  it('应该返回数字字符串当计数在 1-99 之间时', () => {
    expect(formatUnreadCount(1)).toBe('1');
    expect(formatUnreadCount(50)).toBe('50');
    expect(formatUnreadCount(99)).toBe('99');
  });

  it('应该返回"99+"当计数超过 99 时', () => {
    expect(formatUnreadCount(100)).toBe('99+');
    expect(formatUnreadCount(999)).toBe('99+');
  });
});
