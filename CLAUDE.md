# NeoChat Project Instructions

## 重要规则

1. **不要重置git** - 绝对不要运行 git reset、git checkout --、git clean -f 或任何导致工作丢的是的危险命令
2. **不要删除符号链接** - 不可以执行任何可能删除符号链接的命令
3. **不要反复无意义地运行 npm install** - 先分析问题，理解错误原因，再有针对性地解决
4. **不要绕圈子** - 遇到问题要分析根本原因，而不是重复同样的失败步骤
5. **深度思考** - 命令执行失败的时候，先搞清楚为什么会失败，而不是立即换一种方式，一直肤浅的解决问题

## 项目结构

- 这是一个 npm workspaces 单仓库
- client/ - 前端（React Native）
- backend/ - 后端
- client/desktop/ - Windows 桌面应用

## 当前任务

用户最初要求：构建 Client 在windows平台的 Debug和Release 版本

