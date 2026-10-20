package chat

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestSanitizeFilePath 路径穿越与非法输入必须被拒绝
func TestSanitizeFilePath(t *testing.T) {
	valid := map[string]string{
		"image/2026/10/20/a.png":         "image/2026/10/20/a.png",
		"/image/2026/10/20/a.png":        "image/2026/10/20/a.png",
		"uploads/image/2026/10/20/a.png": "image/2026/10/20/a.png", // 兼容历史 URL
		"audio/2026/10/20/v.m4a":         "audio/2026/10/20/v.m4a",
		// 前导斜杠会被裁掉，最终仍落在 uploadDir 内，属于合法相对路径
		"/etc/passwd": "etc/passwd",
	}
	for in, want := range valid {
		got, err := sanitizeFilePath(in)
		assert.NoError(t, err, in)
		assert.Equal(t, want, got, in)
	}

	invalid := []string{
		"",
		"/",
		"../etc/passwd",
		"image/../../etc/passwd",
		"C:/windows/system32",
		"image/..%2f..%2fetc",
	}
	for _, in := range invalid {
		_, err := sanitizeFilePath(in)
		assert.Error(t, err, "应当拒绝: %s", in)
	}
}

// TestContentTypeFor 扩展名应映射到正确的 Content-Type
func TestContentTypeFor(t *testing.T) {
	assert.Contains(t, contentTypeFor("a.png"), "image/png")
	assert.Contains(t, contentTypeFor("v.mp4"), "video/mp4")
	assert.Contains(t, contentTypeFor("x.unknownext"), "octet-stream")
}
