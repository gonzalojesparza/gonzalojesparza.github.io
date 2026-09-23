(function () {
  "use strict";

  var PAGE_SIZES = { letter: [612, 792], a4: [595.28, 841.89] };
  var MARGINS = { none: 0, small: 18, normal: 36 };
  var QUALITY = {
    high: { jpeg: 0.92, maxSide: 0 },
    balanced: { jpeg: 0.85, maxSide: 3000 },
    small: { jpeg: 0.72, maxSide: 1800 }
  };
  // "Fit to image" pages get this long side, in points (11 in).
  var FIT_LONG_SIDE = 792;

  var ICONS = {
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
    rotate: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
    remove: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  var dropzone = document.getElementById("dropzone");
  var fileInput = document.getElementById("file-input");
  var list = document.getElementById("img-list");
  var toolbar = document.getElementById("toolbar");
  var countEl = document.getElementById("count");
  var settings = document.getElementById("settings");
  var createBtn = document.getElementById("create");
  var statusEl = document.getElementById("status");
  if (!dropzone || !list) return;

  var items = [];
  var nextId = 1;
  var draggingId = null;
  var busy = false;

  /* Adding images */

  function addFiles(files) {
    var added = 0;
    Array.prototype.forEach.call(files, function (file) {
      if (!file.type || file.type.indexOf("image/") !== 0) return;
      items.push({ id: nextId++, file: file, url: URL.createObjectURL(file), rotation: 0 });
      added++;
    });
    var skipped = files.length - added;
    setStatus(skipped ? skipped + " file(s) skipped because they aren't images." : "", !!skipped);
    render();
  }

  fileInput.addEventListener("change", function () {
    addFiles(fileInput.files);
    fileInput.value = "";
  });

  dropzone.addEventListener("click", function (event) {
    if (event.target === dropzone || event.target.classList.contains("dropzone-title")) fileInput.click();
  });

  function isFileDrag(event) {
    return event.dataTransfer && Array.prototype.indexOf.call(event.dataTransfer.types, "Files") !== -1;
  }

  ["dragenter", "dragover"].forEach(function (type) {
    document.addEventListener(type, function (event) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dropzone.classList.add("is-over");
    });
  });

  ["dragleave", "drop"].forEach(function (type) {
    document.addEventListener(type, function (event) {
      if (type === "dragleave" && event.relatedTarget) return;
      dropzone.classList.remove("is-over");
    });
  });

  document.addEventListener("drop", function (event) {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  });

  document.addEventListener("paste", function (event) {
    var files = event.clipboardData && event.clipboardData.files;
    if (files && files.length) {
      event.preventDefault();
      addFiles(files);
    }
  });

  /* List rendering and editing */

  function indexOfId(id) {
    for (var i = 0; i < items.length; i++) if (items[i].id === id) return i;
    return -1;
  }

  function move(id, delta) {
    var from = indexOfId(id);
    var to = from + delta;
    if (from < 0 || to < 0 || to >= items.length) return;
    items.splice(to, 0, items.splice(from, 1)[0]);
    render();
    focusControl(id, delta < 0 ? "left" : "right");
  }

  function focusControl(id, action) {
    var btn = list.querySelector('[data-id="' + id + '"] [data-action="' + action + '"]');
    if (btn && !btn.disabled) btn.focus();
  }

  function removeItem(id) {
    var i = indexOfId(id);
    if (i < 0) return;
    URL.revokeObjectURL(items[i].url);
    items.splice(i, 1);
    render();
  }

  function makeButton(action, label, disabled) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.action = action;
    btn.setAttribute("aria-label", label);
    btn.title = label;
    btn.innerHTML = ICONS[action];
    btn.disabled = !!disabled;
    return btn;
  }

  function render() {
    list.textContent = "";
    items.forEach(function (item, i) {
      var li = document.createElement("li");
      li.className = "img-item";
      li.draggable = true;
      li.dataset.id = item.id;

      var thumb = document.createElement("div");
      thumb.className = "img-thumb";
      var img = document.createElement("img");
      img.src = item.url;
      img.alt = "";
      img.style.transform = "rotate(" + item.rotation + "deg)";
      thumb.appendChild(img);

      var index = document.createElement("span");
      index.className = "img-index";
      index.textContent = i + 1;

      var name = document.createElement("p");
      name.className = "img-name";
      name.textContent = item.file.name || "Pasted image";
      name.title = name.textContent;

      var controls = document.createElement("div");
      controls.className = "img-controls";
      controls.appendChild(makeButton("left", "Move earlier", i === 0));
      controls.appendChild(makeButton("rotate", "Rotate 90 degrees"));
      controls.appendChild(makeButton("remove", "Remove"));
      controls.appendChild(makeButton("right", "Move later", i === items.length - 1));

      li.appendChild(thumb);
      li.appendChild(index);
      li.appendChild(name);
      li.appendChild(controls);
      list.appendChild(li);
    });

    toolbar.hidden = items.length === 0;
    countEl.textContent = items.length + (items.length === 1 ? " page" : " pages");
    createBtn.disabled = busy || items.length === 0;
  }

  list.addEventListener("click", function (event) {
    var btn = event.target.closest("button[data-action]");
    if (!btn) return;
    var id = Number(btn.closest(".img-item").dataset.id);
    var action = btn.dataset.action;
    if (action === "left") move(id, -1);
    else if (action === "right") move(id, 1);
    else if (action === "remove") removeItem(id);
    else if (action === "rotate") {
      var item = items[indexOfId(id)];
      item.rotation = (item.rotation + 90) % 360;
      render();
      focusControl(id, "rotate");
    }
  });

  list.addEventListener("dragstart", function (event) {
    var li = event.target.closest(".img-item");
    if (!li) return;
    draggingId = Number(li.dataset.id);
    li.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(draggingId));
  });

  list.addEventListener("dragover", function (event) {
    if (draggingId === null) return;
    var li = event.target.closest(".img-item");
    if (!li) return;
    event.preventDefault();
    list.querySelectorAll(".is-target").forEach(function (el) { el.classList.remove("is-target"); });
    if (Number(li.dataset.id) !== draggingId) li.classList.add("is-target");
  });

  list.addEventListener("drop", function (event) {
    if (draggingId === null) return;
    event.preventDefault();
    var li = event.target.closest(".img-item");
    if (!li) return;
    var from = indexOfId(draggingId);
    var to = indexOfId(Number(li.dataset.id));
    if (from !== to) {
      items.splice(to, 0, items.splice(from, 1)[0]);
      render();
    }
  });

  list.addEventListener("dragend", function () {
    draggingId = null;
    list.querySelectorAll(".is-dragging, .is-target").forEach(function (el) {
      el.classList.remove("is-dragging", "is-target");
    });
  });

  document.getElementById("sort-name").addEventListener("click", function () {
    var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    items.sort(function (a, b) { return collator.compare(a.file.name || "", b.file.name || ""); });
    render();
  });

  document.getElementById("clear-all").addEventListener("click", function () {
    items.forEach(function (item) { URL.revokeObjectURL(item.url); });
    items = [];
    setStatus("");
    render();
  });

  settings.size.addEventListener("change", function () {
    settings.orientation.disabled = settings.size.value === "fit";
  });
  settings.orientation.disabled = settings.size.value === "fit";
  settings.addEventListener("submit", function (event) { event.preventDefault(); });

  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", !!isError);
  }

  /* Image processing */

  function loadImage(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: "from-image" }).catch(function () {
        return loadWithElement(file);
      });
    }
    return loadWithElement(file);
  }

  function loadWithElement(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }

  function toJpeg(item, quality) {
    return loadImage(item.file).then(function (source) {
      var w = source.width;
      var h = source.height;
      var scale = quality.maxSide && Math.max(w, h) > quality.maxSide ? quality.maxSide / Math.max(w, h) : 1;
      var sw = Math.round(w * scale);
      var sh = Math.round(h * scale);
      var sideways = item.rotation === 90 || item.rotation === 270;

      var canvas = document.createElement("canvas");
      canvas.width = sideways ? sh : sw;
      canvas.height = sideways ? sw : sh;
      var ctx = canvas.getContext("2d");
      // JPEG has no transparency, so flatten onto white.
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((item.rotation * Math.PI) / 180);
      ctx.drawImage(source, -sw / 2, -sh / 2, sw, sh);
      if (source.close) source.close();

      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob) return reject(new Error("encode"));
          blob.arrayBuffer().then(function (buf) {
            resolve({ bytes: new Uint8Array(buf), width: canvas.width, height: canvas.height });
          }, reject);
        }, "image/jpeg", quality.jpeg);
      });
    });
  }

  /* Minimal PDF writer: one JPEG per page */

  function layoutPage(image, opts) {
    var margin = MARGINS[opts.margin];
    var pw, ph;
    if (opts.size === "fit") {
      var s = FIT_LONG_SIDE / Math.max(image.width, image.height);
      pw = image.width * s + margin * 2;
      ph = image.height * s + margin * 2;
    } else {
      pw = PAGE_SIZES[opts.size][0];
      ph = PAGE_SIZES[opts.size][1];
      var landscape = opts.orientation === "landscape" ||
        (opts.orientation === "auto" && image.width > image.height);
      if (landscape) { var t = pw; pw = ph; ph = t; }
    }
    var scale = Math.min((pw - margin * 2) / image.width, (ph - margin * 2) / image.height);
    var dw = image.width * scale;
    var dh = image.height * scale;
    return { pw: pw, ph: ph, dx: (pw - dw) / 2, dy: (ph - dh) / 2, dw: dw, dh: dh };
  }

  function num(n) {
    return String(Math.round(n * 100) / 100);
  }

  function buildPdf(images, opts) {
    var encoder = new TextEncoder();
    var chunks = [];
    var length = 0;
    var offsets = [];

    function write(data) {
      var bytes = typeof data === "string" ? encoder.encode(data) : data;
      chunks.push(bytes);
      length += bytes.length;
    }

    function object(id, parts) {
      offsets[id] = length;
      write(id + " 0 obj\n");
      parts.forEach(write);
      write("\nendobj\n");
    }

    var objectCount = 2 + images.length * 3;
    var kids = images.map(function (_, i) { return (3 + i * 3) + " 0 R"; }).join(" ");

    write("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n");
    object(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
    object(2, ["<< /Type /Pages /Kids [" + kids + "] /Count " + images.length + " >>"]);

    images.forEach(function (image, i) {
      var pageId = 3 + i * 3;
      var contentId = pageId + 1;
      var imageId = pageId + 2;
      var box = layoutPage(image, opts);
      var content = "q " + num(box.dw) + " 0 0 " + num(box.dh) + " " + num(box.dx) + " " + num(box.dy) + " cm /Im0 Do Q";

      object(pageId, [
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + num(box.pw) + " " + num(box.ph) + "]" +
        " /Resources << /XObject << /Im0 " + imageId + " 0 R >> >> /Contents " + contentId + " 0 R >>"
      ]);
      object(contentId, ["<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream"]);
      object(imageId, [
        "<< /Type /XObject /Subtype /Image /Width " + image.width + " /Height " + image.height +
        " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + image.bytes.length + " >>\nstream\n",
        image.bytes,
        "\nendstream"
      ]);
    });

    var xrefOffset = length;
    var xref = "xref\n0 " + (objectCount + 1) + "\n0000000000 65535 f \n";
    for (var id = 1; id <= objectCount; id++) {
      xref += String(offsets[id]).padStart(10, "0") + " 00000 n \n";
    }
    write(xref);
    write("trailer\n<< /Size " + (objectCount + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefOffset + "\n%%EOF\n");

    return new Blob(chunks, { type: "application/pdf" });
  }

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function fileName() {
    var name = settings.filename.value.trim().replace(/[\\/:*?"<>|]+/g, "-") || "images";
    return /\.pdf$/i.test(name) ? name : name + ".pdf";
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }

  createBtn.addEventListener("click", function () {
    if (busy || !items.length) return;
    busy = true;
    createBtn.disabled = true;

    var opts = {
      size: settings.size.value,
      orientation: settings.orientation.value,
      margin: settings.margin.value
    };
    var quality = QUALITY[settings.quality.value];
    var queue = items.slice();
    var images = [];
    var failed = [];

    function next(i) {
      if (i >= queue.length) return Promise.resolve();
      setStatus("Processing image " + (i + 1) + " of " + queue.length + "...");
      return toJpeg(queue[i], quality).then(function (image) {
        images.push(image);
      }, function () {
        failed.push(queue[i].file.name || "pasted image");
      }).then(function () { return next(i + 1); });
    }

    next(0).then(function () {
      if (!images.length) throw new Error("none");
      var blob = buildPdf(images, opts);
      download(blob, fileName());
      var message = "Done: " + images.length + (images.length === 1 ? " page, " : " pages, ") + formatSize(blob.size) + ".";
      if (failed.length) message += " Skipped (couldn't read): " + failed.join(", ") + ".";
      setStatus(message, failed.length > 0);
    }).catch(function () {
      setStatus("Couldn't read any of these images. HEIC photos only open in Safari; convert them to JPG first.", true);
    }).then(function () {
      busy = false;
      render();
    });
  });

  render();
})();
