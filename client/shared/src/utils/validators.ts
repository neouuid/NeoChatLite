// 验证器工具函数

/**
 * 验证用户名
 * @param username 用户名
 * @returns 验证结果
 */
export function validateUsername(username: string): {
  valid: boolean;
  message?: string;
} {
  if (!username || username.trim() === '') {
    return { valid: false, message: '请输入用户名' };
  }

  if (username.length < 3) {
    return { valid: false, message: '用户名至少需要 3 个字符' };
  }

  if (username.length > 20) {
    return { valid: false, message: '用户名不能超过 20 个字符' };
  }

  // 只允许字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, message: '用户名只能包含字母、数字和下划线' };
  }

  return { valid: true };
}

/**
 * 验证密码
 * @param password 密码
 * @returns 验证结果
 */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (!password || password.trim() === '') {
    return { valid: false, message: '请输入密码' };
  }

  if (password.length < 6) {
    return { valid: false, message: '密码至少需要 6 个字符' };
  }

  if (password.length > 32) {
    return { valid: false, message: '密码不能超过 32 个字符' };
  }

  return { valid: true };
}

/**
 * 验证确认密码
 * @param password 密码
 * @param confirmPassword 确认密码
 * @returns 验证结果
 */
export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): { valid: boolean; message?: string } {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return { valid: false, message: '请输入确认密码' };
  }

  if (password !== confirmPassword) {
    return { valid: false, message: '两次输入的密码不一致' };
  }

  return { valid: true };
}

/**
 * 验证手机号（中国）
 * @param phone 手机号
 * @returns 验证结果
 */
export function validatePhone(phone: string): {
  valid: boolean;
  message?: string;
} {
  if (!phone || phone.trim() === '') {
    return { valid: true }; // 手机号可选
  }

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: '请输入正确的手机号' };
  }

  return { valid: true };
}

/**
 * 验证邮箱
 * @param email 邮箱
 * @returns 验证结果
 */
export function validateEmail(email: string): {
  valid: boolean;
  message?: string;
} {
  if (!email || email.trim() === '') {
    return { valid: true }; // 邮箱可选
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: '请输入正确的邮箱地址' };
  }

  return { valid: true };
}

/**
 * 验证昵称
 * @param nickname 昵称
 * @returns 验证结果
 */
export function validateNickname(nickname: string): {
  valid: boolean;
  message?: string;
} {
  if (!nickname || nickname.trim() === '') {
    return { valid: false, message: '请输入昵称' };
  }

  if (nickname.length < 1) {
    return { valid: false, message: '昵称至少需要 1 个字符' };
  }

  if (nickname.length > 20) {
    return { valid: false, message: '昵称不能超过 20 个字符' };
  }

  return { valid: true };
}

/**
 * 验证群名
 * @param name 群名
 * @returns 验证结果
 */
export function validateGroupName(name: string): {
  valid: boolean;
  message?: string;
} {
  if (!name || name.trim() === '') {
    return { valid: false, message: '请输入群名称' };
  }

  if (name.length < 1) {
    return { valid: false, message: '群名称至少需要 1 个字符' };
  }

  if (name.length > 50) {
    return { valid: false, message: '群名称不能超过 50 个字符' };
  }

  return { valid: true };
}

/**
 * 验证消息内容
 * @param content 消息内容
 * @returns 验证结果
 */
export function validateMessageContent(content: string): {
  valid: boolean;
  message?: string;
} {
  if (!content || content.trim() === '') {
    return { valid: false, message: '请输入消息内容' };
  }

  if (content.length > 5000) {
    return { valid: false, message: '消息内容不能超过 5000 个字符' };
  }

  return { valid: true };
}

/**
 * 验证验证码
 * @param code 验证码
 * @returns 验证结果
 */
export function validateVerificationCode(code: string): {
  valid: boolean;
  message?: string;
} {
  if (!code || code.trim() === '') {
    return { valid: false, message: '请输入验证码' };
  }

  const codeRegex = /^\d{4,6}$/;
  if (!codeRegex.test(code)) {
    return { valid: false, message: '验证码格式不正确' };
  }

  return { valid: true };
}
