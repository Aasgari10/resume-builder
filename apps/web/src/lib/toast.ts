// A short message at the bottom of the screen that fades out by itself ("saved in My resumes").
// It lives outside React, so it stays visible while the page changes route.

export function toast(text: string, ms = 3200) {
  document.querySelector(".app-toast")?.remove();
  const el = document.createElement("div");
  el.className = "app-toast";
  el.setAttribute("role", "status");
  el.textContent = text;
  document.body.append(el);
  setTimeout(() => el.classList.add("out"), ms);
  setTimeout(() => el.remove(), ms + 400);
}
