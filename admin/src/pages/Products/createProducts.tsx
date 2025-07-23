import React, { useRef, useMemo, useCallback } from 'react'; // Thêm useRef, useMemo, useCallback
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Upload,
  Row,
  Col,
  message,
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createProduct, getCategories } from '../../Services/products.service';
import { useNavigate } from 'react-router-dom';
import type { Category } from '../../Types/product.interface';
import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import Quill's CSS
import axios from 'axios'; // Import axios để upload ảnh từ Quill

const { TextArea } = Input;
const { Option } = Select;

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const quillRef = useRef<ReactQuill>(null); // Ref để truy cập Quill instance

  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { mutate: createMutate, isPending } = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      message.success('Đã thêm sản phẩm!');
      form.resetFields();
      navigate('/admin/products');
    },
    onError: () => {
      message.error('Thêm sản phẩm thất bại!');
    },
  });

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  // Hàm tải ảnh cho nội dung Quill (Mô tả chi tiết)
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        const formData = new FormData();
        formData.append('image', file);

        try {
          message.loading({ content: 'Đang tải ảnh lên...', key: 'quillImageUpload' });
          const res = await axios.post('http://localhost:5000/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          // Giả sử backend trả về đường dẫn tương đối, cần thêm baseURL
          const url = `http://localhost:5000${res.data.url}`;

          // Chèn ảnh vào trình soạn thảo Quill tại vị trí con trỏ hiện tại
          if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            const range = editor.getSelection();
            if (range) {
              editor.insertEmbed(range.index, 'image', url);
            } else {
              // Nếu không có selection, chèn vào cuối
              editor.insertEmbed(editor.getLength(), 'image', url);
            }
          }
          message.success({ content: 'Tải ảnh lên thành công!', key: 'quillImageUpload', duration: 2 });
        } catch (error) {
          console.error('Lỗi khi tải ảnh lên Quill:', error);
          message.error({ content: 'Tải ảnh lên thất bại!', key: 'quillImageUpload', duration: 2 });
        }
      }
    };
  }, []);

  // Tùy chỉnh modules cho ReactQuill để thêm trình xử lý ảnh
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['link', 'image'], // Đảm bảo 'image' có mặt ở đây
        ['clean']
      ],
      handlers: {
        image: imageHandler, // Gán hàm xử lý ảnh tùy chỉnh cho nút 'image'
      },
    },
  }), [imageHandler]);

  const handleFinish = (values: any) => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('brand', values.brand); // Đã thêm trường brand
    formData.append('descriptionShort', values.descriptionShort);
    formData.append('descriptionLong', values.descriptionLong || ''); // descriptionLong sẽ là HTML từ ReactQuill
    formData.append('categoryId', values.categoryId);
    formData.append('status', values.status);

    if (values.images) {
      values.images.forEach((file: any) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });
    }

    createMutate(formData);
  };

  return (
    <React.Fragment>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/admin/products')}
      >
        Quay lại
      </Button>
      <Card title="➕ Thêm sản phẩm mới" style={{ margin: 24 }}>
        <Form
          layout="vertical"
          form={form}
          onFinish={handleFinish}
          initialValues={{ status: 'active', totalPurchased: 0 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên sản phẩm"
                name="name"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên sản phẩm' },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            {/* THÊM TRƯỜNG BRAND (THƯƠNG HIỆU) VÀO ĐÂY */}
            <Col span={12}>
              <Form.Item
                label="Thương hiệu"
                name="brand"
                rules={[
                  { required: true, message: 'Vui lòng nhập thương hiệu' },
                ]}
              >
                <Input placeholder="Nhập thương hiệu" />
              </Form.Item>
            </Col>
            {/* KẾT THÚC THÊM TRƯỜNG BRAND */}

            <Col span={12}>
              <Form.Item
                label="Danh mục"
                name="categoryId"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  loading={isLoading}
                  disabled={isLoading || isError}
                >
                  {categories?.map((category) => (
                    <Option key={category._id} value={category._id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Mô tả ngắn"
                name="descriptionShort"
                rules={[
                  { required: true, message: 'Vui lòng nhập mô tả ngắn' },
                ]}
              >
                <TextArea rows={2} />
              </Form.Item>
            </Col>

            {/* THAY THẾ TEXTAREA BẰNG REACTQUILL CHO MÔ TẢ CHI TIẾT */}
            <Col span={24}>
              <Form.Item label="Mô tả chi tiết" name="descriptionLong">
                <ReactQuill
                  ref={quillRef} // Gán ref vào ReactQuill
                  theme="snow"
                  modules={quillModules} // Sử dụng modules đã tùy chỉnh
                  placeholder="Nhập mô tả chi tiết sản phẩm..."
                />
              </Form.Item>
            </Col>
            {/* KẾT THÚC THAY THẾ */}

            <Col span={12}>
              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[
                  { required: true, message: 'Vui lòng chọn trạng thái' },
                ]}
              >
                <Select>
                  <Option value="active">Đang bán</Option>
                  <Option value="hidden">Ẩn</Option>
                  <Option value="sold_out">Hết hàng</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Hình ảnh"
                name="images"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                rules={[
                  { required: true, message: 'Vui lòng chọn ít nhất 1 ảnh' },
                ]}
              >
                <Upload
                  listType="picture-card"
                  beforeUpload={() => false} // Ngăn Ant Design Upload tự động upload
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  multiple
                  maxCount={10}
                >
                  <UploadOutlined /> Tải ảnh
                </Upload>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: '100%' }}
                  loading={isPending}
                >
                  💾 Lưu sản phẩm
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </React.Fragment>
  );
};

export default AddProductPage;