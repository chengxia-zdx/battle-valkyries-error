(function (root) {
  "use strict";

  const encoder = new TextEncoder();
  const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit++)
      value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    return value >>> 0;
  });

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
    return (crc ^ 0xffffffff) >>> 0;
  }

  function safeFilename(name) {
    return (
      String(name)
        .replace(/[\x00-\x1f\x7f/\\:*?"<>|]/g, "_")
        .replace(/^\.+|[. ]+$/g, "")
        .slice(0, 120) || "attachment"
    );
  }

  // ZIP STORE keeps the original bytes and needs no CDN, library or server.
  async function createZip(entries, date = new Date()) {
    const parts = [],
      directory = [];
    let offset = 0;
    const year = Math.max(1980, Math.min(2107, date.getFullYear()));
    const dosDate =
      ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    const dosTime =
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      (date.getSeconds() >> 1);
    for (const entry of entries) {
      const name = encoder.encode(entry.name);
      const bytes =
        typeof entry.content === "string"
          ? encoder.encode(entry.content)
          : entry.content instanceof Uint8Array
            ? entry.content
            : new Uint8Array(await entry.content.arrayBuffer());
      const crc = crc32(bytes);
      const local = new Uint8Array(30 + name.length),
        localView = new DataView(local.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0x0800, true); // UTF-8 filenames.
      localView.setUint16(10, dosTime, true);
      localView.setUint16(12, dosDate, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, bytes.length, true);
      localView.setUint32(22, bytes.length, true);
      localView.setUint16(26, name.length, true);
      local.set(name, 30);
      const central = new Uint8Array(46 + name.length),
        centralView = new DataView(central.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0x0800, true);
      centralView.setUint16(12, dosTime, true);
      centralView.setUint16(14, dosDate, true);
      centralView.setUint32(16, crc, true);
      centralView.setUint32(20, bytes.length, true);
      centralView.setUint32(24, bytes.length, true);
      centralView.setUint16(28, name.length, true);
      centralView.setUint32(42, offset, true);
      central.set(name, 46);
      parts.push(local, bytes);
      directory.push(central);
      offset += local.length + bytes.length;
    }
    const end = new Uint8Array(22),
      endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(8, entries.length, true);
    endView.setUint16(10, entries.length, true);
    endView.setUint32(
      12,
      directory.reduce((sum, entry) => sum + entry.length, 0),
      true,
    );
    endView.setUint32(16, offset, true);
    return new Blob([...parts, ...directory, end], { type: "application/zip" });
  }

  const api = { createZip, safeFilename };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.BV_FEEDBACK_PACK = api;
})(typeof window === "undefined" ? globalThis : window);
