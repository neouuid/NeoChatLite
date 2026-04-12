package chat

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/response"
)

type UploadHandler struct {
	service *Service
	cfg     *config.Config
}

func NewUploadHandler(service *Service, cfg *config.Config) *UploadHandler {
	return &UploadHandler{
		service: service,
		cfg:     cfg,
	}
}

// UploadFile 上传文件
// @Summary 上传文件
// @Description 上传图片或文件
// @Tags upload
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "文件"
// @Param type formData string false "文件类型: image/file"
// @Success 200 {object} response.ApiResponse{data=map[string]interface{}}
// @Failure 400 {object} response.ApiResponse
// @Failure 401 {object} response.ApiResponse
// @Router /api/v1/upload [post]
func (h *UploadHandler) UploadFile(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil || userID == uuid.Nil {
		response.Unauthorized(c, "unauthorized")
		return
	}

	// 获取上传类型
	uploadType := c.PostForm("type")
	if uploadType == "" {
		uploadType = "file"
	}

	// 获取文件
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.BadRequest(c, "failed to get file: "+err.Error())
		return
	}
	defer file.Close()

	// 验证文件
	if err := h.validateFile(header, uploadType); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	// 创建上传目录
	uploadDir := h.cfg.Storage.UploadDir
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	// 按日期分目录
	datePath := time.Now().Format("2006/01/02")
	fullDir := filepath.Join(uploadDir, uploadType, datePath)
	if err := os.MkdirAll(fullDir, 0755); err != nil {
		response.InternalServerError(c, "failed to create upload directory")
		return
	}

	// 生成新文件名
	ext := filepath.Ext(header.Filename)
	newFileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	dstPath := filepath.Join(fullDir, newFileName)

	// 保存文件
	dst, err := os.Create(dstPath)
	if err != nil {
		response.InternalServerError(c, "failed to save file")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		response.InternalServerError(c, "failed to save file content")
		return
	}

	// 生成访问URL
	fileURL := fmt.Sprintf("/uploads/%s/%s/%s", uploadType, datePath, newFileName)

	// 返回结果
	response.Success(c, gin.H{
		"url":       fileURL,
		"file_name": header.Filename,
		"file_size": header.Size,
		"mime_type": header.Header.Get("Content-Type"),
	})
}

// validateFile 验证文件
func (h *UploadHandler) validateFile(header *multipart.FileHeader, uploadType string) error {
	// 获取文件大小
	fileSize := header.Size

	// 获取MIME类型
	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		// 根据扩展名猜测
		ext := strings.ToLower(filepath.Ext(header.Filename))
		switch ext {
		case ".jpg", ".jpeg":
			mimeType = "image/jpeg"
		case ".png":
			mimeType = "image/png"
		case ".gif":
			mimeType = "image/gif"
		case ".webp":
			mimeType = "image/webp"
		case ".pdf":
			mimeType = "application/pdf"
		case ".doc":
			mimeType = "application/msword"
		case ".docx":
			mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
		case ".xls":
			mimeType = "application/vnd.ms-excel"
		case ".xlsx":
			mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		case ".ppt":
			mimeType = "application/vnd.ms-powerpoint"
		case ".pptx":
			mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
		case ".zip":
			mimeType = "application/zip"
		case ".rar":
			mimeType = "application/x-rar-compressed"
		case ".7z":
			mimeType = "application/x-7z-compressed"
		case ".txt":
			mimeType = "text/plain"
		default:
			mimeType = "application/octet-stream"
		}
	}

	// 验证大小和类型
	if uploadType == "image" {
		maxSize := h.cfg.Storage.MaxImageSize
		if maxSize == 0 {
			maxSize = 10 * 1024 * 1024 // 默认10MB
		}
		if fileSize > maxSize {
			return fmt.Errorf("image too large, max size is %d MB", maxSize/(1024*1024))
		}

		allowedTypes := h.cfg.Storage.AllowedImageTypes
		if len(allowedTypes) == 0 {
			allowedTypes = []string{"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}
		}
		if !isAllowedType(mimeType, allowedTypes) {
			return fmt.Errorf("unsupported image type: %s", mimeType)
		}
	} else {
		maxSize := h.cfg.Storage.MaxFileSize
		if maxSize == 0 {
			maxSize = 100 * 1024 * 1024 // 默认100MB
		}
		if fileSize > maxSize {
			return fmt.Errorf("file too large, max size is %d MB", maxSize/(1024*1024))
		}

		allowedTypes := h.cfg.Storage.AllowedFileTypes
		if len(allowedTypes) > 0 && !isAllowedType(mimeType, allowedTypes) {
			return fmt.Errorf("unsupported file type: %s", mimeType)
		}
	}

	return nil
}

// isAllowedType 检查是否是允许的类型
func isAllowedType(mimeType string, allowedTypes []string) bool {
	for _, t := range allowedTypes {
		if strings.EqualFold(t, mimeType) {
			return true
		}
	}
	return false
}
