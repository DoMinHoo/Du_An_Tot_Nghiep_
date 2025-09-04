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
  const [searchTerm, setSearchTerm] = useState(''); // Tìm kiếm văn bản
  const [status, setStatus] = useState<string | null>(null); // Bộ lọc trạng thái
  const [socket, setSocket] = useState<any>(null);
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
  }, [page, limit, searchTerm, status]); // Thêm status vào dependencies

  useEffect(() => {
    if (location.state?.shouldRefresh) {
      fetchOrders();
    }
  }, [location.state]);

  // Khởi tạo và quản lý WebSocket
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    newSocket.on('admin-order-updated', (data: any) => {
      console.log('Received admin-order-updated:', data);
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
        if (!updatedOrders.find((o) => o._id === data.orderId)) {
          fetchOrders();
        }
        return updatedOrders;
      });
    });

    newSocket.on('admin-new-order', (data: any) => {
      console.log('Received admin-new-order:', data);
      fetchOrders();
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
        search: searchTerm || undefined, // Chỉ gửi search nếu có giá trị
        status: status || undefined, // Chỉ gửi status nếu có giá trị
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
          {/* {record.status !== 'completed' && (
            <Popconfirm
              title="Bạn có chắc muốn xóa đơn hàng này?"
              onConfirm={() => handleDeleteOrder(record._id)}
              okText="Có"
              cancelText="Không"
            >
              <Button danger>Xóa</Button>
            </Popconfirm>
          )} */}
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ margin: '0px', background: '#fff', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm đơn hàng (mã, tên, email...)"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1); // Reset về trang 1 khi tìm kiếm
          }}
          style={{ width: 300 }}
        />
        <Space>
          {Object.entries(statusText).map(([key, label]) => (
            <Button
              key={key}
              type={status === key ? 'primary' : 'default'}
              onClick={() => {
                setStatus(key);
                setPage(1);
              }}
            >
              {label}
            </Button>
          ))}
          <Button
            type={status === null ? 'primary' : 'default'}
            onClick={() => {
              setStatus(null);
              setPage(1);
            }}
          >
            Tất cả
          </Button>
        </Space>
      </div>
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
