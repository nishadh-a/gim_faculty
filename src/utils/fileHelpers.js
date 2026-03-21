export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64String
      });
    };
    reader.onerror = (error) => reject(error);
  });
}
