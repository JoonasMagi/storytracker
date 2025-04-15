const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('./db');

// Initialize express app
const app = express();
const PORT = 3001; // Explicitly set port to 3001 without fallback

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Validation middleware
const validateRegistration = [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

// API Routes
// User Registration
app.post('/api/register', validateRegistration, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    await db.query(
      'INSERT INTO users (email, password, created_at) VALUES (?, ?, NOW())',
      [email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Find user by email
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        email: user.email
      }
    };

    // Set token expiration based on "Remember me" option
    const expiresIn = rememberMe ? '30d' : '1h';

    jwt.sign(payload, JWT_SECRET, { expiresIn }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token,
        user: {
          id: user.id,
          email: user.email
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// User Profile (requires authentication)
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, email, created_at FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get User Preferences (requires authentication)
app.get('/api/preferences', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT preferences FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If preferences is null, return empty object
    const preferences = users[0].preferences ? JSON.parse(users[0].preferences) : {};
    res.json(preferences);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update User Preferences (requires authentication)
app.put('/api/preferences', authenticateToken, async (req, res) => {
  try {
    const { darkMode, language } = req.body;
    
    // Create preferences JSON object
    const preferences = JSON.stringify({
      darkMode: darkMode === true,
      language: language || 'en'
    });

    // Update user preferences in database
    await db.query(
      'UPDATE users SET preferences = ? WHERE id = ?',
      [preferences, req.user.id]
    );

    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

// Projects Routes

// Get all projects for the authenticated user
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const [projects] = await db.query(
      'SELECT id, name, description, status, archived, display_order, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY display_order ASC, updated_at DESC',
      [req.user.id]
    );
    
    // Format the dates for each project
    const formattedProjects = projects.map(project => ({
      ...project,
      lastUpdated: project.updated_at
    }));
    
    res.json(formattedProjects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new project
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { name, description, status } = req.body;
    
    // Validate input
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    
    // Valid statuses
    const validStatuses = ['in-progress', 'completed', 'on-hold'];
    const projectStatus = validStatuses.includes(status) ? status : 'in-progress';
    
    // Insert the new project
    const [result] = await db.query(
      'INSERT INTO projects (name, description, status, user_id) VALUES (?, ?, ?, ?)',
      [name, description || null, projectStatus, req.user.id]
    );
    
    // Get the newly created project
    const [projects] = await db.query(
      'SELECT id, name, description, status, archived, created_at, updated_at FROM projects WHERE id = ?',
      [result.insertId]
    );
    
    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const project = {
      ...projects[0],
      lastUpdated: projects[0].updated_at
    };
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project order
app.put('/api/projects/order', authenticateToken, async (req, res) => {
  try {
    const { projectOrder } = req.body;
    
    if (!Array.isArray(projectOrder)) {
      return res.status(400).json({ message: 'Project order must be an array of project IDs' });
    }
    
    // Verify all projects belong to the user
    const [userProjects] = await db.query(
      'SELECT id FROM projects WHERE user_id = ?',
      [req.user.id]
    );
    
    const userProjectIds = userProjects.map(p => p.id);
    const validOrder = projectOrder.every(id => userProjectIds.includes(id));
    
    if (!validOrder) {
      return res.status(403).json({ message: 'Unauthorized access to one or more projects' });
    }
    
    // Update the order for each project
    for (let i = 0; i < projectOrder.length; i++) {
      await db.query(
        'UPDATE projects SET display_order = ? WHERE id = ? AND user_id = ?',
        [i, projectOrder[i], req.user.id]
      );
    }
    
    res.json({ message: 'Project order updated successfully' });
  } catch (error) {
    console.error('Update project order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a project
app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, archived } = req.body;
    
    // Check if project exists and belongs to user
    const [projects] = await db.query(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }
    
    // Build update query based on provided fields
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    
    if (status !== undefined) {
      const validStatuses = ['in-progress', 'completed', 'on-hold'];
      if (validStatuses.includes(status)) {
        updates.push('status = ?');
        values.push(status);
      }
    }
    
    if (archived !== undefined) {
      updates.push('archived = ?');
      values.push(archived);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    // Add the project ID and user ID to values array
    values.push(id);
    values.push(req.user.id);
    
    // Update the project
    await db.query(
      `UPDATE projects SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
      values
    );
    
    // Get the updated project
    const [updatedProjects] = await db.query(
      'SELECT id, name, status, archived, created_at, updated_at FROM projects WHERE id = ?',
      [id]
    );
    
    if (updatedProjects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const updatedProject = {
      ...updatedProjects[0],
      lastUpdated: updatedProjects[0].updated_at
    };
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a project
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if project exists and belongs to user
    const [projects] = await db.query(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }
    
    // Delete the project (stories will be deleted via ON DELETE CASCADE)
    await db.query(
      'DELETE FROM projects WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Story routes

// Get all stories for a project
app.get('/api/projects/:projectId/stories', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Check if project exists and belongs to user
    const [projects] = await db.query(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.id]
    );
    
    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }
    
    // Get all stories for the project
    const [stories] = await db.query(
      'SELECT id, title, description, connextraFormat, tags, status, created_at, updated_at FROM stories WHERE project_id = ?',
      [projectId]
    );
    
    // Convert tags from JSON string to array if not null
    const processedStories = stories.map(story => ({
      ...story,
      tags: story.tags ? JSON.parse(story.tags) : []
    }));
    
    res.json(processedStories);
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single story by ID
app.get('/api/stories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get story with user verification
    const [stories] = await db.query(
      `SELECT s.*, p.user_id as project_owner_id 
       FROM stories s
       JOIN projects p ON s.project_id = p.id
       WHERE s.id = ? AND p.user_id = ?`,
      [id, req.user.id]
    );
    
    if (stories.length === 0) {
      return res.status(404).json({ message: 'Story not found or unauthorized' });
    }
    
    // Get assignee information if assigned
    let assignee = null;
    if (stories[0].assignee_id) {
      const [users] = await db.query(
        'SELECT id, email FROM users WHERE id = ?',
        [stories[0].assignee_id]
      );
      if (users.length > 0) {
        assignee = users[0];
      }
    }
    
    // Get comments for the story
    const [comments] = await db.query(
      `SELECT c.id, c.content, c.created_at, c.updated_at, 
        u.id as user_id, u.email as user_email
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.story_id = ?
       ORDER BY c.created_at ASC`,
      [id]
    );
    
    // Format the response
    const story = {
      ...stories[0],
      tags: stories[0].tags ? JSON.parse(stories[0].tags) : [],
      assignee,
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        user: {
          id: comment.user_id,
          email: comment.user_email
        }
      }))
    };
    
    res.json(story);
  } catch (error) {
    console.error('Get story details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new story
app.post('/api/projects/:projectId/stories', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, connextraFormat, tags, status } = req.body;
    
    // Check if project exists and belongs to user
    const [projects] = await db.query(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [projectId, req.user.id]
    );
    
    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }
    
    // Validate input
    if (!title) {
      return res.status(400).json({ message: 'Story title is required' });
    }
    
    // Valid statuses
    const validStatuses = ['todo', 'in-progress', 'done'];
    const storyStatus = validStatuses.includes(status) ? status : 'todo';
    
    // Convert tags array to JSON string
    const tagsJson = tags ? JSON.stringify(tags) : null;
    
    // Insert the new story
    const [result] = await db.query(
      'INSERT INTO stories (title, description, connextraFormat, tags, status, project_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description || '', connextraFormat || '', tagsJson, storyStatus, projectId]
    );
    
    // Get the newly created story
    const [stories] = await db.query(
      'SELECT id, title, description, connextraFormat, tags, status, created_at, updated_at FROM stories WHERE id = ?',
      [result.insertId]
    );
    
    if (stories.length === 0) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    // Convert tags from JSON string to array if not null
    const story = {
      ...stories[0],
      tags: stories[0].tags ? JSON.parse(stories[0].tags) : []
    };
    
    res.status(201).json(story);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a story
app.put('/api/stories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, connextraFormat, tags, status, priority, assignee_id } = req.body;
    
    // Check if story exists and belongs to a project owned by the user
    const [stories] = await db.query(
      `SELECT s.* FROM stories s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = ? AND p.user_id = ?`,
      [id, req.user.id]
    );
    
    if (stories.length === 0) {
      return res.status(404).json({ message: 'Story not found or unauthorized' });
    }
    
    // Build update query based on provided fields
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    
    if (connextraFormat !== undefined) {
      updates.push('connextraFormat = ?');
      values.push(connextraFormat);
    }
    
    if (tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(tags));
    }
    
    if (status !== undefined) {
      const validStatuses = ['todo', 'in-progress', 'done'];
      if (validStatuses.includes(status)) {
        updates.push('status = ?');
        values.push(status);
      }
    }
    
    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (validPriorities.includes(priority)) {
        updates.push('priority = ?');
        values.push(priority);
      }
    }
    
    if (assignee_id !== undefined) {
      updates.push('assignee_id = ?');
      values.push(assignee_id || null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    // Add the story ID to values array
    values.push(id);
    
    // Update the story
    await db.query(
      `UPDATE stories SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
    
    // Get the updated story with assignee information
    const [updatedStories] = await db.query(
      `SELECT s.* FROM stories s
       JOIN projects p ON s.project_id = p.id
       WHERE s.id = ? AND p.user_id = ?`,
      [id, req.user.id]
    );
    
    if (updatedStories.length === 0) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    let assignee = null;
    if (updatedStories[0].assignee_id) {
      const [users] = await db.query(
        'SELECT id, email FROM users WHERE id = ?',
        [updatedStories[0].assignee_id]
      );
      if (users.length > 0) {
        assignee = users[0];
      }
    }
    
    const story = {
      ...updatedStories[0],
      tags: updatedStories[0].tags ? JSON.parse(updatedStories[0].tags) : [],
      assignee
    };
    
    res.json(story);
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a story
app.delete('/api/stories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if story exists and belongs to a project owned by the user
    const [stories] = await db.query(
      `SELECT s.* FROM stories s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = ? AND p.user_id = ?`,
      [id, req.user.id]
    );
    
    if (stories.length === 0) {
      return res.status(404).json({ message: 'Story not found or unauthorized' });
    }
    
    // Delete the story
    await db.query('DELETE FROM stories WHERE id = ?', [id]);
    
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Comment routes

// Add comment to a story
app.post('/api/stories/:storyId/comments', authenticateToken, async (req, res) => {
  try {
    const { storyId } = req.params;
    const { content } = req.body;
    
    // Validate input
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    // Check if story exists and user has access to it
    const [stories] = await db.query(
      `SELECT s.* FROM stories s
       JOIN projects p ON s.project_id = p.id
       WHERE s.id = ? AND p.user_id = ?`,
      [storyId, req.user.id]
    );
    
    if (stories.length === 0) {
      return res.status(404).json({ message: 'Story not found or unauthorized' });
    }
    
    // Insert the comment
    const [result] = await db.query(
      'INSERT INTO comments (content, story_id, user_id, created_at) VALUES (?, ?, ?, NOW())',
      [content, storyId, req.user.id]
    );
    
    // Get the newly created comment
    const [comments] = await db.query(
      `SELECT c.id, c.content, c.created_at, c.updated_at, 
        u.id as user_id, u.email as user_email
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    const comment = {
      id: comments[0].id,
      content: comments[0].content,
      createdAt: comments[0].created_at,
      updatedAt: comments[0].updated_at,
      user: {
        id: comments[0].user_id,
        email: comments[0].user_email
      }
    };
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a comment
app.put('/api/comments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Validate input
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    // Check if comment exists and belongs to user
    const [comments] = await db.query(
      'SELECT * FROM comments WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }
    
    // Update the comment
    await db.query(
      'UPDATE comments SET content = ?, updated_at = NOW() WHERE id = ?',
      [content, id]
    );
    
    // Get the updated comment
    const [updatedComments] = await db.query(
      `SELECT c.id, c.content, c.created_at, c.updated_at, 
        u.id as user_id, u.email as user_email
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    );
    
    const comment = {
      id: updatedComments[0].id,
      content: updatedComments[0].content,
      createdAt: updatedComments[0].created_at,
      updatedAt: updatedComments[0].updated_at,
      user: {
        id: updatedComments[0].user_id,
        email: updatedComments[0].user_email
      }
    };
    
    res.json(comment);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a comment
app.delete('/api/comments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if comment exists and belongs to user
    const [comments] = await db.query(
      'SELECT * FROM comments WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (comments.length === 0) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }
    
    // Delete the comment
    await db.query('DELETE FROM comments WHERE id = ?', [id]);
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users for assignment
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, email FROM users');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});