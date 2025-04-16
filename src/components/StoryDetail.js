import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/StoryDetail.css';

const StoryDetail = ({
  storyId,
  isOpen,
  onClose,
  onStoryUpdate,
  darkMode
}) => {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [users, setUsers] = useState([]);
  const [comment, setComment] = useState('');
  const [versions, setVersions] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    tags: [],
    assignee_id: null,
    changeSummary: '',
    archived: false
  });

  // Get token from localStorage or sessionStorage
  const getToken = () => {
    // First check sessionStorage (for session-only login)
    let token = sessionStorage.getItem('token');

    // If not in sessionStorage, check localStorage (for remembered login)
    if (!token) {
      token = localStorage.getItem('token');
    }

    return token;
  };

  // Fetch story details
  useEffect(() => {
    if (isOpen && storyId) {
      const token = getToken();
      if (token) {
        fetchStoryDetails();
        fetchUsers();
      } else {
        setError('Authentication required. Please log in.');
        setLoading(false);
      }
    }
  }, [isOpen, storyId]);

  // Fetch story details
  const fetchStoryDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/stories/${storyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch story: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setStory(data);
      setFormData({
        title: data.title,
        description: data.description || '',
        status: data.status,
        priority: data.priority || 'medium',
        tags: data.tags || [],
        assignee_id: data.assignee ? data.assignee.id : null,
        changeSummary: '',
        archived: data.archived || false
      });
    } catch (err) {
      console.error('Error fetching story details:', err);
      setError(`Failed to load story details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for assignment
  const fetchUsers = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Update story details
  const updateStory = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // If no change summary was provided, generate a default one
      if (!formData.changeSummary) {
        formData.changeSummary = 'Updated story details';
      }

      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update story: ${response.status} ${response.statusText}`);
      }

      const updatedStory = await response.json();
      setStory(updatedStory);
      setEditMode(false);
      setPreviewMode(false);

      // Reset change summary after successful update
      setFormData({
        ...formData,
        changeSummary: ''
      });

      if (onStoryUpdate) {
        onStoryUpdate(updatedStory);
      }
    } catch (err) {
      console.error('Error updating story:', err);
      setError(`Failed to update story: ${err.message}`);
    }
  };

  // Add a comment
  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/stories/${storyId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: comment })
      });

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.status} ${response.statusText}`);
      }

      const newComment = await response.json();
      setStory({
        ...story,
        comments: [...story.comments, newComment]
      });
      setComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(`Failed to add comment: ${err.message}`);
    }
  };

  // Delete a comment
  const deleteComment = async (commentId) => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete comment: ${response.status} ${response.statusText}`);
      }

      setStory({
        ...story,
        comments: story.comments.filter(c => c.id !== commentId)
      });
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(`Failed to delete comment: ${err.message}`);
    }
  };

  // Fetch version history
  const fetchVersionHistory = async () => {
    setLoadingVersions(true);
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/stories/${storyId}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch versions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setVersions(data);
      setShowVersions(true);
    } catch (err) {
      console.error('Error fetching version history:', err);
      setError(`Failed to load version history: ${err.message}`);
    } finally {
      setLoadingVersions(false);
    }
  };

  // Restore a version
  const restoreVersion = async (versionId) => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/stories/${storyId}/restore/${versionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to restore version: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setStory(data.story);
      setFormData({
        title: data.story.title,
        description: data.story.description || '',
        status: data.story.status,
        priority: data.story.priority || 'medium',
        tags: data.story.tags || [],
        assignee_id: data.story.assignee ? data.story.assignee.id : null,
        changeSummary: '',
        archived: data.story.archived || false
      });
      setShowVersions(false);

      // Refresh version history
      fetchVersionHistory();

      if (onStoryUpdate) {
        onStoryUpdate(data.story);
      }
    } catch (err) {
      console.error('Error restoring version:', err);
      setError(`Failed to restore version: ${err.message}`);
    }
  };

  // Archive/unarchive a story
  const toggleArchiveStatus = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const newArchivedStatus = !story.archived;

      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          archived: newArchivedStatus,
          changeSummary: newArchivedStatus ? 'Story archived' : 'Story unarchived'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${newArchivedStatus ? 'archive' : 'unarchive'} story: ${response.status} ${response.statusText}`);
      }

      const updatedStory = await response.json();
      setStory(updatedStory);
      setFormData({
        ...formData,
        archived: updatedStory.archived
      });

      if (onStoryUpdate) {
        onStoryUpdate(updatedStory);
      }
    } catch (err) {
      console.error(`Error ${!story.archived ? 'archiving' : 'unarchiving'} story:`, err);
      setError(`Failed to ${!story.archived ? 'archive' : 'unarchive'} story: ${err.message}`);
    }
  };

  // Permanently delete a story
  const deleteStory = async () => {
    // Ask for confirmation before deleting
    if (!window.confirm('Are you sure you want to permanently delete this story? This action cannot be undone.')) {
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/stories/${storyId}?permanent=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete story: ${response.status} ${response.statusText}`);
      }

      // Close the story detail view and notify parent component
      if (onStoryUpdate) {
        // Pass null to indicate the story was deleted
        onStoryUpdate(null);
      }

      // Close the detail view
      onClose();
    } catch (err) {
      console.error('Error deleting story:', err);
      setError(`Failed to delete story: ${err.message}`);
    }
  };
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  if (!isOpen) return null;

  return (
    <div className={`story-detail-overlay ${darkMode ? 'dark' : ''}`}>
      <div className="story-detail-container">
        <button className="close-button" onClick={onClose}>×</button>

        {loading ? (
          <div className="loading">Loading story details...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : story ? (
          <>
            <div className="story-header">
              {editMode ? (
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="title-input"
                />
              ) : (
                <h2>{story.title}</h2>
              )}

              <div className="story-timestamps">
                <div>Created: {formatDate(story.created_at)}</div>
                <div>Updated: {formatDate(story.updated_at)}</div>
              </div>
            </div>

            <div className="story-details">
              <div className="story-main-content">
                {editMode ? (
                  <div className="markdown-editor">
                    <div className="editor-toolbar">
                      <button
                        type="button"
                        className={`preview-toggle ${previewMode ? 'active' : ''}`}
                        onClick={() => setPreviewMode(!previewMode)}
                      >
                        {previewMode ? 'Edit' : 'Preview'}
                      </button>
                      <div className="markdown-hint">Markdown supported</div>
                    </div>

                    {previewMode ? (
                      <div className="markdown-preview">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {formData.description || "No description provided."}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="description-textarea"
                        placeholder="Add a description using Markdown..."
                      />
                    )}

                    <div className="change-summary-container">
                      <label htmlFor="changeSummary">Change summary:</label>
                      <input
                        type="text"
                        id="changeSummary"
                        name="changeSummary"
                        value={formData.changeSummary}
                        onChange={handleInputChange}
                        placeholder="Briefly describe your changes"
                        className="change-summary-input"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="description markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {story.description || "No description provided."}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              <div className="story-sidebar">
                <div className="sidebar-section">
                  <h4>Status</h4>
                  {editMode ? (
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  ) : (
                    <div className={`status-badge ${story.status}`}>
                      {story.status === 'todo' ? 'To Do' :
                       story.status === 'in-progress' ? 'In Progress' : 'Done'}
                    </div>
                  )}
                </div>

                <div className="sidebar-section">
                  <h4>Priority</h4>
                  {editMode ? (
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  ) : (
                    <div className={`priority-badge ${story.priority || 'medium'}`}>
                      {story.priority ? story.priority.charAt(0).toUpperCase() + story.priority.slice(1) : 'Medium'}
                    </div>
                  )}
                </div>

                <div className="sidebar-section">
                  <h4>Assignee</h4>
                  {editMode ? (
                    <select
                      name="assignee_id"
                      value={formData.assignee_id || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div>{story.assignee ? story.assignee.email : 'Unassigned'}</div>
                  )}
                </div>

                <div className="sidebar-section">
                  <h4>Tags</h4>
                  <div className="tags-container">
                    {story.tags && story.tags.length > 0 ?
                      story.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      )) :
                      <span className="no-tags">No tags</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="story-actions">
              {editMode ? (
                <>
                  <button onClick={updateStory} className="save-button">Save Changes</button>
                  <button onClick={() => setEditMode(false)} className="cancel-button">Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditMode(true)} className="edit-button">Edit Story</button>
                  <button onClick={toggleArchiveStatus} className={`archive-button ${story.archived ? 'unarchive' : 'archive'}`}>
                    {story.archived ? 'Unarchive Story' : 'Archive Story'}
                  </button>
                  <button onClick={fetchVersionHistory} className="history-button">
                    {showVersions ? 'Hide History' : 'View History'}
                  </button>
                  <button onClick={deleteStory} className="delete-button">
                    Delete Story
                  </button>
                </>
              )}
            </div>

            {/* Version History Section */}
            {showVersions && (
              <div className="version-history-section">
                <h3>Version History</h3>
                {loadingVersions ? (
                  <div className="loading">Loading version history...</div>
                ) : versions.length > 0 ? (
                  <div className="versions-list">
                    {versions.map(version => (
                      <div key={version.id} className="version-item">
                        <div className="version-header">
                          <span className="version-number">Version {version.versionNumber}</span>
                          <span className="version-date">{formatDate(version.createdAt)}</span>
                        </div>
                        <div className="version-summary">{version.changeSummary}</div>
                        <div className="version-user">By: {version.user.email}</div>
                        <button
                          onClick={() => restoreVersion(version.id)}
                          className="restore-button"
                        >
                          Restore This Version
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-versions">No version history available</div>
                )}
              </div>
            )}

            <div className="comments-section">
              <h3>Comments</h3>
              <div className="comments-list">
                {story.comments && story.comments.length > 0 ? (
                  story.comments.map(comment => (
                    <div key={comment.id} className="comment">
                      <div className="comment-header">
                        <span className="comment-author">{comment.user.email}</span>
                        <span className="comment-date">{formatDate(comment.createdAt)}</span>
                        <button
                          className="delete-comment"
                          onClick={() => deleteComment(comment.id)}
                          title="Delete comment"
                        >
                          ×
                        </button>
                      </div>
                      <div className="comment-content">{comment.content}</div>
                    </div>
                  ))
                ) : (
                  <div className="no-comments">No comments yet</div>
                )}
              </div>
              <form onSubmit={addComment} className="comment-form">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="comment-input"
                />
                <button type="submit" className="submit-comment">Post Comment</button>
              </form>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default StoryDetail;
