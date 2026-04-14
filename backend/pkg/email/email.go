// 邮件服务
package email

import (
	"fmt"
	"net/smtp"

	"github.com/neochat/backend/pkg/config"
	"github.com/neochat/backend/pkg/logger"
)

// Service 邮件服务
type Service struct {
	cfg *config.Config
}

// NewService 创建邮件服务
func NewService(cfg *config.Config) *Service {
	return &Service{cfg: cfg}
}

// SendEmail 发送邮件
func (s *Service) SendEmail(to, subject, body string) error {
	// 如果没有配置邮件服务器，记录日志并返回（开发环境）
	if s.cfg.Email.Host == "" || s.cfg.Email.Host == "localhost" {
		logger.Infof("Email not sent (no SMTP configured): to=%s, subject=%s", to, subject)
		logger.Debugf("Email body: %s", body)
		return nil
	}

	from := s.cfg.Email.From
	if from == "" {
		from = "noreply@neochat.com"
	}

	fromName := s.cfg.Email.FromName
	if fromName == "" {
		fromName = "NeoChat"
	}

	// 构建邮件头
	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", fromName, from)
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=\"utf-8\""

	// 构建邮件内容
	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + body

	// 发送邮件
	addr := fmt.Sprintf("%s:%d", s.cfg.Email.Host, s.cfg.Email.Port)

	var auth smtp.Auth
	if s.cfg.Email.User != "" && s.cfg.Email.Password != "" {
		auth = smtp.PlainAuth("", s.cfg.Email.User, s.cfg.Email.Password, s.cfg.Email.Host)
	}

	err := smtp.SendMail(addr, auth, from, []string{to}, []byte(message))
	if err != nil {
		logger.Errorf("Failed to send email: %v", err)
		return err
	}

	logger.Infof("Email sent successfully: to=%s, subject=%s", to, subject)
	return nil
}

// SendPasswordResetEmail 发送密码重置邮件
func (s *Service) SendPasswordResetEmail(to, token string) error {
	subject := "NeoChat - 密码重置"
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>密码重置</title>
</head>
<body>
    <h2>密码重置</h2>
    <p>您好，</p>
    <p>您收到这封邮件是因为您请求重置 NeoChat 账户密码。</p>
    <p>请使用以下验证码重置您的密码：</p>
    <p style="font-size: 24px; font-weight: bold; background: #f5f5f5; padding: 10px; display: inline-block;">%s</p>
    <p>此验证码将在 1 小时后过期。</p>
    <p>如果您没有请求重置密码，请忽略此邮件。</p>
    <hr>
    <p>此致，<br>NeoChat 团队</p>
</body>
</html>
`, token)

	return s.SendEmail(to, subject, body)
}

// SendEmailVerificationEmail 发送邮箱验证邮件
func (s *Service) SendEmailVerificationEmail(to, token string) error {
	subject := "NeoChat - 邮箱验证"
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>邮箱验证</title>
</head>
<body>
    <h2>邮箱验证</h2>
    <p>您好，</p>
    <p>感谢您注册 NeoChat！请使用以下验证码验证您的邮箱：</p>
    <p style="font-size: 24px; font-weight: bold; background: #f5f5f5; padding: 10px; display: inline-block;">%s</p>
    <p>此验证码将在 24 小时后过期。</p>
    <hr>
    <p>此致，<br>NeoChat 团队</p>
</body>
</html>
`, token)

	return s.SendEmail(to, subject, body)
}
