import ReactNativeBlobUtil from 'react-native-blob-util';

export async function downloadToAndroidDownloads(
  url: string,
  filename: string,
  mime: string,
  description: string,
): Promise<void> {
  await ReactNativeBlobUtil.config({
    addAndroidDownloads: {
      useDownloadManager: true,
      notification: true,
      title: filename,
      description,
      mime,
      mediaScannable: true,
      path: `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${filename}`,
    },
  }).fetch('GET', url);
}
