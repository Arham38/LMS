import api from './api';

export const storageService = {
  /**
   * Request a presigned PUT URL and storage key
   */
  async presignUpload({ kind, contentType, size, filename }) {
    const response = await api.post('/uploads/presign', {
      kind,
      contentType,
      size,
      filename,
    });
    return response.data || response;
  },

  /**
   * Request a short-lived signed GET URL for downloading or viewing a file
   */
  async getFileUrl(key) {
    const response = await api.get('/files/url', { params: { key } });
    return response.data || response;
  },

  /**
   * Directly upload file to Supabase Storage bucket via presigned PUT URL with XMLHttpRequest progress
   */
  uploadDirectToStorage(uploadUrl, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(true);
        } else {
          reject(new Error(`Storage upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during file upload to storage. Check your internet connection or CORS settings.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('File upload timed out. Please retry.'));
      };

      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  },

  // Compatibility alias
  uploadDirectToR2(...args) {
    return this.uploadDirectToStorage(...args);
  },
};

export default storageService;
