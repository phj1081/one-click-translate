// URL 파라미터에서 이미지 데이터 가져오기
const urlParams = new URLSearchParams(window.location.search);
const useStorage = urlParams.get('storage') === 'true';

if (useStorage) {
  // storage에서 가져오기
  chrome.storage.local.get(['capturedImage'], (result) => {
    if (result.capturedImage) {
      copyImageToClipboard(result.capturedImage);
      // 사용 후 storage에서 제거
      chrome.storage.local.remove(['capturedImage']);
    } else {
      document.getElementById('status').textContent = '이미지 데이터가 없습니다.';
    }
  });
} else {
  // URL 파라미터에서 가져오기
  const imageData = urlParams.get('data');
  if (imageData) {
    copyImageToClipboard(decodeURIComponent(imageData));
  } else {
    document.getElementById('status').textContent = '이미지 데이터가 없습니다.';
  }
}

async function copyImageToClipboard(dataUrl) {
  const statusEl = document.getElementById('status');
  
  try {
    // 이미지를 메모리에서만 로드 (미리보기 없이)
    const img = new Image();
    img.src = dataUrl;
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    
    // Canvas를 사용하여 이미지를 PNG로 변환
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: false }); // 성능 최적화
    ctx.drawImage(img, 0, 0);
    
    // Canvas를 Blob으로 변환 (품질 조정으로 속도 향상)
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png', 0.95); // 95% 품질로 속도 향상
    });
    
    if (!blob) {
      throw new Error('이미지 변환 실패');
    }
    
    // 문서에 포커스 주기
    window.focus();
    document.body.focus();
    
    // 클립보드에 복사
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    
    statusEl.textContent = '✅ 이미지가 클립보드에 복사되었습니다!';
    statusEl.style.color = 'green';
    
    // 구글 번역 페이지 열기
    window.open('https://translate.google.com/?sl=auto&tl=ko&op=images', '_blank');
    
    // 안내 메시지 추가
    const instructionEl = document.createElement('div');
    instructionEl.style.marginTop = '20px';
    instructionEl.style.fontSize = '16px';
    instructionEl.style.color = '#666';
    instructionEl.innerHTML = '구글 번역 페이지가 열렸습니다!<br><strong>Cmd+V (Ctrl+V)</strong>로 이미지를 붙여넣으세요';
    statusEl.parentElement.appendChild(instructionEl);
    
    // 1초 후 현재 창 닫기 (사용자가 메시지를 볼 시간 제공)
    setTimeout(() => {
      window.close();
    }, 1000);
    
  } catch (error) {
    console.error('클립보드 복사 실패:', error);
    statusEl.textContent = '❌ 클립보드 복사 실패: ' + error.message;
    statusEl.style.color = 'red';
  }
}