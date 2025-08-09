const moment = require('moment');

const getDateRange = (period, customStart, customEnd) => {
    const now = moment().utcOffset(+7); // Múi giờ +07 (Việt Nam)
    let startDate, endDate, previousStartDate, previousEndDate;

    if (customStart && customEnd) {
        const start = moment(customStart, 'YYYY-MM-DD', true).utcOffset(+7);
        const end = moment(customEnd, 'YYYY-MM-DD', true).utcOffset(+7);
        if (!start.isValid() || !end.isValid()) {
            throw new Error('Định dạng startDate hoặc endDate không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD.');
        }
        if (end.isBefore(start)) {
            throw new Error('endDate phải lớn hơn hoặc bằng startDate.');
        }
        startDate = start.toDate();
        endDate = end.toDate();
        const diff = Math.abs(end.diff(start, 'days'));
        previousStartDate = start.clone().subtract(diff, 'days').toDate();
        previousEndDate = end.clone().subtract(diff, 'days').toDate();
    } else if (period === 'day') {
        startDate = now.startOf('day').toDate();
        endDate = now.endOf('day').toDate();
        previousStartDate = now.clone().subtract(1, 'day').startOf('day').toDate();
        previousEndDate = now.clone().subtract(1, 'day').endOf('day').toDate();
    } else if (period === 'month') {
        startDate = now.startOf('month').toDate();
        endDate = now.endOf('month').toDate();
        previousStartDate = now.clone().subtract(1, 'month').startOf('month').toDate();
        previousEndDate = now.clone().subtract(1, 'month').endOf('month').toDate();
    } else if (period === 'year') {
        startDate = now.startOf('year').toDate();
        endDate = now.endOf('year').toDate();
        previousStartDate = now.clone().subtract(1, 'year').startOf('year').toDate();
        previousEndDate = now.clone().subtract(1, 'year').endOf('year').toDate();
    } else {
        throw new Error('Khoảng thời gian không hợp lệ.');
    }

    return { startDate, endDate, previousStartDate, previousEndDate };
};

module.exports = { getDateRange };