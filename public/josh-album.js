const viewer = document.querySelector('#viewer');
const photos = Array.from(document.querySelectorAll('.josh-photo'));
const full = document.querySelector('#full-photo');
let current = 0;
function showPhoto(index) {
  current = (index + photos.length) % photos.length;
  full.src = photos[current].href;
  full.alt = photos[current].querySelector('img').alt;
  document.querySelector('#caption').textContent = (current + 1) + ' / ' + photos.length;
}
if (typeof viewer.showModal === 'function') {
  document.querySelector('#open-album').addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    showPhoto(0);
    viewer.showModal();
  });
  photos.forEach((link, index) => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    showPhoto(index);
    viewer.showModal();
  }));
  document.querySelector('#prev').onclick = () => showPhoto(current - 1);
  document.querySelector('#next').onclick = () => showPhoto(current + 1);
  document.querySelector('#close-photo').onclick = () => viewer.close();
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') showPhoto(current - 1);
    if (event.key === 'ArrowRight') showPhoto(current + 1);
  });
}

