import React, { useState, useEffect } from 'react';

// API base URL - use relative paths since we're using proxy in package.json
const API_BASE_URL = '';

// Sample project data - updated to match the example image
const initialProjects = []; // Empty array instead of hardcoded projects

const ProjectBoard = ({ darkMode, language, toggleDarkMode, onLogout }) => {
    const [projects, setProjects] = useState(initialProjects);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [newProjectStatus, setNewProjectStatus] = useState('in-progress');
    const [selectedProject, setSelectedProject] = useState(null);
    const [showProjectBoard, setShowProjectBoard] = useState(false);
    const [stories, setStories] = useState([]);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [storyData, setStoryData] = useState({
        title: '',
        description: '',
        connextraFormat: '',
        tags: [],
        status: 'todo'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('projects');
    const [openMenuId, setOpenMenuId] = useState(null);

    // Get token from localStorage
    const getToken = () => {
        const token = localStorage.getItem('token');
        // Only log the first few characters of the token for security
        if (token) {
            const tokenPreview = token.substring(0, 10) + '...';
            console.log('Token found:', tokenPreview);
        } else {
            console.log('No token found in localStorage');
        }
        return token;
    };

    // Fetch all projects when component mounts
    useEffect(() => {
        fetchProjects();
    }, []);

    // API call to fetch projects
    const fetchProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            console.log('Fetching projects from:', `${API_BASE_URL}/api/projects`);
            const response = await fetch(`${API_BASE_URL}/api/projects`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', response.status, errorText);
                throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Projects data received:', data);
            setProjects(data);

            // Update project order in the backend
            await updateProjectsOrder(data.map(project => project.id));
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError(`Failed to load projects: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Update project order in the backend
    const updateProjectsOrder = async (projectIds) => {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_BASE_URL}/api/projects/order`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ projectOrder: projectIds })
            });

            if (!response.ok) {
                throw new Error('Failed to update project order');
            }
            
            console.log('Project order updated successfully');
        } catch (err) {
            console.error('Error updating project order:', err);
            setError('Failed to save project order. Your changes might not persist after refresh.');
        }
    };

    // Apply appropriate theme class to container on mount and when darkMode changes
    useEffect(() => {
        const container = document.querySelector('.modern-container');
        if (container) {
            if (darkMode) {
                container.classList.add('dark-mode');
            } else {
                container.classList.remove('dark-mode');
            }
        }
    }, [darkMode, showProjectBoard]);

    // Function to format date
    const formatDate = (date) => {
        if (!date) return 'Unknown';
        
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
        };
        
        // Format: Apr 15, 2025, 01:36 PM
        return new Date(date).toLocaleDateString('en-US', options);
    };

    // Filter projects based on search term and status filter
    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || project.status === statusFilter;
        return matchesSearch && matchesStatus && !project.archived;
    });

    // Handle creating a new project
    const handleCreateProject = async (e) => {
        e.preventDefault();
        
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_BASE_URL}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newProjectName,
                    description: newProjectDescription,
                    status: newProjectStatus
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create project');
            }

            const newProject = await response.json();
            setProjects([newProject, ...projects]);
            setNewProjectName('');
            setNewProjectDescription('');
            setNewProjectStatus('in-progress');
            setShowNewProjectModal(false);
        } catch (err) {
            console.error('Error creating project:', err);
            setError('Failed to create project. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle archiving a project
    const handleArchiveProject = async (projectId) => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    archived: true
                })
            });

            if (!response.ok) {
                throw new Error('Failed to archive project');
            }

            setProjects(projects.map(project => 
                project.id === projectId 
                    ? { ...project, archived: true } 
                    : project
            ));
        } catch (err) {
            console.error('Error archiving project:', err);
            setError('Failed to archive project. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle deleting a project
    const handleDeleteProject = async (projectId) => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete project');
            }

            setProjects(projects.filter(project => project.id !== projectId));
        } catch (err) {
            console.error('Error deleting project:', err);
            setError('Failed to delete project. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle opening project board
    const handleOpenProjectBoard = async (project) => {
        setSelectedProject(project);
        setShowProjectBoard(true);
        
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_BASE_URL}/api/projects/${project.id}/stories`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch stories');
            }

            const data = await response.json();
            setStories(data);
        } catch (err) {
            console.error('Error fetching stories:', err);
            setError('Failed to load stories. Please try again.');
            setStories([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle going back to projects list
    const handleBackToProjects = () => {
        setSelectedProject(null);
        setShowProjectBoard(false);
    };

    // Handle adding a new story
    const handleAddStory = async (e) => {
        e.preventDefault();
        
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_BASE_URL}/api/projects/${selectedProject.id}/stories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(storyData)
            });

            if (!response.ok) {
                throw new Error('Failed to create story');
            }

            const newStory = await response.json();
            setStories([...stories, newStory]);
            setStoryData({ 
                title: '', 
                description: '', 
                connextraFormat: '', 
                tags: [], 
                status: 'todo' 
            });
            setShowStoryModal(false);
        } catch (err) {
            console.error('Error creating story:', err);
            setError('Failed to create story. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle drag start for story cards
    const handleDragStart = (e, story) => {
        e.dataTransfer.setData('storyId', story.id.toString());
    };

    // Handle dropping a story onto a column
    const handleDrop = async (e, status) => {
        e.preventDefault();
        const storyId = parseInt(e.dataTransfer.getData('storyId'));
        
        // Optimistically update UI
        setStories(stories.map(story => 
            story.id === storyId 
                ? { ...story, status } 
                : story
        ));
        
        // Then update on server
        try {
            const token = getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_BASE_URL}/api/stories/${storyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                throw new Error('Failed to update story');
                // If failed, we could revert the optimistic update here
            }
        } catch (err) {
            console.error('Error updating story:', err);
            setError('Failed to update story. Please refresh and try again.');
        }
    };

    // Handle drag over event
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // Handle drag start for project cards
    const handleProjectDragStart = (e, project) => {
        e.dataTransfer.setData('projectId', project.id.toString());
    };

    // Handle drag over for project container
    const handleProjectDragOver = (e) => {
        e.preventDefault();
    };

    // Handle drop for project cards to reorder
    const handleProjectDrop = (e, targetProject) => {
        e.preventDefault();
        const draggedProjectId = parseInt(e.dataTransfer.getData('projectId'));
        
        if (draggedProjectId === targetProject.id) return;
        
        // Find the positions of the dragged and target projects
        const projectsCopy = [...projects];
        const draggedIndex = projectsCopy.findIndex(p => p.id === draggedProjectId);
        const targetIndex = projectsCopy.findIndex(p => p.id === targetProject.id);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        // Remove the dragged project from its position
        const [draggedProject] = projectsCopy.splice(draggedIndex, 1);
        
        // Insert it at the new position
        projectsCopy.splice(targetIndex, 0, draggedProject);
        
        // Update the state with the new order
        setProjects(projectsCopy);
        
        // Call API to update the order in the backend
        updateProjectsOrder(projectsCopy.map(p => p.id));
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close the menu if clicked outside of any menu or its trigger button
            if (openMenuId && !event.target.closest('.project-menu-dropdown') && 
                !event.target.closest('.menu-button')) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    // Helper function to handle tag input
    const handleTagInput = (tagString) => {
        // Split by commas and trim whitespace, filter out empty tags
        const tagArray = tagString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        
        setStoryData({...storyData, tags: tagArray});
    };

    // Render the Projects View - Updated to match the screenshot
    const renderProjectsView = () => (
        <div className="modern-projects-view">
            <div className="main-header">
                <h1>My Projects</h1>
                <button className="theme-toggle-button" onClick={toggleDarkMode}>
                    {darkMode ? '☀️' : '🌙'}
                </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="search-controls">
                <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search projects..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <div className="filter-controls">
                    <select 
                        className="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on-hold">On Hold</option>
                    </select>
                    
                    <button 
                        className="new-project-button"
                        onClick={() => setShowNewProjectModal(true)}
                    >
                        + New Project
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading projects...</div>
            ) : (
                <div className="modern-projects-grid">
                    {filteredProjects.length === 0 ? (
                        <div className="no-projects">
                            <p>No projects found. Create a new project to get started!</p>
                        </div>
                    ) : (
                        filteredProjects.map(project => (
                            <div 
                                key={project.id} 
                                className="modern-project-card" 
                                onClick={() => handleOpenProjectBoard(project)}
                                draggable
                                onDragStart={(e) => handleProjectDragStart(e, project)}
                                onDragOver={handleProjectDragOver}
                                onDrop={(e) => handleProjectDrop(e, project)}
                            >
                                <div className="dragging-helper">⋮⋮</div>
                                <div className="project-header">
                                    <h3>{project.name}</h3>
                                    <button 
                                        className="menu-button" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === project.id ? null : project.id);
                                        }}
                                    >
                                        ⋮
                                    </button>
                                    {openMenuId === project.id && (
                                        <div className="project-menu-dropdown">
                                            <button 
                                                className="menu-item"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleArchiveProject(project.id);
                                                    setOpenMenuId(null);
                                                }}
                                            >
                                                {project.archived ? 'Unarchive' : 'Archive'}
                                            </button>
                                            <button 
                                                className="menu-item delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Are you sure you want to delete this project?')) {
                                                        handleDeleteProject(project.id);
                                                    }
                                                    setOpenMenuId(null);
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {project.description && (
                                    <p className="project-description">{project.description}</p>
                                )}
                                <p className="last-updated">Last Updated: {formatDate(project.lastUpdated)}</p>
                                <div className={`status-indicator status-${project.status}`}>
                                    {project.status === 'in-progress' ? 'in progress' : project.status.replace('-', ' ')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* New Project Modal */}
            {showNewProjectModal && (
                <div className="modal" style={{ display: 'block' }}>
                    <div className="modal-content">
                        <span 
                            className="close-btn"
                            onClick={() => setShowNewProjectModal(false)}
                        >
                            &times;
                        </span>
                        <h2>Create New Project</h2>
                        {error && <div className="error-message">{error}</div>}
                        <form id="newProjectForm" onSubmit={handleCreateProject}>
                            <input
                                type="text"
                                id="newProjectName"
                                placeholder="Project Name"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                required
                            />
                            <textarea
                                id="newProjectDescription"
                                placeholder="Description (optional)"
                                value={newProjectDescription}
                                onChange={(e) => setNewProjectDescription(e.target.value)}
                            />
                            <select
                                id="newProjectStatus"
                                value={newProjectStatus}
                                onChange={(e) => setNewProjectStatus(e.target.value)}
                            >
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="on-hold">On Hold</option>
                            </select>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Project'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    // Render the Board View
    const renderBoardView = () => (
        <>
            <div className="project-header">
                <button className="back-button" onClick={handleBackToProjects}>
                    &larr; Back to Projects
                </button>
                <h2 id="projectTitle">{selectedProject?.name} - Project Board</h2>
                <div className="header-actions">
                    <button className="theme-toggle-button" onClick={toggleDarkMode}>
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    <button className="logout-button" onClick={onLogout}>Logout</button>
                </div>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            {loading ? (
                <div className="loading">Loading stories...</div>
            ) : (
                <div className="board-container">
                    <div className="board-column" data-status="todo">
                        <h3>To Do</h3>
                        <div 
                            className="column-content" 
                            onDrop={(e) => handleDrop(e, 'todo')}
                            onDragOver={handleDragOver}
                        >
                            {stories
                                .filter(story => story.status === 'todo')
                                .map(story => (
                                    <div 
                                        key={story.id}
                                        className="story-card"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, story)}
                                    >
                                        <h4 className="story-title">{story.title}</h4>
                                        {story.connextraFormat && (
                                            <p className="story-connextra">{story.connextraFormat}</p>
                                        )}
                                        {story.description && (
                                            <p className="story-description">{story.description}</p>
                                        )}
                                        {story.tags && story.tags.length > 0 && (
                                            <div className="story-tags">
                                                {story.tags.map((tag, index) => (
                                                    <span key={index} className="tag">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            }
                        </div>
                        <button 
                            className="add-story-btn"
                            onClick={() => {
                                setStoryData({ ...storyData, status: 'todo' });
                                setShowStoryModal(true);
                            }}
                        >
                            + Add Story
                        </button>
                    </div>

                    <div className="board-column" data-status="in-progress">
                        <h3>In Progress</h3>
                        <div 
                            className="column-content"
                            onDrop={(e) => handleDrop(e, 'in-progress')}
                            onDragOver={handleDragOver}
                        >
                            {stories
                                .filter(story => story.status === 'in-progress')
                                .map(story => (
                                    <div 
                                        key={story.id}
                                        className="story-card"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, story)}
                                    >
                                        <h4 className="story-title">{story.title}</h4>
                                        {story.connextraFormat && (
                                            <p className="story-connextra">{story.connextraFormat}</p>
                                        )}
                                        {story.description && (
                                            <p className="story-description">{story.description}</p>
                                        )}
                                        {story.tags && story.tags.length > 0 && (
                                            <div className="story-tags">
                                                {story.tags.map((tag, index) => (
                                                    <span key={index} className="tag">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            }
                        </div>
                        <button 
                            className="add-story-btn"
                            onClick={() => {
                                setStoryData({ ...storyData, status: 'in-progress' });
                                setShowStoryModal(true);
                            }}
                        >
                            + Add Story
                        </button>
                    </div>

                    <div className="board-column" data-status="done">
                        <h3>Done</h3>
                        <div 
                            className="column-content"
                            onDrop={(e) => handleDrop(e, 'done')}
                            onDragOver={handleDragOver}
                        >
                            {stories
                                .filter(story => story.status === 'done')
                                .map(story => (
                                    <div 
                                        key={story.id}
                                        className="story-card"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, story)}
                                    >
                                        <h4 className="story-title">{story.title}</h4>
                                        {story.connextraFormat && (
                                            <p className="story-connextra">{story.connextraFormat}</p>
                                        )}
                                        {story.description && (
                                            <p className="story-description">{story.description}</p>
                                        )}
                                        {story.tags && story.tags.length > 0 && (
                                            <div className="story-tags">
                                                {story.tags.map((tag, index) => (
                                                    <span key={index} className="tag">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            }
                        </div>
                        <button 
                            className="add-story-btn"
                            onClick={() => {
                                setStoryData({ ...storyData, status: 'done' });
                                setShowStoryModal(true);
                            }}
                        >
                            + Add Story
                        </button>
                    </div>
                </div>
            )}

            {/* Story Creation Modal */}
            {showStoryModal && (
                <div id="storyModal" className="modal" style={{ display: 'block' }}>
                    <div className="modal-content">
                        <span 
                            className="close-btn"
                            onClick={() => setShowStoryModal(false)}
                        >
                            &times;
                        </span>
                        <h2>Create New Story</h2>
                        {error && <div className="error-message">{error}</div>}
                        <form id="storyForm" onSubmit={handleAddStory}>
                            <div className="form-group">
                                <label htmlFor="storyTitle">Title</label>
                                <input 
                                    type="text" 
                                    id="storyTitle" 
                                    placeholder="Story Title"
                                    value={storyData.title}
                                    onChange={(e) => setStoryData({...storyData, title: e.target.value})}
                                    required 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="storyConnextra">Connextra Format</label>
                                <textarea 
                                    id="storyConnextra" 
                                    placeholder="As a [role], I want to [action] so that [benefit]"
                                    value={storyData.connextraFormat}
                                    onChange={(e) => setStoryData({...storyData, connextraFormat: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="storyDescription">Additional Description</label>
                                <textarea 
                                    id="storyDescription" 
                                    placeholder="Additional details, acceptance criteria, etc."
                                    value={storyData.description}
                                    onChange={(e) => setStoryData({...storyData, description: e.target.value})}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="storyTags">Tags</label>
                                <input 
                                    type="text" 
                                    id="storyTags" 
                                    placeholder="Enter tags separated by commas (e.g. frontend, bug, urgent)"
                                    value={storyData.tags.join(', ')}
                                    onChange={(e) => handleTagInput(e.target.value)}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="storyStatus">Status</label>
                                <select 
                                    id="storyStatus"
                                    value={storyData.status}
                                    onChange={(e) => setStoryData({...storyData, status: e.target.value})}
                                >
                                    <option value="todo">To Do</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                            
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Creating...' : 'Add Story'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );

    // Main render
    return (
        <div className={`modern-container ${darkMode ? 'dark-mode' : ''}`}>
            {showProjectBoard ? renderBoardView() : renderProjectsView()}
        </div>
    );
};

export default ProjectBoard;