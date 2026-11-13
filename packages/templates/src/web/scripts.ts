// The few small scripts a template may run on its published pages. Published sites allow no other
// script: each of these is listed in the page's Content-Security-Policy by its SHA-256 hash, so only
// this exact text can run (never anything from user content). Each one is the body of a function of
// `document`: the published page runs it on its document, the editor's preview on the preview frame.
// Plain ES2017, written to be safe to run again (every element it sets up is marked once).

/** Tanin (music studio): the hero's song player, and studio tabs that follow the pointer. */
export const TANIN_SCRIPT = `
var fa = function (n) { return String(n).replace(/\\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; }); };
var time = function (s) { s = Math.max(0, Math.floor(s || 0)); return fa(String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0")); };
document.querySelectorAll("[data-tn-player]").forEach(function (box) {
  if (box.getAttribute("data-on")) return;
  box.setAttribute("data-on", "1");
  var audio = box.querySelector("audio");
  if (!audio) return;
  var cur = box.querySelector("[data-cur]"), dur = box.querySelector("[data-dur]"), bar = box.querySelector("[data-bar]"), fill = box.querySelector("[data-fill]");
  box.classList.add("js");
  var draw = function () {
    var d = audio.duration || 0;
    if (dur && d) dur.textContent = time(d);
    if (cur) cur.textContent = time(audio.currentTime);
    if (fill) fill.style.width = (d ? (audio.currentTime / d) * 100 : 0) + "%";
  };
  audio.addEventListener("loadedmetadata", draw);
  audio.addEventListener("timeupdate", draw);
  audio.addEventListener("play", function () { box.classList.add("playing"); });
  audio.addEventListener("pause", function () { box.classList.remove("playing"); });
  audio.addEventListener("ended", function () { box.classList.remove("playing"); audio.currentTime = 0; draw(); });
  box.querySelectorAll("[data-act]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var act = b.getAttribute("data-act");
      if (act === "play") { if (audio.paused) audio.play(); else audio.pause(); }
      else audio.currentTime = Math.max(0, Math.min((audio.duration || 0) - 0.1, audio.currentTime + (act === "fwd" ? 10 : -10)));
    });
  });
  if (bar) bar.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    var r = bar.getBoundingClientRect();
    // Right to left: the start of the song is at the right end of the bar.
    var at = (r.right - e.clientX) / r.width;
    if (audio.duration) audio.currentTime = Math.max(0, Math.min(1, at)) * audio.duration;
  });
  if (audio.readyState >= 1) draw();
});
document.querySelectorAll("[data-tn-snap]").forEach(function (row) {
  if (row.getAttribute("data-on")) return;
  row.setAttribute("data-on", "1");
  var dots = row.parentElement && row.parentElement.querySelector("[data-tn-dots]");
  if (!dots) return;
  var marks = Array.prototype.slice.call(dots.children);
  var items = Array.prototype.slice.call(row.children);
  var show = function () {
    var mid = row.getBoundingClientRect().left + row.clientWidth / 2, best = 0, gap = Infinity;
    items.forEach(function (el, i) { var r = el.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < gap) { gap = d; best = i; } });
    marks.forEach(function (m, i) { m.classList.toggle("on", i === best); });
  };
  row.addEventListener("scroll", function () { window.requestAnimationFrame(show); }, { passive: true });
  marks.forEach(function (m, i) {
    m.addEventListener("click", function () { if (items[i]) items[i].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); });
  });
  show();
});
document.querySelectorAll(".tn-tab-list label[for]").forEach(function (label) {
  if (label.getAttribute("data-on")) return;
  label.setAttribute("data-on", "1");
  label.addEventListener("mouseenter", function () {
    var radio = document.querySelector("#" + label.getAttribute("for"));
    if (radio) radio.checked = true;
  });
});
`;

/** Every script a published page may run, for the page's Content-Security-Policy. */
export const SITE_SCRIPTS: string[] = [TANIN_SCRIPT];

/** The inline script element text of a page script: its body, run on the page's document. */
export const inlineScript = (body: string) => `(function (document) {${body}})(document);`;
