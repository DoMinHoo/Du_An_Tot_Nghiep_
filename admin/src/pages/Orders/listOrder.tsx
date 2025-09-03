import React, { useEffect, useState } from 'react';
import {
  Layout,
  Button,
  Input,
  Table,
  Space,
  Popconfirm,
  message,
  Spin,
  Tag,
  Tooltip,
} from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { getOrders, deleteOrder } from '../../Services/orders.service';
import { io } from 'socket.io-client';

const { Content } = Layout;

interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  street: string;
  province: string;
  district: string;
  ward: string;
  country: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface StatusEntry {
  status: string;
  changedAt: string;
  note?: string;
}

interface Order {
  _id: string;
  orderCode: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  shippingAddress: ShippingAddress;
  createdAt: string;
  items: OrderItem[];
  statusHistory: StatusEntry[];
  key?: number;
}

const statusText: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Đã giao',
  canceled: 'Đã hủy',
};

const statusColor: Record<string, string> = {
  pending: 'default',
  confirmed: 'blue',
  shipping: 'orange',
  completed: 'green',
  canceled: 'red',
};

const paymentStatusText: Record<string, string> = {
  pending: 'Chưa thanh toán',
  completed: 'Đã thanh toán',
  failed: 'Thanh toán thất bại',
  refund_pending: 'Chờ hoàn tiền',
  refunded: 'Đã hoàn tiền',
  expired: 'Thanh toán hết hạn',
};

const paymentStatusColor: Record<string, string> = {
  completed: 'green',
  refunded: 'purple',
  refund_pending: 'orange',
  failed: 'red',
  expired: 'orange',
  pending: 'default',
};

const OrderManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [socket, setSocket] = useState<any>(null); // Lưu socket instance

  // State cho phân trang
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  useEffect(() => {
    fetchOrders();
  }, [page, limit, searchTerm]);

  useEffect(() => {
    if (location.state?.shouldRefresh) {
      fetchOrders();
    }
  }, [location.state]);

  // Khởi tạo và quản lý WebSocket
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      reconnection: true, // Bật tự động kết nối lại
      reconnectionAttempts: 5, // Số lần thử kết nối lại
      reconnectionDelay: 1000, // Thời gian chờ giữa các lần thử (ms)
    });
    newSocket.on('admin-order-updated', (data: any) => {
      console.log('Received admin-order-updated:', data); // Debug
      setOrders((prevOrders) => {
        const updatedOrders = prevOrders.map((order) =>
          order._id === data.orderId
            ? {
              ...order,
              status: data.status,
              paymentStatus: data.paymentStatus,
            }
            : order
        );
        // Nếu không tìm thấy order trong danh sách hiện tại, fetch lại để đảm bảo
        if (!updatedOrders.find((o) => o._id === data.orderId)) {
          fetchOrders();
        }
        return updatedOrders;
      });
      // message.info(
      //   `Đơn hàng ${data.orderCode} đã được cập nhật: ${
      //     statusText[data.status] || data.status
      //   }`
      // );
    });

    newSocket.on('admin-new-order', (data: any) => {
      console.log('Received admin-new-order:', data); // Debug
      fetchOrders(); // Tải lại danh sách để thêm đơn mới
      message.success(`Đơn hàng mới từ ${data.message}`);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.off('admin-order-updated');
        newSocket.off('admin-new-order');
        newSocket.disconnect();
      }
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: searchTerm,
      };

      const res = await getOrders(params);
      setOrders(res.data || []);
      setPagination(
        res.pagination || { total: 0, page: 1, limit, totalPages: 1 }
      );
    } catch (error) {
      message.error('Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      message.success('Xóa đơn hàng thành công');
      fetchOrders();
    } catch (error) {
      message.error('Xóa đơn hàng thất bại');
    }
  };

  const columns = [
    {
      title: 'STT',
      render: (_: any, __: Order, index: number) =>
        (page - 1) * limit + index + 1,
    },
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderCode',
      key: 'orderCode',
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_: any, record: Order) => (
        <>
          <div>{record.shippingAddress.fullName}</div>
          <div>{record.shippingAddress.phone}</div>
          <div>{record.shippingAddress.email}</div>
        </>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) =>
        amount ? amount.toLocaleString('vi-VN') + ' VND' : 'N/A',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Order) => {
        const reason =
          status === 'canceled'
            ? record.statusHistory?.find((s) => s.status === 'canceled')?.note
            : null;
        const tag = (
          <Tag color={statusColor[status] || 'default'}>
            {statusText[status] || status}
          </Tag>
        );
        return status === 'canceled' && reason ? (
          <Tooltip title={`Lý do huỷ: ${reason}`}>{tag}</Tooltip>
        ) : (
          tag
        );
      },
    },
    {
      title: 'TT Thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (paymentStatus: string) => (
        <Tag color={paymentStatusColor[paymentStatus] || 'default'}>
          {paymentStatusText[paymentStatus] || paymentStatus}
        </Tag>
      ),
    },
    {
      title: 'Địa chỉ giao hàng',
      dataIndex: 'shippingAddress',
      key: 'shippingAddress',
      render: (address: ShippingAddress) =>
        address?.addressLine && address?.street
          ? `${address.addressLine}, ${address.street}, ${address.ward}, ${address.district}, ${address.province}`
          : 'N/A',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) =>
        date ? new Date(date).toLocaleString('vi-VN') : 'N/A',
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'items',
      key: 'items',
      render: (items: OrderItem[] = []) =>
        items.length > 0
          ? items.map((item, i) => (
            <div key={i}>
              {item.name} x{item.quantity}
              {item.price && item.price > 0
                ? ` – ${item.price.toLocaleString('vi-VN')}VND`
                : ''}
            </div>
          ))
          : 'Không có sản phẩm',
    },
    {
      title: 'Lịch sử trạng thái',
      dataIndex: 'statusHistory',
      key: 'statusHistory',
      render: (history: StatusEntry[] = []) =>
        history.length > 0
          ? history.map((item, i) => (
            <div key={i}>
              {statusText[item.status] || item.status} (
              {item.changedAt
                ? new Date(item.changedAt).toLocaleString('vi-VN')
                : 'N/A'}
              )
            </div>
          ))
          : 'Chưa có lịch sử',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Order) => (
        <Space>
          <Button type="primary" onClick={() => handleViewDetail(record._id)}>
            Chi tiết
          </Button>
          {record.status !== 'completed' && (
            <Popconfirm
              title="Bạn có chắc muốn xóa đơn hàng này?"
              onConfirm={() => handleDeleteOrder(record._id)}
              okText="Có"
              cancelText="Không"
            >
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ margin: '24px', background: '#fff', padding: 24 }}>
      <Input
        placeholder="Tìm kiếm đơn hàng..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setPage(1); // reset về trang 1 khi search
        }}
        style={{ width: 300, marginBottom: 16 }}
      />
      <div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin tip="Đang tải đơn hàng..." size="large" />
          </div>
        ) : (
          <Table
            dataSource={orders}
            columns={columns}
            rowKey={(record) => record._id}
            pagination={{
              current: page,
              pageSize: limit,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '20', '50'],
              onChange: (newPage, newSize) => {
                setPage(newPage);
                setLimit(newSize || 10);
              },
            }}
          />
        )}
      </div>
    </Content>
  );
};

export default OrderManager;
