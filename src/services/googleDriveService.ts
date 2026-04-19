export async function getGoogleAuthUrl() {
  const res = await fetch("/api/auth/google/url");
  return res.json();
}

export async function getGoogleDriveStatus() {
  const res = await fetch("/api/auth/google/status");
  return res.json();
}

export async function saveToGoogleDrive(file: { name: string, type: string, base64: string }) {
  const res = await fetch("/api/drive/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(file)
  });
  return res.json();
}

export async function fileToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
