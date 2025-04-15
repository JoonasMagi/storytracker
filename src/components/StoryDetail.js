import React, { useState, useEffect } from 'react';
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
  const [users, setUsers] = useState([]);
  const [comment, setComment] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    tags: [],
    assignee_id: null
  });

  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  // Fetch story details
  useEffect(() => {
    if (isOpen && storyId) {
      fetchStoryDetails();
      fetchUsers();
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
        assignee_id: data.assignee ? data.assignee.id : null
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
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="description-textarea"
                    placeholder="Add a description..."
                  />
                ) : (
                  <div className="description">
                    {story.description || "No description provided."}
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
                <button onClick={() => setEditMode(true)} className="edit-button">Edit Story</button>
              )}
            </div>

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
