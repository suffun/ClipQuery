// Content script running on YouTube pages to seek video player on timestamp clicks
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SEEK_VIDEO' && typeof request.seconds === 'number') {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = request.seconds;
      if (video.paused) {
        video.play().catch(() => {});
      }
      sendResponse({ success: true, currentTime: video.currentTime });
    } else {
      sendResponse({ success: false, error: 'HTML5 video element not found on page' });
    }
    return true;
  }
});
