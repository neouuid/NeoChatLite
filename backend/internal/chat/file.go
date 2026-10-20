package chat

import (
	"errors"
	"fmt"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/neochat/backend/pkg/response"
)

// FileURLPrefix 是上传文件对外的访问前缀。
// 文件不再通过静态目录直接暴露，必须带鉴权走这个接口。
const FileURLPrefix = "/api/v1/files/"

// sanitizeFilePath 把请求路径规整成 uploadDir 内的相对路径。
//
// 拒绝：空路径、绝对路径、包含 .. 的路径、带盘符的 Windows 路径。
func sanitizeFilePath(raw string) (string, error) {
	path := strings.TrimPrefix(raw, "/")
	path = strings.TrimPrefix(path, "uploads/") // 兼容历史 URL
	if path == "" {
		return "", errors.New("empty path")
	}
	if strings.Contains(path, "..") {
		return "", errors.New("invalid path")
	}
	if filepath.IsAbs(path) || strings.Contains(path, ":") {
		return "", errors.New("invalid path")
	}

	cleaned := filepath.Clean(path)
	if strings.HasPrefix(cleaned, "..") {
		return "", errors.New("invalid path")
	}
	return cleaned, nil
}

// contentTypeFor 按扩展名推断响应 Content-Type。
func contentTypeFor(path string) string {
	if t := mime.TypeByExtension(filepath.Ext(path)); t != "" {
		return t
	}
	return "application/octet-stream"
}

// DownloadFile 受控下载上传文件。
// @Summary 下载/查看上传文件
// @Description 需要登录；如果文件属于某条消息，则还要求调用者是该会话成员
// @Tags chat
// @Produce octet-stream
// @Security BearerAuth
// @Param path path string true "上传目录内的相对路径"
// @Param token query string false "浏览器无法设置请求头时可用查询参数传 token"
// @Success 200 {file} binary
// @Failure 401 {object} response.ApiResponse
// @Failure 403 {object} response.ApiResponse
// @Failure 404 {object} response.ApiResponse
// @Router /api/v1/files/{path} [get]
func (h *Handler) DownloadFile(c *gin.Context) {
	userIDStr, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, "unauthorized")
		return
	}
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		response.Unauthorized(c, "invalid user id")
		return
	}

	rel, err := sanitizeFilePath(c.Param("path"))
	if err != nil {
		response.BadRequest(c, "invalid file path")
		return
	}

	uploadDir := h.uploadDir
	root, err := filepath.Abs(uploadDir)
	if err != nil {
		response.InternalServerError(c, "storage not configured")
		return
	}
	fullPath := filepath.Join(root, rel)

	// 二次确认：拼接后的路径必须仍在 uploadDir 内
	if !strings.HasPrefix(fullPath, root+string(os.PathSeparator)) {
		response.BadRequest(c, "invalid file path")
		return
	}

	info, err := os.Stat(fullPath)
	if err != nil || info.IsDir() {
		response.NotFound(c, "file not found")
		return
	}

	// 如果这个文件被某条消息引用，只有该会话成员可以访问
	msg, err := h.service.FindMessageByMediaURL(
		FileURLPrefix+rel,
		"/uploads/"+rel,
	)
	if err == nil && msg != nil {
		if _, err := h.service.GetConversation(msg.ConversationID, userID); err != nil {
			response.Error(c, http.StatusForbidden, "not a member of this conversation")
			return
		}
	}

	c.Header("Content-Type", contentTypeFor(fullPath))
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=%q", filepath.Base(fullPath)))
	c.Header("Cache-Control", "private, max-age=3600")
	c.Header("X-Content-Type-Options", "nosniff")
	c.File(fullPath)
}
