/* Shared browser-side preparation for photos from Files and Photos. */
(() => {
  const photoTypes = new Map(Object.entries({
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', avif: 'image/avif', heic: 'image/heic', heif: 'image/heif'
  }));
  const supported = new Set(photoTypes.values());
  const attachmentPhotos = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

  function typeOf(file) {
    const declared = file.type.toLowerCase();
    if (supported.has(declared)) return declared;
    return photoTypes.get(file.name.split('.').pop().toLowerCase()) || '';
  }

  async function decode(file) {
    try {
      const bitmap = await createImageBitmap(file);
      return { image: bitmap, release: () => bitmap.close() };
    } catch {
      const url = URL.createObjectURL(file);
      const image = new Image();
      try {
        image.src = url;
        await image.decode();
        return { image, release: () => URL.revokeObjectURL(url) };
      } catch {
        URL.revokeObjectURL(url);
        throw Error('Could not open this photo. Try saving a JPEG or PNG copy and selecting it again.');
      }
    }
  }

  async function prepareAttachment(file) {
    const type = typeOf(file);
    const limit = 10 * 1024 * 1024;
    if (!type) return file;
    if (attachmentPhotos.has(type) && file.size <= limit) {
      return file.type === type ? file : new File([file], file.name, { type });
    }
    if (file.size > 32 * 1024 * 1024) throw Error('Choose a photo up to 32 MB.');
    const { image, release } = await decode(file);
    try {
      const scale = Math.min(1, 2048 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw Error('Photo conversion is unavailable in this browser.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.88));
      if (!blob || blob.size > limit) throw Error('Could not fit this photo within the 10 MB attachment limit.');
      const extension = blob.type === 'image/webp' ? 'webp' : 'png';
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + extension, { type: blob.type });
    } finally {
      release();
    }
  }

  window.KnightfallPhotoUpload = { typeOf, decode, prepareAttachment };
})();
