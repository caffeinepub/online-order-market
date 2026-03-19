/**
 * Converts an image File to a JPEG Blob using Canvas.
 * This ensures maximum compatibility across all devices and browsers.
 * Falls back to the original file if conversion fails.
 */
export async function convertToJpeg(
  file: File,
  quality = 0.85,
  maxWidth = 1200,
  _maxHeight = 1200,
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Center-crop to square (smallest dimension)
      const minDim = Math.min(width, height);
      const cropX = Math.floor((width - minDim) / 2);
      const cropY = Math.floor((height - minDim) / 2);

      // Scale down to maxWidth/maxHeight (both are the same for square)
      const targetSize = Math.min(minDim, maxWidth);

      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file); // fallback
        return;
      }
      // White background for transparency handling
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetSize, targetSize);
      ctx.drawImage(
        img,
        cropX,
        cropY,
        minDim,
        minDim,
        0,
        0,
        targetSize,
        targetSize,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const converted = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg" },
          );
          resolve(converted);
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fallback to original
    };

    img.src = objectUrl;
  });
}
