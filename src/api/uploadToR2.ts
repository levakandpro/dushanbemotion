// src/api/uploadToR2.ts

export async function uploadVideoToR2(file: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, 'dmotion-export.mp4');

  // TODO: Заменить на реальный URL вашего API/Worker для загрузки в R2
  const uploadUrl = '/api/upload-video'; // или ваш реальный endpoint

  const res = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Upload to R2 failed:', res.status, errorText);
    throw new Error(`Upload to R2 failed: ${res.status} ${errorText}`);
  }

  const json = await res.json();
  // Ожидается, что бэкенд вернёт { publicUrl: "https://cdn....mp4" }
  return json.publicUrl as string;
}


