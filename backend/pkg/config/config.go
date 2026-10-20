package config

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	NATS     NATSConfig
	JWT      JWTConfig
	Storage  StorageConfig
	Email    EmailConfig
}

type ServerConfig struct {
	Port         int
	ReadTimeout  int
	WriteTimeout int
	LogLevel     string
	CORS         CORSConfig
	// AuthRateLimitPerMinute 认证接口每 IP 每分钟允许的请求数
	AuthRateLimitPerMinute int
}

type DatabaseConfig struct {
	Driver          string // "postgres" or "sqlite"
	Host            string
	Port            int
	User            string
	Password        string
	DBName          string
	SSLMode         string
	MaxIdleConns    int // 最大空闲连接数
	MaxOpenConns    int // 最大打开连接数
	ConnMaxLifetime int // 连接最大生存时间（秒）
	ConnMaxIdleTime int // 连接最大空闲时间（秒）
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

type NATSConfig struct {
	URL  string
	User string
	Pass string
}

type JWTConfig struct {
	Secret     string
	ExpiryHour int
}

type CORSConfig struct {
	AllowOrigins []string
	AllowMethods []string
	AllowHeaders []string
}

type StorageConfig struct {
	UploadDir         string
	MaxFileSize       int64
	MaxImageSize      int64
	MaxAudioSize      int64
	MaxVideoSize      int64
	AllowedImageTypes []string
	AllowedFileTypes  []string
	AllowedAudioTypes []string
	AllowedVideoTypes []string
}

type EmailConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	From     string
	FromName string
}

var AppConfig *Config

func Load() *Config {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./configs")
	viper.AddConfigPath("../configs")

	// 支持用环境变量覆盖任意配置项：NEOCHAT_DATABASE_HOST → database.host
	viper.SetEnvPrefix("NEOCHAT")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// 默认值必须在读配置之前注册：viper 只在 key 缺失时才用默认值，
	// 如果等读文件失败再注册，那么「配置文件存在但缺少某些键」时
	// 这些键会退化成零值（例如 jwt.expiry_hour=0 会导致令牌立即过期）。
	setDefaults()
	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: config file not found, using defaults: %v", err)
	}

	config := &Config{
		Server: ServerConfig{
			Port:                   viper.GetInt("server.port"),
			ReadTimeout:            viper.GetInt("server.read_timeout"),
			WriteTimeout:           viper.GetInt("server.write_timeout"),
			LogLevel:               viper.GetString("server.log_level"),
			AuthRateLimitPerMinute: viper.GetInt("server.auth_rate_limit_per_minute"),
			CORS: CORSConfig{
				AllowOrigins: viper.GetStringSlice("server.cors.allow_origins"),
				AllowMethods: viper.GetStringSlice("server.cors.allow_methods"),
				AllowHeaders: viper.GetStringSlice("server.cors.allow_headers"),
			},
		},
		Database: DatabaseConfig{
			Driver:          viper.GetString("database.driver"),
			Host:            viper.GetString("database.host"),
			Port:            viper.GetInt("database.port"),
			User:            viper.GetString("database.user"),
			Password:        viper.GetString("database.password"),
			DBName:          viper.GetString("database.dbname"),
			SSLMode:         viper.GetString("database.sslmode"),
			MaxIdleConns:    viper.GetInt("database.max_idle_conns"),
			MaxOpenConns:    viper.GetInt("database.max_open_conns"),
			ConnMaxLifetime: viper.GetInt("database.conn_max_lifetime"),
			ConnMaxIdleTime: viper.GetInt("database.conn_max_idle_time"),
		},
		Redis: RedisConfig{
			Host:     viper.GetString("redis.host"),
			Port:     viper.GetInt("redis.port"),
			Password: viper.GetString("redis.password"),
			DB:       viper.GetInt("redis.db"),
		},
		NATS: NATSConfig{
			URL:  viper.GetString("nats.url"),
			User: viper.GetString("nats.user"),
			Pass: viper.GetString("nats.pass"),
		},
		JWT: JWTConfig{
			Secret:     viper.GetString("jwt.secret"),
			ExpiryHour: viper.GetInt("jwt.expiry_hour"),
		},
		Storage: StorageConfig{
			UploadDir:         viper.GetString("storage.upload_dir"),
			MaxFileSize:       viper.GetInt64("storage.max_file_size"),
			MaxImageSize:      viper.GetInt64("storage.max_image_size"),
			MaxAudioSize:      viper.GetInt64("storage.max_audio_size"),
			MaxVideoSize:      viper.GetInt64("storage.max_video_size"),
			AllowedImageTypes: viper.GetStringSlice("storage.allowed_image_types"),
			AllowedFileTypes:  viper.GetStringSlice("storage.allowed_file_types"),
			AllowedAudioTypes: viper.GetStringSlice("storage.allowed_audio_types"),
			AllowedVideoTypes: viper.GetStringSlice("storage.allowed_video_types"),
		},
		Email: EmailConfig{
			Host:     viper.GetString("email.host"),
			Port:     viper.GetInt("email.port"),
			User:     viper.GetString("email.user"),
			Password: viper.GetString("email.password"),
			From:     viper.GetString("email.from"),
			FromName: viper.GetString("email.from_name"),
		},
	}

	AppConfig = config
	return config
}

func setDefaults() {
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("server.read_timeout", 30)
	viper.SetDefault("server.write_timeout", 30)
	viper.SetDefault("server.log_level", "info")
	viper.SetDefault("server.cors.allow_origins", []string{"*"})
	viper.SetDefault("server.cors.allow_methods", []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})
	viper.SetDefault("server.cors.allow_headers", []string{"*"})

	viper.SetDefault("database.driver", "postgres")
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 5432)
	viper.SetDefault("database.user", "postgres")
	viper.SetDefault("database.password", "postgres")
	viper.SetDefault("database.dbname", "neochat")
	viper.SetDefault("database.sslmode", "disable")
	viper.SetDefault("database.max_idle_conns", 10)
	viper.SetDefault("database.max_open_conns", 100)
	viper.SetDefault("database.conn_max_lifetime", 3600)
	viper.SetDefault("database.conn_max_idle_time", 600)

	viper.SetDefault("redis.host", "localhost")
	viper.SetDefault("redis.port", 6379)
	viper.SetDefault("redis.password", "")
	viper.SetDefault("redis.db", 0)

	viper.SetDefault("nats.url", "nats://localhost:4222")
	viper.SetDefault("nats.user", "")
	viper.SetDefault("nats.pass", "")

	viper.SetDefault("jwt.secret", "neochat-secret-key-change-in-production")
	viper.SetDefault("jwt.expiry_hour", 24)

	viper.SetDefault("server.auth_rate_limit_per_minute", 20)
	viper.SetDefault("storage.upload_dir", "./uploads")
	viper.SetDefault("storage.max_file_size", 104857600)
	viper.SetDefault("storage.max_image_size", 10485760)
	viper.SetDefault("storage.allowed_image_types", []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
	})
	viper.SetDefault("storage.max_audio_size", 20971520)
	viper.SetDefault("storage.max_video_size", 209715200)
	viper.SetDefault("storage.allowed_audio_types", []string{
		"audio/mpeg", "audio/mp4", "audio/aac", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm",
	})
	viper.SetDefault("storage.allowed_video_types", []string{
		"video/mp4", "video/quicktime", "video/webm", "video/x-matroska",
	})
	viper.SetDefault("storage.allowed_file_types", []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-powerpoint",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		"application/zip",
		"application/x-rar-compressed",
		"application/x-7z-compressed",
		"text/plain",
	})

	viper.SetDefault("email.host", "localhost")
	viper.SetDefault("email.port", 1025)
	viper.SetDefault("email.user", "")
	viper.SetDefault("email.password", "")
	viper.SetDefault("email.from", "noreply@neochat.com")
	viper.SetDefault("email.from_name", "NeoChat")
}

func (c *DatabaseConfig) DSN() string {
	if c.Driver == "sqlite" {
		if c.DBName == ":memory:" {
			return "file::memory:?mode=memory&cache=shared"
		}
		return c.DBName
	}
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.DBName, c.SSLMode,
	)
}

// TestConfig 返回测试用的配置
func TestConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Port:                   8080,
			ReadTimeout:            30,
			WriteTimeout:           30,
			LogLevel:               "error",
			AuthRateLimitPerMinute: 1000,
			CORS: CORSConfig{
				AllowOrigins: []string{"*"},
				AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
				AllowHeaders: []string{"*"},
			},
		},
		Database: DatabaseConfig{
			Driver:          "sqlite",
			DBName:          ":memory:",
			MaxIdleConns:    2,
			MaxOpenConns:    5,
			ConnMaxLifetime: 300,
			ConnMaxIdleTime: 60,
		},
		Redis: RedisConfig{
			Host:     "localhost",
			Port:     6379,
			Password: "",
			DB:       0,
		},
		JWT: JWTConfig{
			Secret:     "test-secret-key",
			ExpiryHour: 24,
		},
		Storage: StorageConfig{
			UploadDir:         "./test_uploads",
			MaxFileSize:       104857600,
			MaxImageSize:      10485760,
			MaxAudioSize:      20971520,
			MaxVideoSize:      209715200,
			AllowedAudioTypes: []string{"audio/mpeg", "audio/wav"},
			AllowedVideoTypes: []string{"video/mp4"},
			AllowedImageTypes: []string{"image/jpeg", "image/png"},
			AllowedFileTypes:  []string{"image/jpeg", "image/png"},
		},
		Email: EmailConfig{
			Host:     "localhost",
			Port:     1025,
			User:     "",
			Password: "",
			From:     "noreply@neochat.com",
			FromName: "NeoChat",
		},
	}
}

func (c *RedisConfig) Addr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

// DefaultJWTSecret 是配置模板中的占位密钥，生产环境必须替换
const DefaultJWTSecret = "neochat-secret-key-change-in-production"

// IsProduction 判断当前是否生产环境（APP_ENV 或 GIN_MODE 任一为生产）
func IsProduction() bool {
	return strings.EqualFold(os.Getenv("APP_ENV"), "production") ||
		strings.EqualFold(os.Getenv("GIN_MODE"), "release")
}

// ValidateJWTSecret 校验 JWT 密钥强度。
//
// 生产环境使用默认密钥或过短密钥属于高危配置，必须拒绝启动——
// 否则任何人都能伪造任意用户的令牌。开发环境仅返回错误供调用方告警。
func ValidateJWTSecret(cfg *Config) error {
	secret := strings.TrimSpace(cfg.JWT.Secret)
	if secret == "" {
		return errors.New("jwt.secret is empty")
	}
	if secret == DefaultJWTSecret {
		return errors.New("jwt.secret is still the default placeholder; set a unique secret")
	}
	if len(secret) < 32 {
		return fmt.Errorf("jwt.secret is too short (%d chars); use at least 32", len(secret))
	}
	return nil
}
