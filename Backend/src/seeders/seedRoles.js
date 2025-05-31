const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/user.model');
const Role = require('../models/roles.model');
const Category = require('../models/category.model');
const Product = require('../models/products.model');
const ProductVariation = require('../models/product_variations.model');
const Wishlist = require('../models/wishlist.model');
const ProductReview = require('../models/product_reviews.model');
const Cart = require('../models/cart.model');
const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const Coupon = require('../models/coupon.model');
const Post = require('../models/post.model');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

const seedDatabase = async () => {
    try {
        // Xóa tất cả dữ liệu cũ
        await User.deleteMany({});
        await Role.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});
        await ProductVariation.deleteMany({});
        await Wishlist.deleteMany({});
        await ProductReview.deleteMany({});
        await Cart.deleteMany({});
        await Order.deleteMany({});
        await Payment.deleteMany({});
        await Coupon.deleteMany({});
        await Post.deleteMany({});

        // Tạo vai trò (Roles)
        const adminRole = new Role({ name: 'admin', description: 'Admin role', createdAt: new Date() });
        const staffRole = new Role({ name: 'staff', description: 'Staff role', createdAt: new Date() });
        const clientRole = new Role({ name: 'client', description: 'Client role', createdAt: new Date() });

        await adminRole.save();
        await staffRole.save();
        await clientRole.save();

        // Tạo người dùng (Users)
        const user = new User({
            name: 'Nguyễn Văn A',
            address: '123 ABC Street',
            phone: '0123456789',
            email: 'nguyenvana@example.com',
            password: 'hashedpassword',  // Mã hóa mật khẩu
            dateBirth: new Date('1990-01-01'),
            gender: 'male',
            status: 'active',
            roleId: adminRole._id,
        });
        await user.save();

        // Tạo danh mục (Categories)
        const category1 = new Category({ name: 'Ghế sofa', description: 'Sofa chairs', createdAt: new Date() });
        const category2 = new Category({ name: 'Bàn làm việc', description: 'Office desks', createdAt: new Date() });
        await category1.save();
        await category2.save();

        // Tạo sản phẩm (Products)
        const product1 = new Product({
            name: 'Sofa đơn',
            descriptionShort: 'Sofa đơn giản, hiện đại',
            descriptionLong: 'Sofa đơn với thiết kế đơn giản, chất liệu bền bỉ...',
            material: 'Gỗ',
            dimensions: '100 x 80 x 60 cm',
            weight: 10,
            price: 3000000,
            importPrice: 2500000,
            salePrice: 2800000,
            categoryId: category1._id,
            flashSale_discountedPrice: 2500000,
            flashSale_start: new Date(),
            flashSale_end: new Date(),
            images: ['image1.jpg', 'image2.jpg'],
            totalPurchased: 100,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await product1.save();

        // Tạo biến thể sản phẩm (Product Variations)
        const variation1 = new ProductVariation({
            productId: product1._id,
            name: 'Sofa đơn gỗ sồi',
            sku: 'Sofa001',
            price: 3000000,
            stockQuantity: 50,
            colorName: 'Nâu gỗ',
            colorHexCode: '#8B4513',
            colorImageUrl: 'image1.jpg',
            materialVariation: 'Gỗ sồi',
            createdAt: new Date(),
        });
        await variation1.save();

        // Tạo bài viết (Posts)
        const post1 = new Post({
            title: 'Sofa Đẹp',
            slug: 'sofa-dep',
            coverImage: 'sofa.jpg',
            content: '<h1>Sofa đẹp cho ngôi nhà của bạn</h1>',
            tags: ['sofa', 'ghế'],
            authorId: user._id,
            published: true,
            createdAt: new Date(),
        });
        await post1.save();

        console.log('Database seeded!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Gọi hàm seedDatabase
seedDatabase();
