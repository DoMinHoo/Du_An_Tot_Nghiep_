// ⬇️ Thêm ở đầu
import { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import socket from '../../services/soket'; // Thêm dòng này để dùng trực tiếp socket
import { useSocket } from '../../hooks/useSoket'; // hook để lắng nghe socket event

interface Notification {
    _id: string;
    name: string;
    message?: string;
    createdAt?: string;
    orderCode?: string;
    isRead?: boolean;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const userInfo = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    const currentId = userInfo?._id || '';

    // ✅ Callback xử lý khi có đơn hàng mới
    const handleNewOrder = useCallback(async (orderData: any) => {
        try {
            const res = await axios.post('http://localhost:5000/api/notifications', {
                orderData,
                currentId,
            });

            if (res.data.success) {
                setNotifications((prev) => [res.data.data, ...prev]);
                setIsOpen(true); // mở popover khi có đơn mới
            }
        } catch (error) {
            console.error('Lỗi tạo thông báo:', error);
        }
    }, [currentId]);

    // ✅ Gọi useSocket và truyền event + callback
    useSocket(`new-order-${currentId}`, handleNewOrder);

    // Join vào room riêng cho user
    useEffect(() => {
        if (socket && currentId) {
            socket.emit('join-room', currentId);
        }
    }, [currentId]);

    // Lấy danh sách thông báo ban đầu
    useEffect(() => {
        const fetchNotificationsByUser = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/notifications/${currentId}`);
                if (res.data.success) {
                    setNotifications(res.data.data);
                }
            } catch (error) {
                console.error('Lỗi khi tải thông báo:', error);
            }
        };

        if (currentId) {
            fetchNotificationsByUser();
        }
    }, [currentId]);

    // Click vào thông báo
    const handleNotificationClick = async (id: string) => {
        try {
            await axios.patch(`http://localhost:5000/api/notifications/${id}/mark-as-read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setIsOpen(false);
            navigate('/order-history');
        } catch (error) {
            console.error('Lỗi đánh dấu đã đọc:', error);
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="relative cursor-pointer w-10 h-10 flex items-center justify-center">
                    <Bell />
                    {unreadCount > 0 && (
                        <Badge className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount}
                        </Badge>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white">
                <h4 className="font-semibold mb-2">Thông báo</h4>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <li className="text-gray-500 text-sm">Không có thông báo</li>
                    ) : (
                        notifications.map((noti) => (
                            <li
                                key={noti._id}
                                className={`cursor-pointer p-2 rounded transition ${!noti.isRead ? 'bg-gray-200 hover:bg-gray-300' : 'hover:bg-gray-100'
                                    }`}
                                onClick={() => handleNotificationClick(noti._id)}
                            >
                                {noti.message}
                            </li>
                        ))
                    )}
                </ul>
            </PopoverContent>
        </Popover>
    );
}