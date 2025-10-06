export async function sendPDFByEmail(pdfBlob: Blob, filename: string) {
  const pdfBase64 = await blobToBase64(pdfBlob);
  const res = await fetch("/api/export/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pdfBase64, filename })
  });
  if (!res.ok) throw new Error("Failed to send email");
  return res.json();
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
