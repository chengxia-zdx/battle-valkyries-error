# Battle Valkyries 错误反馈

独立的中文反馈页面，参考相邻 `battle-valkyries-wiki` 仓库的错误反馈流程实现。纯 HTML、CSS 与 JavaScript，无依赖、无需构建，也不需要服务端。

## 本地启动

```powershell
npm run dev
```

打开终端打印的地址，默认是 http://127.0.0.1:4174/；端口被占用时自动顺延。也可用 `npm run dev -- 4200` 指定端口。按 Ctrl+C 停止服务。

## 使用流程

1. 填写游戏环境、女武神版本、附魔 Mod 版本与问题描述。选择传奇时，还需从“纯原版传奇、星恒整合包、shs整合包”中选择传奇版本或整合包，选择结果会写入反馈说明及 JSON。版本不明可填“不清楚”，未安装附魔可填“未安装”。
2. 添加原始日志和最多 5 张可选截图，也可明确选择暂时没有日志。按 Win + R，运行 `shell:Personal\Battle Brothers` 直接打开日志文件夹，找到 `log.html`。再次启动游戏前保存出问题时的日志。
3. 下载 ZIP，手动通过 QQ 将整个反馈包发给作者。页面不会自动发送或上传信息。

日志支持 HTML/HTM/LOG/TXT，图片支持 PNG/JPG/WebP；单文件不超过 25 MiB，总附件不超过 50 MiB。支持拖放、图片预览、追加与移除附件。文本不持久化，关闭或刷新页面前请下载反馈包。日志仅作为原始字节保存，不在页面中执行。

ZIP 包含 `反馈说明.txt`、`结构化信息.json`、`log/` 下的原始日志与 `images/` 下的原始截图。沿用 Wiki 的 `formatVersion: 2` 与核心字段名；缺失日志会明确标记，安装版本来自玩家填写。`feedback-pack.js` 沿用 Wiki 的零依赖 ZIP STORE 实现。

```powershell
npm run check
npm test
```

测试覆盖附件限制、缺失日志处理、反馈元数据及 ZIP 中文文件名、原始字节和 CRC。页面可直接托管到静态站点。图标来自 Wiki 的现有素材。
