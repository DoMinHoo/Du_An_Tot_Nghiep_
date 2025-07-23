import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { addNotification } from "../redux/slices/notificationSlice";
import { socket } from "../lib/socket";

export const useSoket = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        socket.on('new-order', (data) => {
            dispatch(addNotification({
                id: data.orderCode,
                title: 'Đơn hàng mới từ: ${data.shippingAddress.name}',
                orderCode: data.orderCode,
                isRead: false,
                createdAt: new Date().toISOString(),
            }));
        });

        return () => {
            socket.off('new-order');
        }

    }, []);
}