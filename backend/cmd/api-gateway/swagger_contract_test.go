package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

// swaggerSpec 是 swagger.json 中我们关心的部分
type swaggerSpec struct {
	Paths map[string]map[string]json.RawMessage `json:"paths"`
}

// loadSwaggerPaths 读取 swag init 生成的文档路径，统一成 "METHOD :path" 形式。
func loadSwaggerPaths(t *testing.T) map[string]bool {
	t.Helper()

	file := filepath.Join("..", "..", "docs", "swagger.json")
	data, err := os.ReadFile(file)
	if err != nil {
		t.Fatalf("读取 swagger.json 失败（先执行 swag init）: %v", err)
	}

	var spec swaggerSpec
	if err := json.Unmarshal(data, &spec); err != nil {
		t.Fatalf("解析 swagger.json 失败: %v", err)
	}

	braces := regexp.MustCompile(`\{([A-Za-z0-9_]+)\}`)
	paths := make(map[string]bool, len(spec.Paths))
	for path, ops := range spec.Paths {
		ginPath := braces.ReplaceAllString(path, ":$1")
		for method := range ops {
			paths[strings.ToUpper(method)+" "+ginPath] = true
		}
	}
	return paths
}

// TestSwaggerPathsExistInRoutes 文档里写的接口必须真的注册了，
// 防止「文档描述了一个不存在的接口」。
func TestSwaggerPathsExistInRoutes(t *testing.T) {
	documented := loadSwaggerPaths(t)
	registered := routeSet(newTestRouter(t))

	if len(documented) == 0 {
		t.Fatal("swagger 文档为空")
	}

	for route := range documented {
		if !registered[route] {
			t.Errorf("文档里的接口没有注册: %s", route)
		}
	}
}

// TestCoreRoutesAreDocumented 客户端依赖的核心接口必须有文档，
// 这是「OpenAPI 作为多客户端契约」的最低保障。
func TestCoreRoutesAreDocumented(t *testing.T) {
	documented := loadSwaggerPaths(t)

	core := []string{
		"POST /api/v1/auth/register",
		"POST /api/v1/auth/login",
		"GET /api/v1/auth/profile",
		"GET /api/v1/users/search",
		"GET /api/v1/friends",
		"GET /api/v1/friends/requests",
		"GET /api/v1/blocklist",
		"GET /api/v1/chat/conversations",
		"GET /api/v1/chat/conversations/:id",
		"GET /api/v1/chat/conversations/:id/messages",
		"POST /api/v1/chat/messages",
		"POST /api/v1/chat/conversations/:id/read",
		"GET /api/v1/chat/sync",
		"GET /api/v1/chat/favorites",
		"GET /api/v1/groups/:id",
		"POST /api/v1/groups/:id/members",
	}

	for _, route := range core {
		if !documented[route] {
			t.Errorf("核心接口缺少文档: %s", route)
		}
	}
}
