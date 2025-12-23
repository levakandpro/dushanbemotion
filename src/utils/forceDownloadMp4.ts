// src/utils/forceDownloadMp4.ts

export function forceDownloadMp4(data: Blob, name = 'video_by_dmotion.mp4') {
  const url = URL.createObjectURL(data);

  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Освободить память
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}


