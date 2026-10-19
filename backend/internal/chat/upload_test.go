package chat

import (
	"mime/multipart"
	"net/textproto"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/neochat/backend/pkg/config"
)

func newUploadHandler() *UploadHandler {
	return &UploadHandler{cfg: &config.Config{Storage: config.StorageConfig{
		MaxImageSize:      10 * 1024 * 1024,
		MaxAudioSize:      20 * 1024 * 1024,
		MaxVideoSize:      200 * 1024 * 1024,
		AllowedImageTypes: []string{"image/png", "image/jpeg"},
		AllowedAudioTypes: []string{"audio/mpeg", "audio/wav"},
		AllowedVideoTypes: []string{"video/mp4", "video/quicktime"},
	}}}
}

func fileHeader(filename, contentType string, size int64) *multipart.FileHeader {
	h := textproto.MIMEHeader{}
	h.Set("Content-Type", contentType)
	return &multipart.FileHeader{Filename: filename, Size: size, Header: h}
}

// TestValidateFileAudioVideo 音视频应当被接受，且各自有大小上限
func TestValidateFileAudioVideo(t *testing.T) {
	h := newUploadHandler()

	require.NoError(t, h.validateFile(fileHeader("voice.mp3", "audio/mpeg", 1024*1024), "audio"))
	require.NoError(t, h.validateFile(fileHeader("clip.mp4", "video/mp4", 50*1024*1024), "video"))

	// 不在白名单的音视频类型要被拒绝
	assert.Error(t, h.validateFile(fileHeader("x.flac", "audio/flac", 1024), "audio"))
	assert.Error(t, h.validateFile(fileHeader("x.avi", "video/x-msvideo", 1024), "video"))

	// 超限要被拒绝
	assert.Error(t, h.validateFile(fileHeader("big.mp4", "video/mp4", 300*1024*1024), "video"))
}

// TestValidateFileInfersMimeFromExtension 未提供 Content-Type 时按扩展名推断
func TestValidateFileInfersMimeFromExtension(t *testing.T) {
	h := newUploadHandler()

	require.NoError(t, h.validateFile(fileHeader("voice.mp3", "", 1024), "audio"))
	require.NoError(t, h.validateFile(fileHeader("clip.mov", "", 1024), "video"))
}
