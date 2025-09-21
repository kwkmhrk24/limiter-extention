const API_BASE_URL = 'http://localhost:8000';

// バックエンドで定義したLogモデルと一致する型を定義
export interface Log {
    id: number;
    url: string;
    duration_seconds: number;
    created_at: string; // 日付は文字列として受け取る
}

/**
 * 利用ログをバックエンドに送信する
 * @param log 送信するログデータ
 */
export async function postLog(log: { url: string; duration_seconds: number }): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...log,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to post log:', errorData);
            throw new Error(`Server responded with ${response.status}`);
        }

        console.log('Successfully posted log:', await response.json());

    } catch (error) {
        console.error('Error posting log:', error);
    }
}

/**
 * 保存されている全ての利用ログを取得する
 */
export async function getStats(): Promise<Log[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to get stats:', errorData);
            throw new Error(`Server responded with ${response.status}`);
        }

        const stats = await response.json();
        console.log('Successfully fetched stats:', stats);
        return stats;

    } catch (error) {
        console.error('Error getting stats:', error);
        return []; // エラー時は空の配列を返す
    }
}
