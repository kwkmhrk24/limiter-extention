import { useState, useEffect } from 'react';
import './App.css';

const STORAGE_KEY = 'targetHosts';

function App() {
  const [hosts, setHosts] = useState<string[]>([]);
  const [newHost, setNewHost] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // 初期表示時にストレージからホストリストを読み込む
  useEffect(() => {
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      setHosts(result[STORAGE_KEY] || []);
      setLoading(false);
    });
  }, []);

  // ホストリストが変更されたらストレージに保存する
  useEffect(() => {
    // 初期読み込み時は保存しない
    if (!loading) {
      chrome.storage.sync.set({ [STORAGE_KEY]: hosts });
    }
  }, [hosts, loading]);

  const handleAddHost = () => {
    if (newHost && !hosts.includes(newHost)) {
      setHosts([...hosts, newHost]);
      setNewHost('');
    }
  };

  const handleRemoveHost = (hostToRemove: string) => {
    setHosts(hosts.filter(host => host !== hostToRemove));
  };

  if (loading) {
    return <div className="App">読み込み中...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>監視対象サイト設定</h1>
      </header>
      <main>
        <div className="settings-form">
          <input
            type="text"
            value={newHost}
            onChange={(e) => setNewHost(e.target.value)}
            placeholder="例: www.netflix.com"
          />
          <button onClick={handleAddHost}>追加</button>
        </div>
        <ul className="host-list">
          {hosts.map((host) => (
            <li key={host}>
              <span>{host}</span>
              <button onClick={() => handleRemoveHost(host)}>削除</button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default App;
