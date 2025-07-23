// HeaderNotification.tsx
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../redux/reduxStore';
import { markAsRead } from '../../redux/slices/notificationSlice';
import { useNavigate } from 'react-router-dom';

export const HeaderNotification = () => {
    const notifications = useSelector((state: RootState) => state.notifications.items);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleClick = (notiId: string, orderCode: string) => {
        dispatch(markAsRead(notiId));
        navigate(`/orders/${orderCode}`);
    };

    return (
        <div className="relative">
            <button>
                🔔 {unreadCount > 0 && <span className="text-red-500">{unreadCount}</span>}
            </button>
            <div className="absolute bg-white border mt-2 right-0 w-64 z-50 shadow-lg">
                {notifications.map(n => (
                    <div
                        key={n.id}
                        onClick={() => handleClick(n.id, n.orderCode)}
                        className={`p-2 border-b hover:bg-gray-100 cursor-pointer ${!n.isRead ? 'font-bold' : ''}`}
                    >
                        {n.title}
                        <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
