document.addEventListener('DOMContentLoaded', function() {
  const downloadBtn = document.getElementById('downloadBtn');
  const convertBtn = document.getElementById('convertBtn');
  const selectFolderBtn = document.getElementById('selectFolderBtn');
  const loadImagesBtn = document.getElementById('loadImagesBtn');
  const status = document.getElementById('status');
  const imageContainer = document.getElementById('imageContainer');
  const imageList = document.getElementById('imageList');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const selectedCount = document.getElementById('selectedCount');
  const downloadOptions = document.getElementById('downloadOptions');
  const formatSelect = document.getElementById('formatSelect');
  const qualityGroup = document.getElementById('qualityGroup');
  const qualitySlider = document.getElementById('qualitySlider');
  const qualityValue = document.getElementById('qualityValue');
  
  let allImages = [];

  // Hiển thị thư mục đã chọn
  chrome.storage.local.get(['selectedFolder'], function(result) {
    if (result.selectedFolder) {
      status.textContent = `Thư mục: ${result.selectedFolder}`;
      status.style.backgroundColor = '#e7f3ff';
    }
  });

  // Xử lý thay đổi định dạng
  formatSelect.addEventListener('change', function() {
    const selectedFormat = this.value;
    if (selectedFormat === 'jpg' || selectedFormat === 'webp') {
      qualityGroup.style.display = 'block';
    } else {
      qualityGroup.style.display = 'none';
    }
    
    // Hiển thị nút phù hợp
    if (selectedFormat === 'original') {
      downloadBtn.style.display = 'block';
      convertBtn.style.display = 'none';
    } else {
      downloadBtn.style.display = 'none';
      convertBtn.style.display = 'block';
    }
  });

  // Cập nhật giá trị chất lượng
  qualitySlider.addEventListener('input', function() {
    qualityValue.textContent = this.value + '%';
  });

  selectFolderBtn.addEventListener('click', function() {
    const folderName = prompt('Nhập tên thư mục con (sẽ tạo trong Downloads):');
    if (folderName) {
      chrome.storage.local.set({selectedFolder: folderName}, function() {
        status.textContent = `Thư mục: ${folderName}`;
        status.style.backgroundColor = '#e7f3ff';
      });
    }
  });

  loadImagesBtn.addEventListener('click', function() {
    status.textContent = 'Đang tìm ảnh...';
    status.style.backgroundColor = '#fff3cd';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'findImages'}, function(response) {
        if (response && response.images && response.images.length > 0) {
          allImages = response.images;
          displayImages(allImages);
          downloadOptions.style.display = 'block';
          status.textContent = `Tìm thấy ${allImages.length} ảnh`;
          status.style.backgroundColor = '#d4edda';
        } else {
          status.textContent = 'Không tìm thấy ảnh nào';
          status.style.backgroundColor = '#f8d7da';
        }
      });
    });
  });

  function displayImages(images) {
    imageList.innerHTML = '';
    imageContainer.style.display = 'block';
    downloadBtn.style.display = 'block';
    
    images.forEach((imageUrl, index) => {
      const imageItem = document.createElement('div');
      imageItem.className = 'image-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `img-${index}`;
      checkbox.value = imageUrl;
      checkbox.addEventListener('change', updateSelectedCount);
      
      const img = document.createElement('img');
      img.src = imageUrl;
      img.onerror = function() {
        this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjI1IiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tk8gSU1HPC90ZXh0Pgo8L3N2Zz4K';
      };
      
      const info = document.createElement('div');
      info.className = 'image-info';
      const filename = getFilename(imageUrl, index);
      info.innerHTML = `<strong>${filename}</strong><br><small>${imageUrl.substring(0, 50)}...</small>`;
      
      imageItem.appendChild(checkbox);
      imageItem.appendChild(img);
      imageItem.appendChild(info);
      imageList.appendChild(imageItem);
    });
    
    updateSelectedCount();
  }

  selectAllCheckbox.addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('#imageList input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = this.checked;
    });
    updateSelectedCount();
  });

  function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('#imageList input[type="checkbox"]');
    const selectedCheckboxes = document.querySelectorAll('#imageList input[type="checkbox"]:checked');
    
    selectedCount.textContent = `${selectedCheckboxes.length} ảnh được chọn`;
    
    if (selectedCheckboxes.length === 0) {
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.checked = false;
    } else if (selectedCheckboxes.length === checkboxes.length) {
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.checked = true;
    } else {
      selectAllCheckbox.indeterminate = true;
    }
  }

  // Tải xuống với định dạng gốc
  downloadBtn.addEventListener('click', function() {
    const selectedCheckboxes = document.querySelectorAll('#imageList input[type="checkbox"]:checked');
    const selectedImages = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedImages.length === 0) {
      status.textContent = 'Vui lòng chọn ít nhất một ảnh';
      status.style.backgroundColor = '#f8d7da';
      return;
    }
    
    downloadImages(selectedImages);
  });

  // Chuyển đổi và tải xuống
  convertBtn.addEventListener('click', function() {
    const selectedCheckboxes = document.querySelectorAll('#imageList input[type="checkbox"]:checked');
    const selectedImages = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (selectedImages.length === 0) {
      status.textContent = 'Vui lòng chọn ít nhất một ảnh';
      status.style.backgroundColor = '#f8d7da';
      return;
    }
    
    const targetFormat = formatSelect.value;
    const quality = parseInt(qualitySlider.value) / 100;
    
    convertAndDownloadImages(selectedImages, targetFormat, quality);
  });

  function downloadImages(imageUrls) {
    status.textContent = `Đang tải ${imageUrls.length} ảnh...`;
    status.style.backgroundColor = '#fff3cd';
    
    chrome.storage.local.get(['selectedFolder'], function(result) {
      const folderName = result.selectedFolder || 'WebImages';
      
      imageUrls.forEach((imageUrl, index) => {
        const filename = getFilename(imageUrl, index);
        const downloadPath = `${folderName}/${filename}`;
        
        chrome.downloads.download({
          url: imageUrl,
          filename: downloadPath,
          conflictAction: 'uniquify'
        }, function(downloadId) {
          if (chrome.runtime.lastError) {
            console.error('Download error:', chrome.runtime.lastError);
          }
        });
      });
      
      status.textContent = `Đã bắt đầu tải ${imageUrls.length} ảnh`;
      status.style.backgroundColor = '#d4edda';
    });
  }

  function convertAndDownloadImages(imageUrls, targetFormat, quality) {
    status.textContent = `Đang chuyển đổi và tải ${imageUrls.length} ảnh...`;
    status.style.backgroundColor = '#fff3cd';
    
    chrome.storage.local.get(['selectedFolder'], function(result) {
      const folderName = result.selectedFolder || 'WebImages';
      let completedCount = 0;
      
      imageUrls.forEach((imageUrl, index) => {
        convertImage(imageUrl, targetFormat, quality).then(convertedBlob => {
          const filename = getConvertedFilename(imageUrl, index, targetFormat);
          const downloadPath = `${folderName}/${filename}`;
          
          // Tạo object URL từ blob
          const blobUrl = URL.createObjectURL(convertedBlob);
          
          chrome.downloads.download({
            url: blobUrl,
            filename: downloadPath,
            conflictAction: 'uniquify'
          }, function(downloadId) {
            completedCount++;
            if (completedCount === imageUrls.length) {
              status.textContent = `Đã hoàn thành chuyển đổi và tải ${imageUrls.length} ảnh`;
              status.style.backgroundColor = '#d4edda';
            }
            
            // Cleanup object URL
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            
            if (chrome.runtime.lastError) {
              console.error('Download error:', chrome.runtime.lastError);
            }
          });
        }).catch(error => {
          completedCount++;
          console.error('Conversion error:', error);
          
          // Fallback: tải ảnh gốc nếu chuyển đổi thất bại
          const filename = getFilename(imageUrl, index);
          const downloadPath = `${folderName}/${filename}`;
          
          chrome.downloads.download({
            url: imageUrl,
            filename: downloadPath,
            conflictAction: 'uniquify'
          });
        });
      });
    });
  }

  function convertImage(imageUrl, targetFormat, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Vẽ ảnh lên canvas
        ctx.drawImage(img, 0, 0);
        
        // Chuyển đổi sang định dạng mong muốn
        let mimeType;
        switch(targetFormat) {
          case 'jpg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          default:
            mimeType = 'image/jpeg';
        }
        
        canvas.toBlob(resolve, mimeType, quality);
      };
      
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  function getFilename(url, index) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();
      
      if (filename && filename.includes('.')) {
        return filename;
      } else {
        return `image_${index + 1}.jpg`;
      }
    } catch (e) {
      return `image_${index + 1}.jpg`;
    }
  }

  function getConvertedFilename(url, index, targetFormat) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      let filename = pathname.split('/').pop();
      
      if (filename && filename.includes('.')) {
        // Thay đổi phần mở rộng
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
        return `${nameWithoutExt}.${targetFormat}`;
      } else {
        return `image_${index + 1}.${targetFormat}`;
      }
    } catch (e) {
      return `image_${index + 1}.${targetFormat}`;
    }
  }
});