import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Card,
  Col,
  Row,
  message,
  Spin,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import type { User } from "../../Types/user.interface";
import type { Role } from "../../Types/role.interface";

const UserDetail: React.FC = () => {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  // Lấy thông tin user + roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, rolesRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/users/${id}`),
          axios.get(`http://localhost:5000/api/roles`),
        ]);

        const userData = userRes.data?.data || userRes.data;
        const rolesData = rolesRes.data?.data || rolesRes.data;

        setUser(userData);
        setRoles(rolesData);

        // set form values
        form.setFieldsValue({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          gender: userData.gender,
          address: userData.address,
          dateBirth: userData.dateBirth ? dayjs(userData.dateBirth) : null,
          roleId: userData.roleId?._id,
          status: userData.status,
        });
      } catch (err: any) {
        message.error("Không thể tải thông tin người dùng");
        navigate("/admin/users");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, navigate, form]);

  // Submit cập nhật
  const handleUpdate = async (values: any) => {
    try {
      setSaving(true);
      const payload = {
        ...values,
        dateBirth: values.dateBirth ? values.dateBirth.toISOString() : null,
      };

      await axios.patch(`http://localhost:5000/api/users/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      message.success("Cập nhật người dùng thành công");
      navigate("/admin/users");
    } catch (err: any) {
      message.error(err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin size="large" />;

  if (!user) return <div>Không tìm thấy người dùng.</div>;

  return (
    <div>
      <h2>Chi tiết & Cập nhật người dùng</h2>
      <Card>
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tên" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ required: true, type: "email" }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số điện thoại" name="phone">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Giới tính" name="gender">
                <Select>
                  <Select.Option value="male">Nam</Select.Option>
                  <Select.Option value="female">Nữ</Select.Option>
                  <Select.Option value="other">Khác</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Địa chỉ" name="address">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày sinh" name="dateBirth">
                <DatePicker format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Quyền"
                name="roleId"
                rules={[{ required: true, message: "Chọn quyền" }]}
              >
                <Select placeholder="Chọn quyền">
                  {roles.map((role) => (
                    <Select.Option key={role._id} value={role._id}>
                      {role.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="active">Hoạt động</Select.Option>
                  <Select.Option value="banned">Đã khóa</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default UserDetail;
