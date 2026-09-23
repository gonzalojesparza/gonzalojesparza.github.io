(function () {
  "use strict";

  var MUSIC_SRC = "assets/music/brasilian-skies.mp3";
  var MUSIC_VOLUME = 0.35;
  var SIZZLE_VOLUME = 0.22;
  var MUSIC_KEY = "music-on";
  var MUSIC_TIME_KEY = "music-time";
  var SFX_KEY = "sfx-on";

  var ICON_MUSIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18a3 3 0 1 1-2-2.83V5l12-2v11a3 3 0 1 1-2-2.83V6.3L9 7.7V18z"/></svg>';
  var ICON_SFX = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM16 8.5a5 5 0 0 1 0 7l-1.4-1.4a3 3 0 0 0 0-4.2zM18.8 5.7a9 9 0 0 1 0 12.6l-1.4-1.4a7 7 0 0 0 0-9.8z"/></svg>';

  function readPref(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value === null ? fallback : value === "1";
    } catch (e) {
      return fallback;
    }
  }

  function writePref(key, on) {
    try { localStorage.setItem(key, on ? "1" : "0"); } catch (e) {}
  }

  // Browsers only allow audio after a click or key press, so defer until one happens.
  var pendingGesture = [];
  function onFirstGesture(fn) {
    pendingGesture.push(fn);
  }
  function flushGesture() {
    var queue = pendingGesture;
    pendingGesture = [];
    queue.forEach(function (fn) { fn(); });
  }
  ["pointerdown", "keydown"].forEach(function (type) {
    window.addEventListener(type, flushGesture, true);
  });

  function makeButton(label, icon, pressed) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sound-btn";
    btn.setAttribute("aria-pressed", String(pressed));
    btn.innerHTML = icon + "<span>" + label + "</span>";
    return btn;
  }

  /* Background music */

  var music = new Audio();
  music.src = MUSIC_SRC;
  music.loop = true;
  music.preload = "none";
  music.volume = MUSIC_VOLUME;
  var musicOn = readPref(MUSIC_KEY, false);

  function restoreMusicTime() {
    var t = 0;
    try { t = parseFloat(sessionStorage.getItem(MUSIC_TIME_KEY)) || 0; } catch (e) {}
    if (t > 0) {
      music.addEventListener("loadedmetadata", function () {
        if (t < music.duration) music.currentTime = t;
      }, { once: true });
    }
  }

  function playMusic() {
    var attempt = music.play();
    if (attempt && attempt.catch) {
      attempt.catch(function () {
        if (musicOn) onFirstGesture(playMusic);
      });
    }
  }

  window.addEventListener("pagehide", function () {
    try {
      sessionStorage.setItem(MUSIC_TIME_KEY, musicOn ? String(music.currentTime) : "0");
    } catch (e) {}
  });

  /* Sizzle sound, synthesized so no extra audio file is needed */

  var ctx = null;
  var sizzleBuffer = null;
  var sfxOn = readPref(SFX_KEY, true);
  var activeSizzle = null;

  function ensureContext() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return;
    }
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
    sizzleBuffer = buildSizzleBuffer(ctx);
  }

  function buildSizzleBuffer(context) {
    var seconds = 3;
    var rate = context.sampleRate;
    var buffer = context.createBuffer(1, seconds * rate, rate);
    var data = buffer.getChannelData(0);
    var crackle = 0;
    var bed = 0;
    for (var i = 0; i < data.length; i++) {
      var white = Math.random() * 2 - 1;
      bed = 0.9 * bed + 0.1 * white;
      if (Math.random() < 0.0009) crackle = 0.6 + Math.random() * 0.4;
      crackle *= 0.985;
      var swell = 0.75 + 0.25 * Math.sin((i / rate) * Math.PI * 2 * 0.7);
      data[i] = (white * 0.22 + bed * 0.35) * swell + white * crackle;
    }
    // Crossfade the ends so the loop has no click.
    var fade = Math.floor(rate * 0.05);
    for (var j = 0; j < fade; j++) {
      var g = j / fade;
      data[j] = data[j] * g + data[data.length - fade + j] * (1 - g);
    }
    return buffer;
  }

  function startSizzle() {
    if (!sfxOn || !ctx || ctx.state !== "running" || activeSizzle) return;
    var source = ctx.createBufferSource();
    source.buffer = sizzleBuffer;
    source.loop = true;
    source.loopEnd = sizzleBuffer.duration - 0.05;
    source.playbackRate.value = 0.9 + Math.random() * 0.2;

    var highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 1800;
    var lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 9000;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(SIZZLE_VOLUME, ctx.currentTime + 0.08);

    source.connect(highpass).connect(lowpass).connect(gain).connect(ctx.destination);
    source.start(0, Math.random() * 2);
    activeSizzle = { source: source, gain: gain };
  }

  function stopSizzle() {
    if (!activeSizzle) return;
    var current = activeSizzle;
    activeSizzle = null;
    var now = ctx.currentTime;
    current.gain.gain.cancelScheduledValues(now);
    current.gain.gain.setValueAtTime(current.gain.gain.value, now);
    current.gain.gain.linearRampToValueAtTime(0, now + 0.35);
    current.source.stop(now + 0.4);
  }

  function initSizzle() {
    var foods = document.querySelectorAll(".food");
    if (!foods.length) return false;

    ["pointerdown", "keydown"].forEach(function (type) {
      window.addEventListener(type, ensureContext, true);
    });

    foods.forEach(function (food) {
      food.addEventListener("pointerenter", startSizzle);
      food.addEventListener("pointerleave", stopSizzle);
      food.addEventListener("focus", startSizzle);
      food.addEventListener("blur", stopSizzle);
    });
    window.addEventListener("pagehide", stopSizzle);
    return true;
  }

  /* Controls */

  function initControls() {
    var hasFood = initSizzle();
    var bar = document.createElement("div");
    bar.className = "sound-controls";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Sound");

    var musicBtn = makeButton("Music", ICON_MUSIC, musicOn);
    musicBtn.addEventListener("click", function () {
      musicOn = !musicOn;
      writePref(MUSIC_KEY, musicOn);
      musicBtn.setAttribute("aria-pressed", String(musicOn));
      if (musicOn) {
        playMusic();
      } else {
        music.pause();
      }
    });
    bar.appendChild(musicBtn);

    if (hasFood) {
      var sfxBtn = makeButton("Sizzle", ICON_SFX, sfxOn);
      sfxBtn.addEventListener("click", function () {
        sfxOn = !sfxOn;
        writePref(SFX_KEY, sfxOn);
        sfxBtn.setAttribute("aria-pressed", String(sfxOn));
        if (!sfxOn) stopSizzle();
      });
      bar.appendChild(sfxBtn);
    }

    document.body.appendChild(bar);

    if (musicOn) {
      restoreMusicTime();
      playMusic();
    }
  }

  initControls();
})();
