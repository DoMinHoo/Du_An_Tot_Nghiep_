import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';


interface Notification {
    id: string,
    title: string,
    orderCode: string,
    isRead: boolean,
    createdAt: string,
}

interface NotificationState {
    items: Notification[],
}

const initialState: NotificationState = {
    items: [],
}

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action: PayloadAction<Notification>) => {
            state.items.push(action.payload);
        },
        markAsRead: (state, action: PayloadAction<string>) => {
            const noti = state.items.find((n) => n.id === action.payload);
            if (noti) noti.isRead = true;
        },
        markAllRead: (state) => {
            state.items.forEach((n) => (n.isRead = true));
        }
    }
})

export const { addNotification, markAllRead, markAsRead } = notificationSlice.actions;
export default notificationSlice.reducer

