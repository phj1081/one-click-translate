// 번역 기능을 수행하는 함수
async function translateCurrentScreen() {
  try {
    console.log('번역 기능 시작...');
    
    // 1. 현재 활성화된 탭의 정보를 가져옵니다.
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('현재 탭:', tab.url);

    // chrome:// URL이나 다른 특수 URL인지 확인
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://'))) {
      console.error('이 페이지에서는 스크린샷을 캡처할 수 없습니다.');
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: '캡처 불가',
        message: '브라우저 설정 페이지에서는 스크린샷을 캡처할 수 없습니다.'
      });
      return;
    }

    // 2. 현재 보이는 화면을 캡처합니다.
    console.log('화면 캡처 중...');
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    console.log('캡처 완료, 이미지 크기:', dataUrl.length);

    // 3. clipboard.html 페이지를 새 탭으로 열기 (이미지 데이터를 URL 파라미터로 전달)
    // 데이터가 너무 크면 storage를 사용
    if (dataUrl.length > 1000000) { // 약 1MB 이상이면 (기존 200KB에서 증가)
      // storage에 저장하고 clipboard.html 열기를 병렬로 처리
      const [storageResult] = await Promise.all([
        chrome.storage.local.set({ capturedImage: dataUrl }),
        chrome.tabs.create({
          url: chrome.runtime.getURL('clipboard.html?storage=true'),
          active: true
        })
      ]);
    } else {
      // URL 파라미터로 전달
      await chrome.tabs.create({
        url: chrome.runtime.getURL(`clipboard.html?data=${encodeURIComponent(dataUrl)}`),
        active: true
      });
    }

  } catch (error) {
    console.error("번역 중 오류 발생:", error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: '오류 발생',
      message: '화면 캡처 중 오류가 발생했습니다: ' + error.message
    });
  }
}

// 확장 프로그램 아이콘 클릭 시 이벤트
chrome.action.onClicked.addListener(() => {
  translateCurrentScreen();
});

// 단축키 명령 리스너
chrome.commands.onCommand.addListener((command) => {
  if (command === 'translate-screen') {
    translateCurrentScreen();
  }
});

