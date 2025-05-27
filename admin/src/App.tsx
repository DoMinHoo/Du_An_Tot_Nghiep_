import { Button, Table } from 'antd'
import './App.css'
function App() {
  const columns = [
    { title: 'Tên sản phẩm', dataIndex: 'name' },
    { title: 'Giá', dataIndex: 'price' },
  ];

  const data = [
    { key: '1', name: 'Sofa Góc', price: '18.000.000đ' },
  ];
  return (
    <div style={{ padding: 24 }}>
      <Button type="primary">Thêm mới</Button>
      <Table columns={columns} dataSource={data} />
    </div>
  )
}

export default App
