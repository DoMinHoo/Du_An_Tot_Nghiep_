import React from 'react'
import AdminHeader from '../Common/header'
import AdminSidebar from '../Common/sidebar'
import { Layout } from 'antd'

const { Content, Sider } = Layout

type Props = {
  children: React.ReactNode
}

const MainLayout = ({ children }: Props) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar bên trái */}
      <Sider width={200}>
        <AdminSidebar />
      </Sider>

      {/* Phần còn lại */}
      <Layout>
        {/* Header trên cùng */}
        <AdminHeader />

        {/* Nội dung chính */}
        <Content style={{ margin: '16px', padding: 24, background: '#fff' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
