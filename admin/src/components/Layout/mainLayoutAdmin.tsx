import React from 'react';
import AdminHeader from '../Common/header';
import AdminSidebar from '../Common/sidebar';
import { Layout } from 'antd';

const { Content, Sider } = Layout;

type Props = {
  children: React.ReactNode;
};

const MainLayout = ({ children }: Props) => {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f6f8fa' }}>
      <Sider
        width={240}
        style={{
          background: '#fff',
          borderRight: '1px solid #e0e0e0',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <AdminSidebar />
      </Sider>

      <Layout>
        <AdminHeader />
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
            minHeight: 'calc(100vh - 120px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
