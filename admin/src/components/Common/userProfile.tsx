// import React, { useEffect, useState } from "react";
// import {
//   Modal,
//   Form,
//   Input,
//   DatePicker,
//   Select,
//   Button,
//   message,
// } from "antd";
// import dayjs from "dayjs";
// import axios from "axios";

// interface Props {
//   open: boolean;
//   onClose: () => void;
// }

// const UserProfileModal: React.FC<Props> = ({ open, onClose }) => {
//   const [form] = Form.useForm();
//   const [passwordForm] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const token = localStorage.getItem("token");

//   useEffect(() => {
//     if (open) fetchUserProfile();
//   }, [open]);

//   const fetchUserProfile = async () => {
//     try {
//       const res = await axios.get("/api/users/profile", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const user = res.data;
//       form.setFieldsValue({
//         name: user.name,
//         address: user.address,
//         phone: user.phone,
//         gender: user.gender,
//         dateBirth: user.dateBirth ? dayjs(user.dateBirth) : null,
//       });
//     } catch (error) {
//       message.error("Không thể lấy thông tin người dùng");
//     }
//   };

//   const handleUpdateProfile = async (values: any) => {
//     setLoading(true);
//     try {
//       const payload = {
//         ...values,
//         dateBirth: values.dateBirth ? values.dateBirth.toISOString() : null,
//       };
//       const res = await axios.put("/api/users/update-profile", payload, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       message.success("Cập nhật thành công");
//       localStorage.setItem("currentUser", JSON.stringify(res.data.user));
//       onClose();
//     } catch (err) {
//       message.error("Cập nhật thất bại");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChangePassword = async (values: any) => {
//     try {
//       await axios.put("/api/auth/change-password", values, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       message.success("Đổi mật khẩu thành công");
//       passwordForm.resetFields();
//     } catch (err: any) {
//       message.error(err?.response?.data?.message || "Lỗi khi đổi mật khẩu");
//     }
//   };

//   return (
//     <Modal
//       open={open}
//       title="Thông tin cá nhân"
//       onCancel={onClose}
//       footer={null}
//       width={600}
//     >
//       <Form layout="vertical" form={form} onFinish={handleUpdateProfile}>
//         <Form.Item name="name" label="Họ tên">
//           <Input />
//         </Form.Item>
//         <Form.Item name="address" label="Địa chỉ">
//           <Input />
//         </Form.Item>
//         <Form.Item name="phone" label="Số điện thoại">
//           <Input />
//         </Form.Item>
//         <Form.Item name="gender" label="Giới tính">
//           <Select>
//             <Select.Option value="male">Nam</Select.Option>
//             <Select.Option value="female">Nữ</Select.Option>
//             <Select.Option value="other">Khác</Select.Option>
//           </Select>
//         </Form.Item>
//         <Form.Item name="dateBirth" label="Ngày sinh">
//           <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
//         </Form.Item>
//         <Form.Item>
//           <Button type="primary" htmlType="submit" loading={loading}>
//             Cập nhật thông tin
//           </Button>
//         </Form.Item>
//       </Form>

//       <Form layout="vertical" form={passwordForm} onFinish={handleChangePassword}>
//         <Form.Item
//           name="oldPassword"
//           label="Mật khẩu cũ"
//           rules={[{ required: true, message: "Vui lòng nhập mật khẩu cũ" }]}
//         >
//           <Input.Password />
//         </Form.Item>
//         <Form.Item
//           name="newPassword"
//           label="Mật khẩu mới"
//           rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới" }]}
//         >
//           <Input.Password />
//         </Form.Item>
//         <Form.Item>
//           <Button type="primary" danger htmlType="submit">
//             Đổi mật khẩu
//           </Button>
//         </Form.Item>
//       </Form>
//     </Modal>
//   );
// };

// export default UserProfileModal;
