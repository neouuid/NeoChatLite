// 安全相关工具函数
package utils

import (
	"html"
	"regexp"
	"strings"
)

var (
	// 危险的 HTML 标签正则
	dangerousTags = regexp.MustCompile(`<(script|iframe|object|embed|form|input|button|select|textarea|link|meta|style)[^>]*>`)
	// 危险的 JavaScript 事件属性
	dangerousEvents = regexp.MustCompile(`\s(on\w+)=["'][^"']*["']`)
	// 危险的 JavaScript URL
	dangerousURLs = regexp.MustCompile(`(javascript|vbscript|data):[^\s]+`)
)

// SanitizeHTML 清理 HTML 内容，防止 XSS 攻击
func SanitizeHTML(input string) string {
	if input == "" {
		return input
	}

	// 转义 HTML 实体
	result := html.EscapeString(input)

	// 额外清理：移除危险的标签和属性
	// （因为已经转义，这一步作为双重保险）
	result = dangerousTags.ReplaceAllString(result, "")
	result = dangerousEvents.ReplaceAllString(result, "")
	result = dangerousURLs.ReplaceAllString(result, "#")

	return result
}

// SanitizeText 清理纯文本内容
func SanitizeText(input string) string {
	if input == "" {
		return input
	}

	// 移除危险字符
	input = strings.TrimSpace(input)

	// 移除控制字符（除了换行、制表符等安全空白字符）
	result := strings.Map(func(r rune) rune {
		if r == '\n' || r == '\r' || r == '\t' {
			return r
		}
		if r < 32 || r == 127 {
			return -1
		}
		return r
	}, input)

	return result
}

// ValidateUsername 验证用户名
func ValidateUsername(username string) bool {
	if len(username) < 2 || len(username) > 50 {
		return false
	}
	// 只允许字母、数字、下划线、中文
	match, _ := regexp.MatchString(`^[\p{L}\p{N}_]+$`, username)
	return match
}

// ValidateEmail 验证邮箱
func ValidateEmail(email string) bool {
	if len(email) > 254 {
		return false
	}
	match, _ := regexp.MatchString(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`, email)
	return match
}

// ValidatePassword 验证密码强度
func ValidatePassword(password string) (bool, string) {
	if len(password) < 8 {
		return false, "密码长度至少 8 位"
	}
	if len(password) > 128 {
		return false, "密码长度不能超过 128 位"
	}

	hasUpper := false
	hasLower := false
	hasNumber := false
	hasSpecial := false

	for _, c := range password {
		switch {
		case c >= 'A' && c <= 'Z':
			hasUpper = true
		case c >= 'a' && c <= 'z':
			hasLower = true
		case c >= '0' && c <= '9':
			hasNumber = true
		default:
			hasSpecial = true
		}
	}

	score := 0
	if hasUpper {
		score++
	}
	if hasLower {
		score++
	}
	if hasNumber {
		score++
	}
	if hasSpecial {
		score++
	}

	if score < 3 {
		return false, "密码需要包含大小写字母、数字或特殊字符中的至少三种"
	}

	return true, ""
}

// TruncateString 截断字符串到指定长度
func TruncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen]
}

// RemoveNullBytes 移除 NULL 字节
func RemoveNullBytes(s string) string {
	return strings.ReplaceAll(s, "\x00", "")
}
