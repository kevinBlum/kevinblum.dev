const yearNodes = document.querySelectorAll("[data-current-year]");
const currentYear = new Date().getFullYear().toString();

yearNodes.forEach((node) => {
  node.textContent = currentYear;
});
