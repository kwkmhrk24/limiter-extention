import { postLog } from './api';

console.log("Background script loaded.");

// 監視対象のホスト名
const TARGET_HOST = 'www.youtube.com';

// 現在のタブの状態を保持する変数
let activeTabId: number | undefined;
let activeTabUrl: string | undefined;
let startTime: number | undefined;

/**
 * 滞在時間を計算し、記録する関数
 */
function recordTime() {
    if (startTime && activeTabUrl?.includes(TARGET_HOST)) {
        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
        console.log(`Exiting ${activeTabUrl}. Duration: ${durationSeconds} seconds`);
        
        // バックエンドにデータを送信する
        if (durationSeconds > 0) { // 0秒のログは送信しない
            postLog({ url: activeTabUrl, duration_seconds: durationSeconds });
        }
    }
    // タイマーをリセット
    startTime = undefined;
}

/**
 * タブの状態が変更されたときに呼ばれるメインの処理関数
 * @param url 新しいタブのURL
 */
function handleTabChange(url: string | undefined) {
    const oldUrl = activeTabUrl;
    activeTabUrl = url;

    // URLが無効な場合は記録して終了
    if (!url) {
        recordTime();
        return;
    }

    const currentHost = new URL(url).hostname;
    const oldHost = oldUrl ? new URL(oldUrl).hostname : undefined;

    // 監視対象から離れた場合
    if (oldHost === TARGET_HOST && currentHost !== TARGET_HOST) {
        recordTime();
    }
    // 監視対象に入った場合
    else if (currentHost === TARGET_HOST && oldHost !== TARGET_HOST) {
        startTime = Date.now();
        console.log(`Entering ${url}. Start time: ${startTime}`);
    }
}

// タブがアクティブになったときのリスナー
chrome.tabs.onActivated.addListener(activeInfo => {
    activeTabId = activeInfo.tabId;
    chrome.tabs.get(activeTabId, (tab) => {
        handleTabChange(tab.url);
    });
});

// タブが更新されたときのリスナー
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // 現在アクティブなタブでの更新のみを対象とする
    if (tabId === activeTabId && changeInfo.status === 'complete' && tab.url) {
        handleTabChange(tab.url);
    }
});

// タブが閉じられたときのリスナー
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === activeTabId) {
        recordTime();
        activeTabId = undefined;
        activeTabUrl = undefined;
    }
});