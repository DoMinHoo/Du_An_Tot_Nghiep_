
const Notification = require('../models/notification');


exports.getAllNotifications = async (req, res) => {
    try {
        const notifi = await Notification.find().sort({ createdAt: -1 });
        res.json({ success: true, data: notifi });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thông báo', error: error.message });
    }
}
exports.createNotification = async (res, req) => {
    try {
        const notifi = await Notification.create(req.body);
        return res.status(201).json({ success: true, data: notifi });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi khi tạo thông báo', error: error.message });
    }
}

exports.markAsRead = async (req, res) => {
    try {
        const notifi = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notifi) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
        }
        res.json({ success: true, data: notifi });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi đánh dấu thông báo là đã đọc', error: error.message });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        await Notification.deleteMany({});
        res.json({ success: true, message: 'Đã xóa tất cả thông báo' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa thông báo', error: error.message });
    }
}


exports.getNotificationById = async (req, res) => {
    const { id } = req.params;
    console.log('Fetching notifications for user ID:', id);
    try {
        const notifi = await Notification.find({ userId: id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: notifi });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thông báo', error: error.message });
    }
};

