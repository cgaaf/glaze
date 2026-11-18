// Stands in for an upload endpoint in the File Upload demos: a file "uploads" in about two seconds, reporting its
// progress as it goes, and files over 2 MB are refused once they are halfway.
const LIMIT = 2_000_000;

export function sendFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    let percent = 0;
    const timer = setInterval(() => {
      percent = Math.min(100, percent + 10);
      if (percent >= 50 && file.size > LIMIT) {
        clearInterval(timer);
        reject(new Error("The server refused a file over 2 MB."));
        return;
      }
      onProgress(percent);
      if (percent === 100) {
        clearInterval(timer);
        resolve();
      }
    }, 200);
  });
}

export function fileNames(files) {
  return Array.isArray(files) ? files.map((file) => file.name).join(", ") : "";
}
