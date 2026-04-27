export function bindTabs() {
  const buttons = [...document.querySelectorAll('.tab-button')];
  const panels = [...document.querySelectorAll('.tab-panel')];

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.tab;
      buttons.forEach((item) => item.classList.toggle('active', item === button));
      panels.forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${target}`));
    });
  });
}
