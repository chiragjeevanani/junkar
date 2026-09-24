import CategoryRequest from '../models/CategoryRequest.js';
import Scrapper from '../models/Scrapper.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// @desc    Create a new category request
// @route   POST /api/v1/category-requests
// @access  Private/Scrapper (Dukandaar or Wholesaler only)
export const createCategoryRequest = async (req, res) => {
  try {
    const { category } = req.body;
    
    if (!category || category.trim() === '') {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const scrapper = await Scrapper.findById(req.user.id);
    if (!scrapper) {
      return res.status(404).json({ success: false, error: 'Scrapper profile not found' });
    }

    // Ensure it's dukandaar or wholesaler
    const scrapperType = scrapper.scrapperType || 'feri_wala';
    if (!['dukandaar', 'wholesaler'].includes(scrapperType)) {
      return res.status(403).json({ success: false, error: 'Only Dukandaar or Wholesaler can request new categories' });
    }

    const newRequest = await CategoryRequest.create({
      scrapperId: scrapper._id,
      name: scrapper.name,
      city: scrapper.businessLocation?.city || 'Unknown',
      role: scrapperType,
      category: category.trim()
    });

    res.status(201).json({
      success: true,
      data: newRequest
    });

  } catch (error) {
    logger.error('Error creating category request:', error);
    res.status(500).json({ success: false, error: 'Server error while creating category request' });
  }
};

// @desc    Get all pending category requests
// @route   GET /api/v1/admin/category-requests
// @access  Private/Admin
export const getAllCategoryRequests = async (req, res) => {
  try {
    const requests = await CategoryRequest.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    logger.error('Error fetching category requests:', error);
    res.status(500).json({ success: false, error: 'Server error while fetching category requests' });
  }
};

// @desc    Delete/Dismiss a category request
// @route   DELETE /api/v1/admin/category-requests/:id
// @access  Private/Admin
export const deleteCategoryRequest = async (req, res) => {
  try {
    const request = await CategoryRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Category request not found' });
    }

    await request.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error('Error deleting category request:', error);
    res.status(500).json({ success: false, error: 'Server error while deleting category request' });
  }
};
