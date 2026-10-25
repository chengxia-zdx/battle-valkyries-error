# Battle Valkyries 错误反馈

独立的中文反馈页面，参考相邻 `battle-valkyries-wiki` 仓库的错误反馈流程实现。纯 HTML、CSS 与 JavaScript，无依赖、无需构建，也不需要服务端。

## 本地启动

```powershell
npm run dev
```

打开终端打印的地址，默认是 http://127.0.0.1:4174/；端口被占用时自动顺延。也可用 `npm run dev -- 4200` 指定端口。按 Ctrl+C 停止服务。

## 使用流程

1. 填写游戏环境、女武神版本、附魔 Mod 版本与问题描述。选择传奇时，还需从“纯原版传奇、星恒整合包、shs整合包”中选择传奇版本或整合包；选择星恒或 shs 整合包后，还须填写实际安装的整合包版本。整合包名称与版本都会写入反馈说明及 JSON，切换为纯原版传奇或其他游戏环境时不再要求或导出整合包版本。未安装附魔可填“未安装”。
2. 添加原始日志和最多 5 张可选截图，也可明确选择暂时没有日志。按 Win + R，运行 `shell:Personal\Battle Brothers` 直接打开日志文件夹，找到 `log.html`。再次启动游戏前保存出问题时的日志。
3. 下载 ZIP，加入 **战场女武神 mod 群（群号：583558357）**，在群内联系作者，通过“发送文件”发送整个反馈包。页面提供群号复制按钮和用户提供的入群二维码，下载完成弹窗和反馈包内也注明群名与群号。页面不会自动发送或上传信息。

日志支持 HTML/HTM/LOG/TXT，图片支持 PNG/JPG/WebP；单文件不超过 25 MiB，总附件不超过 50 MiB。支持拖放、图片预览、追加与移除附件。文本不持久化，关闭或刷新页面前请下载反馈包。日志仅作为原始字节保存，不在页面中执行。

ZIP 包含 `反馈说明.txt`、`结构化信息.json`、`log/` 下的原始日志与 `images/` 下的原始截图。沿用 Wiki 的 `formatVersion: 2` 与核心字段名；缺失日志会明确标记，安装版本来自玩家填写。`feedback-pack.js` 沿用 Wiki 的零依赖 ZIP STORE 实现。

```powershell
npm run check
npm test
```

测试覆盖附件限制、缺失日志处理、反馈元数据及 ZIP 中文文件名、原始字节和 CRC。页面可直接托管到静态站点。图标来自 Wiki 的现有素材。

## GitHub Pages

本项目已经支持 GitHub Pages，页面、脚本和素材均使用相对路径，兼容仓库子路径 `/battle-valkyries-error/`。无需安装依赖或构建前端。

首次启用时，在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**：

- [打开 Pages 设置](https://github.com/chengxia-zdx/battle-valkyries-error/settings/pages)
- [查看 Deploy GitHub Pages 工作流](https://github.com/chengxia-zdx/battle-valkyries-error/actions/workflows/pages.yml)

然后在工作流页面点击 **Run workflow**，或向 `main` 推送一次更新。之后每次推送会自动运行 JavaScript 检查和反馈包测试；通过后仅发布网页文件与素材，测试工具、本地预览服务和开发产物不进入站点。`.nojekyll` 禁用 Jekyll 处理。

部署成功后的访问地址：[https://chengxia-zdx.github.io/battle-valkyries-error/](https://chengxia-zdx.github.io/battle-valkyries-error/)。启用前或部署完成前，该地址可能返回 404。

线上页面同样只在玩家浏览器中整理文件，不需要配置后端或 Token；反馈包仍需玩家加入战场女武神 mod 群（583558357），联系作者发送。入群二维码原图位于 `assets/qq-group-583558357.jpg`，会随网页素材一起部署。
