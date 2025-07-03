    import React, { useState, useEffect } from 'react';

    interface DateFilterFormProps {
    onDateChange: (
        startDate: string | undefined,
        endDate: string | undefined
    ) => void;
    }

    const DateFilterForm: React.FC<DateFilterFormProps> = ({ onDateChange }) => {
    const [startDate, setStartDate] = useState<string | undefined>();
    const [endDate, setEndDate] = useState<string | undefined>();

    // Tự động gọi onDateChange khi cả hai ngày được chọn
    useEffect(() => {
        if (startDate && endDate) {
        onDateChange(startDate, endDate);
        }
    }, [startDate, endDate, onDateChange]);

    // Hàm đặt lại form
    const handleReset = () => {
        setStartDate(undefined);
        setEndDate(undefined);
        onDateChange(undefined, undefined);
    };

    return (
        <div className="input-group">
        <div className="input-wrapper">
            <label htmlFor="startDate" className="input-label">
            Ngày bắt đầu
            </label>
            <input
            type="date"
            id="startDate"
            value={startDate || ''}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
            />
        </div>
        <div className="input-wrapper">
            <label htmlFor="endDate" className="input-label">
            Ngày kết thúc
            </label>
            <input
            type="date"
            id="endDate"
            value={endDate || ''}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
            />
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleReset}>
            Đặt lại
        </button>
        </div>
    );
    };

    export default DateFilterForm;
