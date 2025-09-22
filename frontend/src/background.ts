import { postLog } from './api';

// === 定数 ===
const STORAGE_KEY = 'targetHosts';

// === 状態管理 ===
let activeTabId: number | undefined;
let activeTabUrl: string | undefined;
let startTime: number | undefined;
let targetHosts: string[] = []; // メモリ上に監視対象リストを保持

// === 初期化処理 ===

// ストレージから監視対象リストを読み込み、メモリにセットする
async function loadTargetHosts() {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    targetHosts = result[STORAGE_KEY] || [];
    console.log('Loaded target hosts:', targetHosts);
}

// 拡張機能インストール時の初期設定
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        // デフォルトの監視対象を設定
        await chrome.storage.sync.set({ [STORAGE_KEY]: ['www.youtube.com'] });
        console.log('Default target host set.');
    }
    // 起動時にリストをロード
    await loadTargetHosts();
});

// ストレージの変更を監視し、メモリ上のリストを更新する
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes[STORAGE_KEY]) {
        targetHosts = changes[STORAGE_KEY].newValue || [];
        console.log('Target hosts updated:', targetHosts);
    }
});

// === コアロジック ===

/**
 * 現在のURLが監視対象に含まれるかチェックする
 * @param url チェックするURL
 */
function isTargetHost(url: string | undefined): boolean {
    if (!url || targetHosts.length === 0) {
        return false;
    }
    try {
        const currentHost = new URL(url).hostname;
        return targetHosts.some(host => currentHost.includes(host));
    } catch (e) {
        return false;
    }
}

/**
 * 滞在時間を計算し、記録する関数
 */
function recordTime() {
    if (startTime && isTargetHost(activeTabUrl)) {
        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
        console.log(`Exiting ${activeTabUrl}. Duration: ${durationSeconds} seconds`);
        
        if (durationSeconds > 0 && activeTabUrl) {
            postLog({ url: activeTabUrl, duration_seconds: durationSeconds });
        }
    }
    startTime = undefined;
}

/**
 * タブの状態が変更されたときに呼ばれるメインの処理関数
 * @param newUrl 新しいタブのURL
 */
function handleTabChange(newUrl: string | undefined) {
    const wasOnTarget = isTargetHost(activeTabUrl);
    const nowOnTarget = isTargetHost(newUrl);

    activeTabUrl = newUrl;

    if (wasOnTarget && !nowOnTarget) {
        // 監視対象から離れた
        recordTime();
    } else if (!wasOnTarget && nowOnTarget) {
        // 監視対象に入った
        startTime = Date.now();
        console.log(`Entering ${newUrl}. Start time: ${startTime}`);
    }
}

// === イベントリスナー ===

// 起動時にリストをロード
loadTargetHosts();

chrome.tabs.onActivated.addListener(activeInfo => {
    activeTabId = activeInfo.tabId;
    chrome.tabs.get(activeTabId, (tab) => {
        handleTabChange(tab.url);
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.status === 'complete' && tab.url) {
        handleTabChange(tab.url);
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === activeTabId) {
        recordTime();
        activeTabId = undefined;
        activeTabUrl = undefined;
    }
});
