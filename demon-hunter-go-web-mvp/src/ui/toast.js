export function createToast(root = document.querySelector('#toast-root')) {
  return function toast(message, variant = 'default') {
    const node = document.createElement('div');
    node.className = `toast ${variant}`;
    node.textContent = message;
    root.appendChild(node);
    setTimeout(() => node.remove(), 3800);
  };
}
