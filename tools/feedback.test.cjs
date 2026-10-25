const { test } = require("node:test");
const assert = require("node:assert/strict");
const { File } = require("node:buffer");
const pack = require("../feedback-pack.js");
const { validateFiles, buildReport } = require("../feedback-model.js");
const mb = 1024 * 1024;
const fields = {
  description: "提交材料后卡住\n操作：与角色交谈",
  environment: "other",
  environmentOther: "自定义环境",
  valkyriesVersion: "不清楚",
  enchantmentVersion: "未安装",
};
const file = (name, size) => ({ name, size });

test("requires a log unless the player explicitly opts out", () => {
  assert.match(validateFiles(null, []), /请添加游戏日志/);
  assert.equal(validateFiles(null, [], true), "");
  for (const extension of ["html", "htm", "log", "TXT"])
    assert.equal(validateFiles(file(`log.${extension}`, 1), []), "");
  assert.match(validateFiles(file("log.html.exe", 1), []), /日志仅支持/);
});
test("validates image count, extensions, emptiness and size boundaries", () => {
  assert.equal(
    validateFiles(file("log.html", 25 * mb), [file("a.png", 25 * mb)]),
    "",
  );
  assert.match(validateFiles(file("log.html", 25 * mb + 1), []), /25 MB/);
  assert.match(
    validateFiles(file("log.html", 25 * mb), [
      file("a.jpg", 25 * mb),
      file("b.webp", 1),
    ]),
    /50 MB/,
  );
  assert.match(
    validateFiles(
      null,
      Array.from({ length: 6 }, () => file("a.png", 1)),
      true,
    ),
    /最多添加 5 张/,
  );
  assert.match(validateFiles(null, [file("a.svg", 1)], true), /截图仅支持/);
  assert.match(validateFiles(null, [file("a.png", 0)], true), /空文件/);
  assert.equal(
    validateFiles(
      null,
      [file("a.PNG", 1), file("b.jpeg", 1), file("c.webp", 1)],
      true,
    ),
    "",
  );
});
test("reports a missing log explicitly without inventing wiki snapshot or installed versions", () => {
  const { report, entries } = buildReport(
    { ...fields, noLog: "on" },
    null,
    [],
    pack,
  );
  assert.equal(report.formatVersion, 2);
  assert.equal(report.logProvided, false);
  assert.deepEqual(report.files, []);
  assert.equal(report.fields.valkyriesVersion, "不清楚");
  assert.match(entries[0].content, /未提供 \/ missing/);
  assert.match(entries[0].content, /自定义环境/);
  assert.match(entries[0].content, /本页面没有自动发送反馈/);
});
test("each Legends pack is included in both text and JSON reports", () => {
  for (const legendsPack of ["纯原版传奇", "星恒整合包", "shs整合包"]) {
    const { entries, report } = buildReport(
      { ...fields, environment: "legends", legendsPack },
      null,
      [],
      pack,
    );
    assert.ok(entries[0].content.includes(`Legends pack: ${legendsPack}`));
    assert.equal(report.fields.legendsPack, legendsPack);
    assert.equal(
      JSON.parse(entries[1].content).fields.legendsPack,
      legendsPack,
    );
  }
});
test("feedback packages identify the QQ group and delivery instructions", () => {
  const { entries, report } = buildReport(fields, null, [], pack);
  assert.deepEqual(report.delivery, {
    platform: "QQ",
    groupName: "战场女武神 mod 群",
    groupNumber: "583558357",
  });
  assert.ok(entries[0].content.includes("战场女武神 mod 群"));
  assert.ok(entries[0].content.includes("群号 / Group number: 583558357"));
  assert.ok(entries[0].content.includes("在群内联系作者"));
  assert.deepEqual(JSON.parse(entries[1].content).delivery, report.delivery);
});
test("modpack versions are included in both text and JSON reports", () => {
  for (const legendsPack of ["星恒整合包", "shs整合包"]) {
    const { entries, report } = buildReport(
      {
        ...fields,
        environment: "legends",
        legendsPack,
        legendsPackVersion: "v2.3.1",
      },
      null,
      [],
      pack,
    );
    assert.ok(
      entries[0].content.includes("整合包版本 / Modpack version: v2.3.1"),
    );
    assert.equal(report.fields.legendsPackVersion, "v2.3.1");
    assert.equal(
      JSON.parse(entries[1].content).fields.legendsPackVersion,
      "v2.3.1",
    );
  }
  const { entries } = buildReport(
    { ...fields, environment: "legends", legendsPack: "纯原版传奇" },
    null,
    [],
    pack,
  );
  assert.ok(!entries[0].content.includes("Modpack version:"));
});
test("ZIP preserves Unicode paths, original file bytes, CRC and matching metadata", async () => {
  const created = new Date("2026-10-25T10:20:30Z");
  const log = new File(
    ["<script>this must never execute</script>\r\n日志"],
    "日志.html",
    { lastModified: created.getTime() },
  );
  const image = new File([Uint8Array.from([0, 1, 255, 128])], "截图.png", {
    lastModified: created.getTime(),
  });
  const { report, entries, filename } = buildReport(
    fields,
    log,
    [image],
    pack,
    created,
  );
  assert.equal(filename, "BattleValkyries-feedback-20261025T102030Z.zip");
  const bytes = Buffer.from(
    await (await pack.createZip(entries, created)).arrayBuffer(),
  );
  const parsed = new Map();
  let cursor = 0;
  const crc32 = (data) => {
    let crc = 0xffffffff;
    for (const byte of data) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };
  while (bytes.readUInt32LE(cursor) === 0x04034b50) {
    assert.equal(bytes.readUInt16LE(cursor + 6), 0x0800);
    assert.equal(bytes.readUInt16LE(cursor + 8), 0);
    const size = bytes.readUInt32LE(cursor + 18),
      nameSize = bytes.readUInt16LE(cursor + 26),
      extraSize = bytes.readUInt16LE(cursor + 28);
    const name = bytes
      .subarray(cursor + 30, cursor + 30 + nameSize)
      .toString("utf8");
    const start = cursor + 30 + nameSize + extraSize,
      data = bytes.subarray(start, start + size);
    assert.equal(bytes.readUInt32LE(cursor + 14), crc32(data));
    parsed.set(name, data);
    cursor = start + size;
  }
  assert.deepEqual(
    [...parsed.keys()],
    ["反馈说明.txt", "结构化信息.json", "log/日志.html", "images/01-截图.png"],
  );
  assert.deepEqual(
    parsed.get("log/日志.html"),
    Buffer.from(await log.arrayBuffer()),
  );
  assert.deepEqual(
    parsed.get("images/01-截图.png"),
    Buffer.from(await image.arrayBuffer()),
  );
  assert.deepEqual(
    JSON.parse(parsed.get("结构化信息.json").toString()),
    report,
  );
  assert.equal(bytes.readUInt32LE(cursor), 0x02014b50);
  const end = bytes.length - 22;
  assert.equal(bytes.readUInt32LE(end), 0x06054b50);
  assert.equal(bytes.readUInt16LE(end + 10), 4);
  assert.equal(bytes.readUInt32LE(end + 16), cursor);
  assert.equal(bytes.readUInt32LE(end + 12), end - cursor);
});
test("attachment paths cannot escape their directory", () => {
  const name = pack.safeFilename("../../日志:测试.html");
  assert.doesNotMatch(name, /[/\\:]/);
  assert.ok(!name.startsWith("."));
  assert.equal(pack.safeFilename("..."), "attachment");
});
