const axios = require("axios");

const GHN_TOKEN = process.env.GHN_TOKEN;
const SHOP_ID = Number(process.env.GHN_SHOP_ID); // Ép kiểu về số

const FROM_DISTRICT_ID = 1485; // cũng là số


const headers = {
    Token: GHN_TOKEN,
    ShopId: SHOP_ID,
};

exports.getProvinces = async (req, res) => {
    try {
        const response = await axios.get(
            "https://online-gateway.ghn.vn/shiip/public-api/master-data/province",
            {
                headers: {
                    Token: process.env.GHN_TOKEN, // phải đúng key này
                },
            }
        );
        res.json(response.data.data);
    } catch (error) {
        console.error("GHN API Error:", error.response?.data || error.message);
        res.status(500).json({
            message: "Lỗi khi lấy tỉnh/thành",
            error: error.response?.data || error.message,
        });
    }
};

exports.getDistricts = async (req, res) => {
    try {
        const { provinceId } = req.params;
        const { data } = await axios.post(
            "https://online-gateway.ghn.vn/shiip/public-api/master-data/district",
            { province_id: Number(provinceId) },
            { headers }
        );
        res.json(data.data);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy quận/huyện" });
    }
};

exports.getWards = async (req, res) => {
    try {
        const { districtId } = req.params;
        const { data } = await axios.post(
            "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward",
            { district_id: Number(districtId) },
            { headers }
        );
        res.json(data.data);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy phường/xã" });
    }
};

exports.calculateShippingFee = async (req, res) => {
    try {
        const { toDistrictId, toWardCode, amount } = req.body;

        // 1. Lấy service_id phù hợp
        const { data: serviceRes } = await axios.post(
            "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/available-services",
            {
                shop_id: SHOP_ID,
                from_district: FROM_DISTRICT_ID,
                to_district: Number(toDistrictId),
            },
            {
                headers: { Token: GHN_TOKEN },
            }
        );

        const service_id = serviceRes.data?.[0]?.service_id;
        if (!service_id) throw new Error("Không tìm thấy dịch vụ GHN phù hợp");

        // 2. Tính phí vận chuyển
        const { data } = await axios.post(
            "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee",
            {
                from_district_id: FROM_DISTRICT_ID,
                to_district_id: Number(toDistrictId),
                to_ward_code: toWardCode,
                service_id,
                height: 15,
                length: 15,
                weight: 500,
                width: 15,
                insurance_value: amount,
            },
            {
                headers: {
                    Token: GHN_TOKEN,
                    ShopId: SHOP_ID,
                },
            }
        );

        res.json({ fee: data.data.total });
    } catch (error) {
        console.error("GHN Fee API Error:", error.response?.data || error.message);
        res.status(500).json({
            message: "Lỗi khi tính phí vận chuyển",
            error: error.response?.data || error.message
        });
    }
};