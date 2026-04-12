package config

import (
	"fmt"
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	NATS     NATSConfig
	JWT      JWTConfig
	Storage  StorageConfig
}

type ServerConfig struct {
	Port         int
	ReadTimeout  int
	WriteTimeout int
	LogLevel     string
	CORS         CORSConfig
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
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
	AllowedImageTypes []string
	AllowedFileTypes  []string
}

var AppConfig *Config

func Load() *Config {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./configs")
	viper.AddConfigPath("../configs")

	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: config file not found, using defaults: %v", err)
		setDefaults()
	}

	config := &Config{
		Server: ServerConfig{
			Port:         viper.GetInt("server.port"),
			ReadTimeout:  viper.GetInt("server.read_timeout"),
			WriteTimeout: viper.GetInt("server.write_timeout"),
			LogLevel:     viper.GetString("server.log_level"),
			CORS: CORSConfig{
				AllowOrigins: viper.GetStringSlice("server.cors.allow_origins"),
				AllowMethods: viper.GetStringSlice("server.cors.allow_methods"),
				AllowHeaders: viper.GetStringSlice("server.cors.allow_headers"),
			},
		},
		Database: DatabaseConfig{
			Host:     viper.GetString("database.host"),
			Port:     viper.GetInt("database.port"),
			User:     viper.GetString("database.user"),
			Password: viper.GetString("database.password"),
			DBName:   viper.GetString("database.dbname"),
			SSLMode:  viper.GetString("database.sslmode"),
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
			AllowedImageTypes: viper.GetStringSlice("storage.allowed_image_types"),
			AllowedFileTypes:  viper.GetStringSlice("storage.allowed_file_types"),
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

	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 5432)
	viper.SetDefault("database.user", "postgres")
	viper.SetDefault("database.password", "postgres")
	viper.SetDefault("database.dbname", "neochat")
	viper.SetDefault("database.sslmode", "disable")

	viper.SetDefault("redis.host", "localhost")
	viper.SetDefault("redis.port", 6379)
	viper.SetDefault("redis.password", "")
	viper.SetDefault("redis.db", 0)

	viper.SetDefault("nats.url", "nats://localhost:4222")
	viper.SetDefault("nats.user", "")
	viper.SetDefault("nats.pass", "")

	viper.SetDefault("jwt.secret", "neochat-secret-key-change-in-production")
	viper.SetDefault("jwt.expiry_hour", 24)

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
}

func (c *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.DBName, c.SSLMode,
	)
}

func (c *RedisConfig) Addr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}
