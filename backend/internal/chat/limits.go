package chat

import "unicode/utf8"

// 单条请求能返回的最大消息条数 / 同步条数。
// 没有上限时，一个 ?limit=1000000 的请求就能把整张表读进内存。
const (
	MaxMessagesPerPage = 200
	MaxSyncPerPage     = 500

	// 文本消息正文上限（字符数，不是字节数）
	MaxTextContentRunes = 10000
	// 媒体消息的 content 只放文件名/说明，上限更小
	MaxMediaContentRunes = 255
	// 文件名上限
	MaxFileNameRunes = 255
)

func clampLimit(value, fallback, max int) int {
	if value <= 0 {
		return fallback
	}
	if value > max {
		return max
	}
	return value
}

// isAllowedMessageType 只接受已知类型，避免客户端写入任意字符串
func isAllowedMessageType(t string) bool {
	switch t {
	case MessageTypeText, MessageTypeImage, MessageTypeFile,
		MessageTypeAudio, MessageTypeVideo, MessageTypeSystem:
		return true
	}
	return false
}

// validateMessageContent 返回空字符串表示通过，否则是要回给调用方的错误信息
func validateMessageContent(msgType, content, fileName string) string {
	if msgType == MessageTypeText {
		if utf8.RuneCountInString(content) > MaxTextContentRunes {
			return "content too long (max 10000 characters)"
		}
	} else if utf8.RuneCountInString(content) > MaxMediaContentRunes {
		return "content too long (max 255 characters)"
	}
	if utf8.RuneCountInString(fileName) > MaxFileNameRunes {
		return "file_name too long (max 255 characters)"
	}
	return ""
}
