// Importing the workspace model for database operations
const workspaceModel = require('../database/workspaces/workspaces.workspaces');

// Importing the `NotFoundError` class for handling resource not found errors
const { NotFoundError } = require('../errors/index.errors');

/**
 * @function createWorkspace
 * @description Creates a new workspace with type association and amenities
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function to handle errors
 * @returns {Promise<void>} Sends a JSON response containing the newly created workspace
 */
const createWorkspace = async (req, res, next) => {
  try {
    const workspaceData = req.body; // Extract workspace data from the request body
    const newWorkspace = await workspaceModel.createWorkspace(workspaceData);
    res.status(201).json({ data: newWorkspace }); // Send the created workspace
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
};

/**
 * @function getWorkspaceById
 * @description Retrieves a workspace by its ID with complete details
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function to handle errors
 * @returns {Promise<void>} Sends a JSON response containing the workspace details
 * @throws {NotFoundError} If the workspace with the given ID is not found
 */
const getWorkspaceById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10); // Extract and parse the workspace ID
    const includeInactive = req.query.includeInactive === 'true'; // Check if inactive workspaces should be included
    const workspace = await workspaceModel.getWorkspaceById(
      id,
      includeInactive
    );

    if (!workspace) {
      throw new NotFoundError('Workspace not found'); // Throw error if workspace does not exist
    }

    res.status(200).json({ data: workspace }); // Send the workspace details
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
};

/**
 * @function getAllWorkspaces
 * @description Retrieves all workspaces with advanced filtering and pagination
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function to handle errors
 * @returns {Promise<void>} Sends a JSON response containing the list of workspaces
 */
const getAllWorkspaces = async (req, res, next) => {
  try {
    const filters = {
      type_id: req.query.type_id ? parseInt(req.query.type_id, 10) : undefined,
      floor: req.query.floor ? parseInt(req.query.floor, 10) : undefined,
      includeInactive: req.query.includeInactive === 'true',
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
      offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
    };

    const workspaces = await workspaceModel.getAllWorkspaces(filters);
    res.status(200).json({ data: workspaces }); // Send the list of workspaces
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
};

module.exports = {
  createWorkspace,
  getWorkspaceById,
  getAllWorkspaces,
};
