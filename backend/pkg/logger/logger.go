package logger

import (
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
		debugLogger.Output(2, format(v...))
	}
}

// Debugf 输出格式化调试日志
func Debugf(format string, v ...interface{}) {
	if currentLevel <= LevelDebug {
		debugLogger.Output(2, format)
	}
}

// Info 输出信息日志
func Info(v ...interface{}) {
	if currentLevel <= LevelInfo {
		infoLogger.Output(2, format(v...))
	}
}

// Infof 输出格式化信息日志
func Infof(format string, v ...interface{}) {
	if currentLevel <= LevelInfo {
		infoLogger.Output(2, format)
	}
}

// Warn 输出警告日志
func Warn(v ...interface{}) {
	if currentLevel <= LevelWarn {
		warnLogger.Output(2, format(v...))
	}
}

// Warnf 输出格式化警告日志
func Warnf(format string, v ...interface{}) {
	if currentLevel <= LevelWarn {
		warnLogger.Output(2, format)
	}
}

// Error 输出错误日志
func Error(v ...interface{}) {
	if currentLevel <= LevelError {
		errorLogger.Output(2, format(v...))
	}
}

// Errorf 输出格式化错误日志
func Errorf(format string, v ...interface{}) {
	if currentLevel <= LevelError {
		errorLogger.Output(2, format)
	}
}

// Fatal 输出致命错误并退出
func Fatal(v ...interface{}) {
	errorLogger.Output(2, format(v...))
	os.Exit(1)
}

// Fatalf 输出格式化致命错误并退出
func Fatalf(format string, v ...interface{}) {
	errorLogger.Output(2, format)
	os.Exit(1)
}

func format(v ...interface{}) string {
	if len(v) == 0 {
		return ""
	}
	if str, ok := v[0].(string); ok && len(v) > 1 {
		return log.Printf(str, v[1:]...)
	}
	return log.Sprintln(v...)
}
