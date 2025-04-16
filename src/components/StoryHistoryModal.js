import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';

const StoryHistoryModal = ({ isOpen, onClose, storyId, onRestore, darkMode }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && storyId) {
      fetchHistory();
    }
    // eslint-disable-next-line
  }, [isOpen, storyId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/stories/${storyId}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Optionally: implement restore to previous version here
  // For now, just show list

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Story History"
      className={`modal history-modal${darkMode ? ' dark' : ''}`}
      overlayClassName="modal-overlay"
      ariaHideApp={false}
    >
      <h2>Story Version History</h2>
      <button className="close-modal" onClick={onClose}>×</button>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="history-list">
          {history.length === 0 ? (
            <div>No history found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Changed At</th>
                  <th>Changed By</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td>{h.version}</td>
                    <td>{h.title}</td>
                    <td style={{maxWidth: 200, whiteSpace: 'pre-wrap'}}>{h.description}</td>
                    <td>{h.changed_at ? new Date(h.changed_at).toLocaleString() : ''}</td>
                    <td>{h.changed_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Modal>
  );
};

export default StoryHistoryModal;
