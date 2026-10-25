(function (root) {
  "use strict";
  const MAX_FILE = 25 * 1024 * 1024;
  const MAX_TOTAL = 50 * 1024 * 1024;
  const feedbackGroup = { name: "战场女武神 mod 群", number: "583558357" };
  const environments = {
    vanilla: "原版 / Vanilla",
    legends: "传奇 / Legends",
    reforged: "重铸 / Reforged",
  };

  function validateFiles(log, images, allowMissing = false) {
    if (!log && !allowMissing)
      return "请添加游戏日志，或勾选“暂时找不到日志”。";
    if (log && !/\.(html?|log|txt)$/i.test(log.name))
      return "日志仅支持 HTML、HTM、LOG 或 TXT 文件。";
    if (images.length > 5) return "最多添加 5 张图片，请移除部分图片后重试。";
    if (images.some((file) => !/\.(png|jpe?g|webp)$/i.test(file.name)))
      return "截图仅支持 PNG、JPG 或 WebP 图片。";
    const files = [log, ...images].filter(Boolean);
    const empty = files.find((file) => file.size === 0);
    if (empty) return `“${empty.name}”是空文件，请重新选择。`;
    const large = files.find((file) => file.size > MAX_FILE);
    if (large) return `“${large.name}”超过了单文件 25 MB 的限制。`;
    if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL)
      return "全部附件已超过 50 MB，请移除部分图片。";
    return "";
  }

  function buildReport(fields, log, images, pack, created = new Date()) {
    const entries = [];
    if (log)
      entries.push({
        name: `log/${pack.safeFilename(log.name)}`,
        content: log,
      });
    images.forEach((file, index) =>
      entries.push({
        name: `images/${String(index + 1).padStart(2, "0")}-${pack.safeFilename(file.name)}`,
        content: file,
      }),
    );
    const files = [log, ...images].filter(Boolean).map((file, index) => ({
      name: file.name,
      path: entries[index].name,
      bytes: file.size,
      lastModified: new Date(file.lastModified).toISOString(),
    }));
    const report = {
      formatVersion: 2,
      createdAt: created.toISOString(),
      reportLanguage: "zh",
      fields,
      logProvided: !!log,
      files,
      source: "battle-valkyries-error",
      delivery: {
        platform: "QQ",
        groupName: feedbackGroup.name,
        groupNumber: feedbackGroup.number,
      },
    };
    const environment =
      fields.environment === "other"
        ? fields.environmentOther
        : environments[fields.environment];
    const text = [
      "Battle Valkyries 错误反馈 / Bug report",
      `生成时间 / Created: ${report.createdAt}`,
      "",
      `问题描述 / Problem description:\r\n${fields.description}`,
      "",
      `游戏环境 / Game environment: ${environment}`,
      ...(fields.environment === "legends" && fields.legendsPack
        ? [`传奇版本 / 整合包 / Legends pack: ${fields.legendsPack}`]
        : []),
      ...(fields.environment === "legends" && fields.legendsPackVersion
        ? [`整合包版本 / Modpack version: ${fields.legendsPackVersion}`]
        : []),
      `女武神 Mod 版本 / Battle Valkyries version: ${fields.valkyriesVersion}`,
      `附魔 Mod 版本 / Enchantment mod version: ${fields.enchantmentVersion}`,
      "",
      `日志 / Log: ${log ? log.name : "未提供 / missing（玩家暂时找不到日志）"}`,
      "",
      "附件 / Attachments:",
      ...files.map((file) => `${file.path} (${file.bytes} bytes)`),
      "",
      `反馈 QQ 群 / QQ group: ${feedbackGroup.name}`,
      `群号 / Group number: ${feedbackGroup.number}`,
      "请加入上述 QQ 群，在群内联系作者，通过“发送文件”发送整个 ZIP。本页面没有自动发送反馈。",
      `Join QQ group ${feedbackGroup.number}, contact the author, and send this complete ZIP as a file. This page has not sent it automatically.`,
    ].join("\r\n");
    entries.unshift(
      { name: "反馈说明.txt", content: `\ufeff${text}` },
      { name: "结构化信息.json", content: JSON.stringify(report, null, 2) },
    );
    return {
      entries,
      report,
      filename: `BattleValkyries-feedback-${created
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d+Z$/, "Z")}.zip`,
    };
  }
  const api = { validateFiles, buildReport, feedbackGroup };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.BV_FEEDBACK_MODEL = api;
})(typeof window === "undefined" ? globalThis : window);
