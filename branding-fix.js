// Final branding display correction: always show the full supplied Xue Dao portrait.
(() => {
  const title = '我是薛导，我来帮你裁剪图片。';
  document.title = title;
  const heading = document.querySelector('.brand h1');
  if (heading) heading.textContent = title;

  const card = document.getElementById('xuedaoSidebarCard');
  const img = card?.querySelector('img');
  if (!card || !img) return;

  const style = document.createElement('style');
  style.id = 'xuedaoFullImageFix';
  style.textContent = `
    #xuedaoSidebarCard{background:#07111f!important;overflow:hidden!important}
    #xuedaoSidebarCard img{display:block!important;width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important;object-position:center top!important;background:#07111f!important}
  `;
  document.head.appendChild(style);

  img.src = './assets/xuedao.webp?v=20260929-1500';
  img.alt = '薛导帮你裁剪图片';
})();
