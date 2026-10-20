
(() => {
  'use strict';

  const STORAGE_KEY = 'flower.greeting.20-10.v1';

  const defaultGreeting = {
    recipient: 'Thanh Hải',

message: `Có những điều đẹp đẽ chẳng cần phải quá rực rỡ, chỉ cần hiện diện thôi cũng khiến cảm thấy bình yên.

Nhân ngày hôm nay, anh chúc em nhỏ luôn vui vẻ, luôn được yêu thương. Mong em sẽ có thật nhiều lý do để mỉm cười, có đủ dũng khí để theo đuổi những điều mình mong muốn và luôn tự tin với con đường mà mình lựa chọn.

Mong cuộc sống sẽ dịu dàng với em hơn một chút, những ngày mệt mỏi sẽ ít đi, những lúc chênh vênh sẽ có nơi để trở về. Mong mọi cố gắng của em đều được đền đáp, mọi ước mơ đều dần thành hiện thực và những điều bình thường nhất cũng có thể mang đến cho em niềm vui.

Chúc em nhỏ không chỉ có một ngày thật vui, mà còn có thật nhiều ngày sau này ngập tràn bình yên. Hãy cứ là em, cứ dịu dàng và cứ rạng rỡ  nhé.`,

sender: 'Anh gửi em nhỏ  ♡'
  };

  const $ = id => document.getElementById(id);

  const dialog = $('greetingCard');
  const openButton = $('openCard');
  const reading = $('cardReading');
  const editor = $('cardEditor');
  const editButton = $('editCard');
  const status = $('cardStatus');
  const closeButton = $('closeCard');
  const messageElement = $('cardMessage');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopLayout = window.matchMedia('(min-width: 1100px)');

  if (!dialog || !openButton || !reading || !messageElement) {
    console.error('Thiếu phần tử HTML cần thiết để hiển thị thiệp.');
    return;
  }

  const sceneElements = [
    ...document.querySelectorAll('.bouquet-composition, .scene-footer')
  ];
  const layoutAnimations = new Set();

  const album = $('memoryAlbum');
  const albumToggle = $('toggleAlbum');
  let albumRevealPromise;

  function revealAlbum() {
    if (!album) return Promise.resolve();
    if (albumRevealPromise) return albumRevealPromise;

    const photos = [...album.querySelectorAll('img')];
    photos.forEach(photo => {
      photo.loading = 'eager';
    });

    albumRevealPromise = Promise.resolve(window.albumPhotosReady)
      .then(() => Promise.allSettled(
        photos.map(photo => photo.decode())
      ))
      .then(() => {
        album.hidden = false;

        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) {
              album.classList.add('is-revealed');
              observer.disconnect();
            }
          }, { threshold: 0.08 });

          observer.observe(album);
        } else {
          album.classList.add('is-revealed');
        }
      });

    return albumRevealPromise;
  }

  if (albumToggle && album) {
    albumToggle.addEventListener('click', () => {
      const expanded = album.classList.toggle('is-spread');
      albumToggle.setAttribute('aria-expanded', String(expanded));
      albumToggle.innerHTML = expanded
        ? 'Gấp album <span aria-hidden="true">♡</span>'
        : 'Xòe album <span aria-hidden="true">♡</span>';
    });
  }

  const viewAlbumButton = $('viewAlbum');

  if (viewAlbumButton && albumToggle) {
    viewAlbumButton.addEventListener('click', async () => {
      await revealAlbum();
      if (!album) return;

      album.classList.add('is-revealed');
      album.scrollIntoView({
        behavior: motion.matches ? 'auto' : 'smooth',
        block: 'start'
      });

      albumToggle.focus({ preventScroll: true });
    });
  }

  function reflowScene(changeLayout) {
    layoutAnimations.forEach(animation => animation.cancel());
    layoutAnimations.clear();

    const before = sceneElements.map(element => {
      const rect = element.getBoundingClientRect();

      return {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      };
    });

    changeLayout();

    if (motion.matches) return;

    sceneElements.forEach((element, index) => {
      const after = element.getBoundingClientRect();
      if (!after.width || !after.height) return;

      const dx = before[index].left - after.left - window.scrollX;
      const dy = before[index].top - after.top - window.scrollY;

      const scale = element.matches('.bouquet-composition')
        ? ` scale(${before[index].width / after.width}, ${before[index].height / after.height})`
        : '';

      const animation = element.animate([
        { transform: `translate(${dx}px, ${dy}px)${scale}` },
        { transform: 'none' }
      ], {
        duration: 600,
        easing: 'cubic-bezier(.2,.8,.2,1)'
      });

      layoutAnimations.add(animation);
      animation.onfinish = () => layoutAnimations.delete(animation);
    });
  }

  function revealCard() {
    const rect = dialog.getBoundingClientRect();

    if (
      !desktopLayout.matches ||
      rect.top < 16 ||
      rect.top > window.innerHeight * 0.35 ||
      rect.bottom > window.innerHeight - 16
    ) {
      dialog.scrollIntoView({
        behavior: motion.matches ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  }

  const inputs = {
    recipient: $('recipientInput'),
    message: $('messageInput'),
    sender: $('senderInput')
  };

  let greeting = { ...defaultGreeting };

  // Đọc lời chúc đã lưu nếu dữ liệu hợp lệ.
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (
      saved &&
      Object.keys(inputs).every(key =>
        inputs[key] &&
        typeof saved[key] === 'string' &&
        saved[key].trim().length > 0 &&
        saved[key].length <= inputs[key].maxLength
      )
    ) {
      greeting = Object.fromEntries(
        Object.keys(inputs).map(key => [key, saved[key].trim()])
      );
    }
  } catch {
    // Dùng lời chúc mặc định nếu không đọc được dữ liệu đã lưu.
  }

  function renderGreeting() {
    const recipientElement = $('cardRecipient');
    const senderElement = $('cardSender');

    if (recipientElement) {
      recipientElement.textContent = greeting.recipient;
    }

    // Tách đoạn theo dòng trống, không tạo thêm khoảng cách từ xuống dòng đơn.
    const paragraphs = greeting.message
      .trim()
      .split(/\n\s*\n/)
      .filter(text => text.trim())
      .map(text => {
        const paragraph = document.createElement('span');
        paragraph.className = 'message-paragraph';
        paragraph.textContent = text.trim();
        return paragraph;
      });

    messageElement.replaceChildren(...paragraphs);

    if (senderElement) {
      senderElement.textContent = greeting.sender;
    }
  }

  function showReading() {
    reading.hidden = false;

    if (editor) editor.hidden = true;

    dialog.setAttribute('aria-labelledby', 'cardTitle');
    dialog.scrollTop = 0;
  }

  function setCardOpen(open) {
    if (dialog.open === open) return;

    reflowScene(() => {
      if (open) {
        showReading();

        if (status) status.textContent = '';

        document.body.classList.add('card-open');
        dialog.show();
      } else {
        dialog.close();
        document.body.classList.remove('card-open');
        showReading();
      }

      openButton.setAttribute('aria-expanded', String(open));

      const action = openButton.querySelector('.envelope-action');
      if (action) action.textContent = open ? 'Gấp thiệp' : 'Mở thiệp';
    });

    if (open) {
      if (closeButton) closeButton.focus({ preventScroll: true });

      revealAlbum();
      revealCard();
      document.dispatchEvent(new Event('bouquet:celebrate'));
    } else {
      openButton.focus({ preventScroll: true });

      const rect = openButton.getBoundingClientRect();

      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        openButton.scrollIntoView({
          behavior: motion.matches ? 'auto' : 'smooth',
          block: 'center'
        });
      }
    }
  }

  motion.addEventListener('change', () => {
    if (motion.matches) {
      layoutAnimations.forEach(animation => animation.cancel());
      layoutAnimations.clear();
    }
  });

  document.addEventListener('bouquet:ready', () => {
    openButton.hidden = false;
  });

  document.addEventListener('bouquet:rose', event => {
    const wish = $('roseWish');
    if (!wish || !event.detail?.message) return;

    wish.classList.remove('is-new');
    wish.textContent = event.detail.message;
    void wish.offsetWidth;
    wish.classList.add('is-new');
  });

  const replayButton = $('replayBloom');

  if (replayButton) {
    replayButton.addEventListener('click', () => {
      document.dispatchEvent(new Event('bouquet:replay'));

      const wish = $('roseWish');
      if (wish) wish.textContent = '';
    });
  }

  openButton.addEventListener('click', () => {
    setCardOpen(!dialog.open);
  });

  if (closeButton) {
    closeButton.addEventListener('click', () => setCardOpen(false));
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dialog.open && !event.defaultPrevented) {
      event.preventDefault();
      setCardOpen(false);
    }
  });

  dialog.addEventListener('close', () => {
    if (dialog.open || !document.body.classList.contains('card-open')) return;

    document.body.classList.remove('card-open');
    openButton.setAttribute('aria-expanded', 'false');

    const action = openButton.querySelector('.envelope-action');
    if (action) action.textContent = 'Mở thiệp';

    showReading();
  });

  // Chỉ bật chức năng sửa thiệp nếu HTML có đủ phần tử.
  if (editor && editButton && inputs.recipient && inputs.message && inputs.sender) {
    editButton.addEventListener('click', () => {
      Object.keys(inputs).forEach(key => {
        inputs[key].value = greeting[key];
        inputs[key].setCustomValidity('');
      });

      reading.hidden = true;
      editor.hidden = false;

      if (status) status.textContent = '';

      dialog.setAttribute('aria-labelledby', 'editorTitle');
      dialog.scrollTop = 0;
      inputs.recipient.focus({ preventScroll: true });
      revealCard();
    });

    const cancelButton = $('cancelEdit');

    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        showReading();
        editButton.focus({ preventScroll: true });
        revealCard();
      });
    }

    Object.values(inputs).forEach(input => {
      input.addEventListener('input', () => input.setCustomValidity(''));
    });

    editor.addEventListener('submit', event => {
      event.preventDefault();

      for (const input of Object.values(inputs)) {
        input.setCustomValidity(
          input.value.trim() ? '' : 'Bạn viết vài chữ vào đây nhé.'
        );
      }

      if (!editor.reportValidity()) return;

      greeting = Object.fromEntries(
        Object.entries(inputs).map(([key, input]) => [
          key,
          input.value.trim()
        ])
      );

      renderGreeting();
      showReading();

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(greeting));
        if (status) status.textContent = 'Đã lưu lời chúc của bạn.';
      } catch {
        if (status) {
          status.textContent =
            'Đã cập nhật thiệp. Trình duyệt chưa cho phép lưu để dùng lần sau.';
        }
      }

      editButton.focus({ preventScroll: true });
      revealCard();
    });
  }

  renderGreeting();
})();
