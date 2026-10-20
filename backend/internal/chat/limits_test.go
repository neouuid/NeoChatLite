package chat

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestClampLimit(t *testing.T) {
	assert.Equal(t, 50, clampLimit(0, 50, 200), "缺省值")
	assert.Equal(t, 50, clampLimit(-10, 50, 200), "负数用缺省值")
	assert.Equal(t, 200, clampLimit(100000, 50, 200), "超过上限被钳制")
	assert.Equal(t, 120, clampLimit(120, 50, 200), "正常值保留")
}

func TestIsAllowedMessageType(t *testing.T) {
	for _, ok := range []string{"text", "image", "file", "audio", "video", "system"} {
		assert.True(t, isAllowedMessageType(ok), ok)
	}
	for _, bad := range []string{"", "unknown", "TEXT", "../x"} {
		assert.False(t, isAllowedMessageType(bad), bad)
	}
}

func TestValidateMessageContent(t *testing.T) {
	// 文本：10000 字符以内通过，超出拒绝
	assert.Empty(t, validateMessageContent("text", strings.Repeat("字", MaxTextContentRunes), ""))
	assert.NotEmpty(t, validateMessageContent("text", strings.Repeat("字", MaxTextContentRunes+1), ""))

	// 媒体消息的 content 只放说明，255 字符上限
	assert.Empty(t, validateMessageContent("image", "", ""))
	assert.NotEmpty(t, validateMessageContent("image", strings.Repeat("x", MaxMediaContentRunes+1), ""))

	// 文件名上限
	assert.NotEmpty(t, validateMessageContent("file", "f.txt", strings.Repeat("n", MaxFileNameRunes+1)))
}
