const express = require('express');
const {
  createWorkspace,
  getWorkspaceById,
  getAllWorkspaces,
} = require('../controllers/workspaces.controllers');

const router = express.Router();

// Route to create a new workspace
router.post('/', createWorkspace);

// Route to get a workspace by ID
router.get('/:id', getWorkspaceById);

// Route to get all workspaces with filtering and pagination
router.get('/', getAllWorkspaces);

module.exports = router;
