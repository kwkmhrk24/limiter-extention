import { useState, useEffect } from 'react';
import { getStats } from './api';
import type { Log } from './api';
import './App.css';

function App() {
  const [stats, setStats] = useState<Log[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ポップアップが開かれたときに統計データを取得する
    const fetchStats = async () => {
      try {
        setLoading(true);
        const fetchedStats = await getStats();
        setStats(fetchedStats);
      } catch (e) {
        setError('データの取得に失敗しました。');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []); // 空の依存配列は、コンポーネントのマウント時に一度だけ実行されることを意味する

  return (
    <div className="App">
      <header className="App-header">
        <h1>利用時間ログ</h1>
      </header>
      <main>
        {loading && <p>読み込み中...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>URL</th>
                <th>利用時間 (秒)</th>
                <th>記録日時</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.url}</td>
                  <td>{log.duration_seconds}</td>
                  <td>{new Date(log.created_at).toLocaleString('ja-JP')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

export default App;