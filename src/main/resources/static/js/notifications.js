/* Shares accessible toast feedback between browser actions and Java form redirects. */
const toastRegion = document.createElement('div');
toastRegion.className = 'toast-region';
toastRegion.setAttribute('aria-label', 'Notifications');
document.body.append(toastRegion);

function notificationIcon(name) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.classList.add('icon');
  icon.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `/icons.svg#${name}`);
  icon.append(use);
  return icon;
}

function showToast(message, type = 'success') {
  let role = 'status';
  let iconName = 'check-circle';
  let lifetime = 5000;
  if (type === 'error') {
    role = 'alert';
    iconName = 'alert-circle';
    lifetime = 8000;
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  // Screen readers announce errors urgently and success messages more gently.
  toast.setAttribute('role', role);
  const text = document.createElement('p');
  // textContent displays the message as text, never as executable HTML.
  text.textContent = message;
  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'toast-dismiss';
  dismiss.setAttribute('aria-label', 'Dismiss notification');
  dismiss.append(notificationIcon('close'));
  function removeToast() {
    clearTimeout(expiry);
    toast.remove();
  }
  dismiss.addEventListener('click', removeToast);
  toast.append(notificationIcon(iconName), text, dismiss);
  toastRegion.append(toast);
  // Keep feedback readable without allowing a long shopping session to fill the screen.
  while (toastRegion.children.length > 3) {
    toastRegion.firstElementChild.remove();
  }
  let expiry;
  function pauseExpiry() {
    clearTimeout(expiry);
  }
  function schedule() {
    pauseExpiry();
    expiry = setTimeout(removeToast, lifetime);
  }
  // Give people time to read or reach the dismiss button with the keyboard.
  toast.addEventListener('mouseenter', pauseExpiry);
  toast.addEventListener('mouseleave', schedule);
  toast.addEventListener('focusin', pauseExpiry);
  toast.addEventListener('focusout', schedule);
  schedule();
}

// cart.js uses this shared helper. Java redirects provide messages through meta tags.
window.VelouraNotify = { show: showToast };
for (const notice of document.querySelectorAll('meta[name="veloura-notice"]')) {
  showToast(notice.content, notice.dataset.noticeType);
}
