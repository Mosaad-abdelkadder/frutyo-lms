const crypto = require("crypto");

const hasRazorpayKeys = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expected === signature;
};

module.exports = { hasRazorpayKeys, verifyRazorpaySignature };
