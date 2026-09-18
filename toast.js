// toast.js - Floating Notification System

export function showToast(message) {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>✨</span><span>${message}</span>`;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// جعلها متاحة بشكل عام للإجراءات من السكريبتات القديمة
if (typeof window !== 'undefined') {
  window.showToast = showToast;
}