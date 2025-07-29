const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.Controller');
const { protect, optionalProtect } = require('../middlewares/auth.middleware'); // Import middleware

router.get('/', notificationController.getAllNotifications);
router.get('/:id', notificationController.getNotificationById)
router.post('/', notificationController.createNotification);
router.patch('/:id/mark-as-read', notificationController.markAsRead);
router.delete('/', notificationController.deleteNotification);

module.exports = router;