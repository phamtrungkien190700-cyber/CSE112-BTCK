"use strict";

const pageHeaderContent = {
  articles: {
    group: "Không gian chuyên gia",
    title: "Quản lý bài viết",
    description: "Xem và rà soát các nội dung chuyên môn của bạn."
  },
  checklists: {
    group: "Không gian chuyên gia",
    title: "Quản lý checklist",
    description: "Tạo và cập nhật bộ tiêu chí kiểm tra hồ sơ pháp lý."
  },
  profile: {
    group: "Không gian chuyên gia",
    title: "Hồ sơ chuyên gia",
    description: "Quản lý thông tin cá nhân, chuyên môn và hồ sơ hành nghề của bạn."
  },
  settings: {
    group: "Không gian biên tập",
    title: "Cài đặt",
    description: "Quản lý tài khoản và tùy chỉnh trải nghiệm của bạn."
  },
  notifications: {
    group: "Không gian biên tập",
    title: "Thông báo",
    description: "Theo dõi phản hồi và cập nhật pháp lý dành cho bạn."
  }
};

const currentPage = document.body.dataset.page;
const pageContent = pageHeaderContent[currentPage];

if (!pageContent) {
  console.error(`[page-header] Không tìm thấy cấu hình header cho trang "${currentPage}".`);
} else {
  const breadcrumbGroup = document.querySelector("[data-page-context]");
  const breadcrumbTitle = document.querySelector("[data-page-label]");
  const pageTitle = document.querySelector(".page-heading h1");
  const pageDescription = document.querySelector(".page-heading p");

  if (!breadcrumbGroup || !breadcrumbTitle || !pageTitle || !pageDescription) {
    console.error(`[page-header] Thiếu thành phần header cho trang "${currentPage}".`);
  } else {
    document.body.dataset.pageGroup = currentPage === "articles"
      || currentPage === "checklists"
      || currentPage === "profile"
      ? "expert"
      : "editor";
    breadcrumbGroup.textContent = pageContent.group;
    breadcrumbTitle.textContent = pageContent.title;
    pageTitle.textContent = pageContent.title;
    pageDescription.textContent = pageContent.description;
    document.title = `${pageContent.title} | LegalPath`;
  }
}
