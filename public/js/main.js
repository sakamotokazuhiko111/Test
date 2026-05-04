document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.dataset.confirm) {
      if (!confirm(form.dataset.confirm)) e.preventDefault();
    }
  });
});
