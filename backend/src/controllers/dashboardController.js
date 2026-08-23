const dashboardService = require('../services/dashboardService');

class DashboardController {
  // Get User Statistics
  async getUserAnalytics(req, res, next) {
    try {
      const data = await dashboardService.getUserAnalytics(req.user._id);
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Admin Analytics & Abuse Reports (Admin role protected)
  async getAdminAnalytics(req, res, next) {
    try {
      const data = await dashboardService.getAdminAnalytics();
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Ban User
  async banUser(req, res, next) {
    try {
      const { userId } = req.params;
      await dashboardService.banUser(userId, req.user._id);
      
      res.status(200).json({
        status: 'success',
        message: 'User account has been banned.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Soft Delete reported review
  async deleteReportedReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      await dashboardService.deleteReportedReview(reviewId);
      
      res.status(200).json({
        status: 'success',
        message: 'Review content has been removed.',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
