    const { createLogger, format, transports } = require('winston');

    // Tạo logger với Winston
    const logger = createLogger({
    level: 'info', // Mức log mặc định
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Thêm thời gian
        format.errors({ stack: true }), // Ghi lại stack trace cho lỗi
        format.json() // Định dạng JSON để dễ phân tích
    ),
    transports: [
        // Ghi log vào console
        new transports.Console(),
        // Ghi log vào file
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' }),
    ],
    });

    // Nếu không chạy trong môi trường production, in log ra console với định dạng dễ đọc
    if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
        })
    );
    }

    module.exports = logger;