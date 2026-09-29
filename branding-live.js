// Always use the current repository portrait uploaded by the user.
(() => {
  const card = document.getElementById('xuedaoSidebarCard');
  const img = card?.querySelector('img');
  if (!img) return;

  img.src = './assets/xuedao.webp?v=20260929-1715';
  img.alt = '薛导帮你裁剪图片';
  img.style.width = '100%';
  img.style.height = 'auto';
  img.style.maxHeight = 'none';
  img.style.objectFit = 'contain';
  img.style.objectPosition = 'center top';
  img.style.imageRendering = 'auto';
})();
