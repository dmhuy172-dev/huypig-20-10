
/* Hiệu ứng bổ sung — không thay đổi thuật toán vẽ hoa */

(() => {
  // Tạo lớp hiệu ứng phía trên nền, không chặn thao tác chạm
  const fx = document.createElement("div");
  fx.id = "romantic-fx";
  document.body.appendChild(fx);

  // Tạo các đom đóm chuyển động
  for (let i = 0; i < 24; i++) {
    const light = document.createElement("span");
    light.className = "firefly";

    light.style.left = `${Math.random() * 100}%`;
    light.style.top = `${Math.random() * 100}%`;
    light.style.setProperty("--delay", `${Math.random() * -12}s`);
    light.style.setProperty(
      "--duration",
      `${5 + Math.random() * 8}s`
    );
    light.style.setProperty(
      "--drift",
      `${-35 + Math.random() * 70}px`
    );

    fx.appendChild(light);
  }

  // Lấp lánh tại vị trí chạm hoặc nhấp chuột
  document.addEventListener("pointerdown", (event) => {
    // Không tạo hiệu ứng khi bấm nút điều khiển
    if (event.target.closest("button, input, textarea, a")) return;

    const sparkle = document.createElement("span");
    sparkle.className = "touch-sparkle";
    sparkle.textContent = "✦";
    sparkle.style.left = `${event.clientX}px`;
    sparkle.style.top = `${event.clientY}px`;

    fx.appendChild(sparkle);
    sparkle.addEventListener("animationend", () => sparkle.remove());
  });

  // Tôn trọng cài đặt giảm chuyển động của người dùng
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    fx.classList.add("reduce-motion");
  }
})();
