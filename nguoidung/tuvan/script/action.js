// Khung tư vấn, nhắn tin dùng chung cho mọi trang: module tự tạo markup và gắn vào cuối <body>.
// Cách dùng lại: nạp style/laptop|tablet|mobile.css (theo breakpoint) rồi nạp file script này.

// Markup của nút tròn nổi góc phải dưới và khung hội thoại.
const TU_VAN_MAU = `
  <div class="consult" id="consult">
    <section class="consult__panel" id="consult-panel" hidden aria-labelledby="consult-title">
      <header class="consult__header">
        <div class="consult__intro">
          <h2 class="consult__title" id="consult-title">Tư vấn pháp lý</h2>
          <p class="consult__subtitle">Nhắn tin để được hỗ trợ</p>
        </div>
        <button class="consult__close" id="consult-close" type="button" aria-label="Đóng khung tư vấn">x</button>
      </header>
      <div class="consult__messages" id="consult-messages" aria-live="polite">
        <p class="consult__message consult__message--agent">Xin chào! Bạn cần tư vấn vấn đề pháp lý nào?</p>
      </div>
      <form class="consult__form" id="consult-form">
        <input class="consult__input" id="consult-input" type="text" placeholder="Nhập nội dung cần tư vấn..." autocomplete="off" aria-label="Nội dung cần tư vấn">
        <button class="consult__send" type="submit">Gửi</button>
      </form>
    </section>
    <button class="consult__toggle" id="consult-toggle" type="button" aria-label="Tư vấn, nhắn tin" aria-expanded="false" aria-controls="consult-panel">
      <svg class="consult__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M20 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4l4 4 4-4h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path>
      </svg>
    </button>
  </div>
`;

// Chỉ chèn một lần để tránh trùng id khi module bị nạp nhiều lần trên cùng một trang.
if (!document.querySelector("#consult")) {
  document.body.insertAdjacentHTML("beforeend", TU_VAN_MAU);
}

const consultToggle = document.querySelector("#consult-toggle");
const consultPanel = document.querySelector("#consult-panel");
const consultClose = document.querySelector("#consult-close");
const consultForm = document.querySelector("#consult-form");
const consultInput = document.querySelector("#consult-input");
const consultMessages = document.querySelector("#consult-messages");

function setConsultOpen(isOpen) {
  consultPanel.hidden = !isOpen;
  consultToggle.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) {
    consultInput.focus();
  }
}

function addConsultMessage(text, role) {
  const message = document.createElement("p");
  message.className = `consult__message consult__message--${role}`;
  message.textContent = text;
  consultMessages.append(message);
  consultMessages.scrollTop = consultMessages.scrollHeight;
}

consultToggle.addEventListener("click", () => {
  setConsultOpen(consultPanel.hidden);
});

consultClose.addEventListener("click", () => {
  setConsultOpen(false);
});

consultForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = consultInput.value.trim();
  if (!text) return;

  addConsultMessage(text, "user");
  consultInput.value = "";

  window.setTimeout(() => {
    addConsultMessage("Cảm ơn bạn đã gửi câu hỏi. Tư vấn viên LegalPath sẽ phản hồi trong thời gian sớm nhất.", "agent");
  }, 600);
});