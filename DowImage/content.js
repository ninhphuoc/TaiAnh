chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'findImages') {
    const images = findAllImages();
    sendResponse({images: images});
  }
});

function findAllImages() {
  const imageUrls = new Set();
  
  // Tìm các thẻ img
  const imgElements = document.querySelectorAll('img');
  imgElements.forEach(img => {
    if (img.src && isValidImageUrl(img.src)) {
      imageUrls.add(img.src);
    }
    
    // Kiểm tra data-src (lazy loading)
    if (img.dataset.src && isValidImageUrl(img.dataset.src)) {
      imageUrls.add(img.dataset.src);
    }
  });
  
  // Tìm background images
  const allElements = document.querySelectorAll('*');
  allElements.forEach(element => {
    const style = window.getComputedStyle(element);
    const backgroundImage = style.backgroundImage;
    
    if (backgroundImage && backgroundImage !== 'none') {
      const urlMatch = backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
      if (urlMatch && urlMatch[1] && isValidImageUrl(urlMatch[1])) {
        imageUrls.add(urlMatch[1]);
      }
    }
  });
  
  return Array.from(imageUrls);
}

function isValidImageUrl(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url, window.location.href);
    const extension = urlObj.pathname.toLowerCase().split('.').pop();
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    
    return validExtensions.includes(extension) || 
           urlObj.pathname.includes('image') ||
           urlObj.search.includes('image');
  } catch (e) {
    return false;
  }
}