package logger

import (
	"fmt"
	"log"
	"os"
)

// Log levels
const (
	LevelDebug = iota
	LevelInfo
	LevelWarn
	LevelError
)

var (
	currentLevel = LevelInfo
	debugLogger  = log.New(os.Stdout, "[DEBUG] ", log.LstdFlags|log.Lshortfile)
	infoLogger   = log.New(os.Stdout, "[INFO] ", log.LstdFlags|log.Lshortfile)
	warnLogger   = log.New(os.Stdout, "[WARN] ", log.LstdFlags|log.Lshortfile)
	errorLogger  = log.New(os.Stderr, "[ERROR] ", log.LstdFlags|log.Lshortfile)
)

// SetLevel 设置日志级别
func SetLevel(level int) {
	currentLevel = level
}

// Debug 输出调试日志
func Debug(v ...interface{}) {
	if currentLevel <= LevelDebug {
		debugLogger.Output(2, fmt.Sprintln(v...))
	}
}

// Debugf 输出格式化调试日志
func Debugf(format string, v ...interface{}) {
	if currentLevel <= LevelDebug {
		debugLogger.Output(2, fmt.Sprintf(format, v...))
	}
}

// Info 输出信息日志
func Info(v ...interface{}) {
	if currentLevel <= LevelInfo {
		infoLogger.Output(2, fmt.Sprintln(v...))
	}
}

// Infof 输出格式化信息日志
func Infof(format string, v ...interface{}) {
	if currentLevel <= LevelInfo {
		infoLogger.Output(2, fmt.Sprintf(format, v...))
	}
}

// Warn 输出警告日志
func Warn(v ...interface{}) {
	if currentLevel <= LevelWarn {
		warnLogger.Output(2, fmt.Sprintln(v...))
	}
}

// Warnf 输出格式化警告日志
func Warnf(format string, v ...interface{}) {
	if currentLevel <= LevelWarn {
		warnLogger.Output(2, fmt.Sprintf(format, v...))
	}
}

// Error 输出错误日志
func Error(v ...interface{}) {
	if currentLevel <= LevelError {
		errorLogger.Output(2, fmt.Sprintln(v...))
	}
}

// Errorf 输出格式化错误日志
func Errorf(format string, v ...interface{}) {
	if currentLevel <= LevelError {
		errorLogger.Output(2, fmt.Sprintf(format, v...))
	}
}

// Fatal 输出致命错误并退出
func Fatal(v ...interface{}) {
	errorLogger.Output(2, fmt.Sprintln(v...))
	os.Exit(1)
}

// Fatalf 输出格式化致命错误并退出
func Fatalf(format string, v ...interface{}) {
	errorLogger.Output(2, fmt.Sprintf(format, v...))
	os.Exit(1)
}
