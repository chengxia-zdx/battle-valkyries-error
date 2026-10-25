(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const form = $("#report-form");
  const logInput = $("#log-file"),
    imageInput = $("#screenshot-files"),
    noLog = $("#no-log");
  const errorElement = $("#attachment-error"),
    status = $("#form-status"),
    downloadButton = $("#download-button");
  const dialog = $("#success-dialog");
  const { validateFiles, buildReport } = window.BV_FEEDBACK_MODEL;
  let log = null,
    images = [],
    busy = false,
    thumbnailUrls = [],
    downloadUrl = "",
    downloadName = "";
  const activeLog = () => (noLog.checked ? null : log);
  const totalBytes = () =>
    [activeLog(), ...images]
      .filter(Boolean)
      .reduce((sum, file) => sum + file.size, 0);
  const sizeLabel = (bytes) =>
    bytes >= 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
      : `${Math.max(0.1, bytes / 1024).toFixed(1)} KB`;

  function svg(name) {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    element.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#i-${name}`);
    element.append(use);
    return element;
  }
  function removeButton(label, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "remove-file";
    button.setAttribute("aria-label", label);
    button.append(svg("close"));
    button.disabled = busy;
    button.addEventListener("click", action);
    return button;
  }
  function showError(message, focus = false) {
    errorElement.textContent = message;
    errorElement.hidden = !message;
    if (message && focus) {
      errorElement.tabIndex = -1;
      errorElement.focus();
    }
  }
  function updateFiles() {
    thumbnailUrls.forEach((url) => URL.revokeObjectURL(url));
    thumbnailUrls = [];
    const logList = $("#log-list"),
      imageList = $("#image-list");
    logList.replaceChildren();
    imageList.replaceChildren();
    if (activeLog()) {
      const row = document.createElement("div"),
        info = document.createElement("span"),
        name = document.createElement("strong"),
        size = document.createElement("small");
      row.className = "file-row";
      name.textContent = log.name;
      size.textContent = `${sizeLabel(log.size)} · 原始日志已就绪`;
      info.append(name, size);
      row.append(
        svg("file"),
        info,
        removeButton(`移除日志 ${log.name}`, () => {
          log = null;
          showError("");
          updateFiles();
        }),
      );
      logList.append(row);
    }
    images.forEach((file, index) => {
      const tile = document.createElement("div"),
        image = document.createElement("img"),
        name = document.createElement("span");
      tile.className = "image-tile";
      const url = URL.createObjectURL(file);
      thumbnailUrls.push(url);
      image.src = url;
      image.alt = `附件预览：${file.name}`;
      name.textContent = file.name;
      name.title = `${file.name} · ${sizeLabel(file.size)}`;
      tile.append(
        image,
        name,
        removeButton(`移除图片 ${file.name}`, () => {
          images.splice(index, 1);
          showError("");
          updateFiles();
        }),
      );
      imageList.append(tile);
    });
    $("#image-count").textContent = `${images.length} / 5`;
    $("#package-images").textContent = images.length
      ? `已添加 ${images.length} 张 · ${sizeLabel(images.reduce((sum, file) => sum + file.size, 0))}`
      : "尚未添加 · 选填";
    const packageLog = $("#package-log"),
      detail = document.createElement("small");
    packageLog.textContent = noLog.checked ? "未提供游戏日志" : "游戏原始日志";
    detail.textContent = noLog.checked
      ? "将在反馈说明中标记缺失"
      : log
        ? `${log.name} · ${sizeLabel(log.size)}`
        : "等待添加";
    packageLog.append(detail);
    $("#log-state").classList.toggle("ready", !!activeLog());
    const total = $("#total-size"),
      limit = document.createElement("span");
    total.textContent = `${totalBytes() ? (totalBytes() / 1024 / 1024).toFixed(2) : "0"} MB `;
    limit.textContent = "/ 50 MB";
    total.append(limit);
    logInput.disabled = noLog.checked || busy;
    $("#log-dropzone").classList.toggle("disabled", noLog.checked);
  }
  function addFiles(kind, files) {
    if (busy || !files.length) return;
    if (kind === "log" && noLog.checked) return;
    if (kind === "log" && files.length > 1) {
      showError("每次请选择一个游戏日志文件。");
      return;
    }
    const nextLog = kind === "log" ? files[0] : activeLog();
    const nextImages = kind === "images" ? [...images, ...files] : images;
    const error = validateFiles(nextLog, nextImages, true);
    if (error) {
      showError(error);
      return;
    }
    if (kind === "log") log = nextLog;
    else images = nextImages;
    showError("");
    updateFiles();
  }
  logInput.addEventListener("change", () => {
    addFiles("log", [...logInput.files]);
    logInput.value = "";
  });
  imageInput.addEventListener("change", () => {
    addFiles("images", [...imageInput.files]);
    imageInput.value = "";
  });
  noLog.addEventListener("change", () => {
    showError("");
    updateFiles();
  });
  for (const [id, kind] of [
    ["#log-dropzone", "log"],
    ["#image-dropzone", "images"],
  ]) {
    const zone = $(id);
    let depth = 0;
    zone.addEventListener("dragenter", (event) => {
      event.preventDefault();
      depth++;
      if (!busy) zone.classList.add("dragover");
    });
    zone.addEventListener("dragover", (event) => event.preventDefault());
    zone.addEventListener("dragleave", () => {
      if (--depth <= 0) {
        depth = 0;
        zone.classList.remove("dragover");
      }
    });
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      depth = 0;
      zone.classList.remove("dragover");
      addFiles(kind, [...event.dataTransfer.files]);
    });
  }
  // Prevent dropping outside a picker from navigating away and losing the report.
  document.addEventListener("dragover", (event) => {
    if (event.dataTransfer.types.includes("Files")) event.preventDefault();
  });
  document.addEventListener("drop", (event) => {
    if (event.dataTransfer.types.includes("Files")) event.preventDefault();
  });
  form.addEventListener("change", (event) => {
    if (event.target.name !== "environment") return;
    const other = form.elements.environment.value === "other";
    $("#other-environment-field").hidden = !other;
    form.elements.environmentOther.required = other;
    const legends = form.elements.environment.value === "legends";
    $("#legends-pack-field").hidden = !legends;
    form.elements.legendsPack.required = legends;
    form.elements.legendsPack.disabled = !legends;
  });
  $("#description").addEventListener("input", (event) => {
    $("#description-count").textContent = `${event.target.value.length} / 8000`;
  });
  $("#copy-path").addEventListener("click", async () => {
    const command = $("#copy-path code").textContent;
    try {
      await navigator.clipboard.writeText(command);
      $("#copy-status").textContent = "已复制，按 Win + R 后粘贴即可。";
    } catch {
      $("#copy-status").textContent = `请手动复制上方命令：${command}。`;
    }
  });
  function triggerDownload() {
    if (!downloadUrl) return;
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = downloadName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const fields = Object.fromEntries(
      [
        "description",
        "environment",
        "valkyriesVersion",
        "enchantmentVersion",
      ].map((name) => [name, form.elements[name].value.trim()]),
    );
    if (fields.environment === "other")
      fields.environmentOther = form.elements.environmentOther.value.trim();
    if (fields.environment === "legends")
      fields.legendsPack = form.elements.legendsPack.value.trim();
    if (noLog.checked) fields.noLog = "on";
    for (const [name, value] of Object.entries(fields)) {
      if (!value) {
        form.elements[name].value = "";
        form.reportValidity();
        return;
      }
    }
    const selectedLog = activeLog(),
      selectedImages = [...images];
    const error = validateFiles(selectedLog, selectedImages, noLog.checked);
    showError(error, true);
    if (error) return;
    const controls = [
      ...form.querySelectorAll("input, textarea, select, button"),
    ].map((element) => ({ element, disabled: element.disabled }));
    busy = true;
    controls.forEach(({ element }) => {
      element.disabled = true;
    });
    form.setAttribute("aria-busy", "true");
    downloadButton.querySelector("span").textContent = "正在整理文件…";
    status.classList.remove("is-error");
    status.textContent = "正在本地生成反馈包，请稍候…";
    try {
      // Let the busy state paint before reading and checksumming attachments.
      await new Promise((resolve) =>
        requestAnimationFrame(() => setTimeout(resolve, 0)),
      );
      const created = new Date();
      const { entries, filename } = buildReport(
        fields,
        selectedLog,
        selectedImages,
        window.BV_FEEDBACK_PACK,
        created,
      );
      const zip = await window.BV_FEEDBACK_PACK.createZip(entries, created);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = URL.createObjectURL(zip);
      downloadName = filename;
      triggerDownload();
      $("#download-name").textContent = filename;
      status.textContent = "反馈包已生成，请将下载的 ZIP 通过 QQ 发给作者。";
      dialog.showModal();
    } catch (error) {
      console.error("Failed to generate feedback package", error);
      status.classList.add("is-error");
      status.textContent =
        "反馈包生成失败。填写的信息已保留，请重新选择附件后再试。";
    } finally {
      busy = false;
      controls.forEach(({ element, disabled }) => {
        element.disabled = disabled;
      });
      downloadButton.querySelector("span").textContent = "生成并下载反馈包";
      form.removeAttribute("aria-busy");
    }
  });
  $("#close-dialog").addEventListener("click", () => dialog.close());
  $("#finish-button").addEventListener("click", () => dialog.close());
  $("#redownload-button").addEventListener("click", triggerDownload);
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  });
  window.addEventListener("pagehide", () => {
    thumbnailUrls.forEach((url) => URL.revokeObjectURL(url));
    thumbnailUrls = [];
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = "";
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) updateFiles();
  });
  updateFiles();
})();
