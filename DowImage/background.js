chrome.runtime.onInstalled.addListener(() => {
  console.log('Image Downloader Extension installed');
});

// Xử lý download events
chrome.downloads.onChanged.addListener((downloadDelta) => {
  if (downloadDelta.state && downloadDelta.state.current === 'complete') {
    console.log('Download completed:', downloadDelta.id);
  }
});