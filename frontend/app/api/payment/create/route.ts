import { NextResponse } from 'next/server';
import crypto from 'crypto';

const VNP_TMN_CODE = process.env.VNP_TMN_CODE || 'YOUR_TMN_CODE';
const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET || 'YOUR_HASH_SECRET';
const VNP_URL = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNP_RETURN_URL = process.env.VNP_RETURN_URL || 'http://localhost:3000/api/payment/vnpay_return';
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, tripId } = body;

    const response = await fetch(`${backendUrl}/api/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        tripId: tripId,
        bankCode: "VNPAYQR",
        accountNo: "0773914830",
        accountName: "ĐỖ NGUYỄN ĐĂNG KHOA",
        orderInfo: `Thanh toan ve xe ${tripId}`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create payment');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

// Hàm format date theo định dạng yyyyMMddHHmmss
function format_date(date: Date) {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}

// Hàm sắp xếp object theo key
function sortObject(obj: Record<string, any>) {
  const sorted: Record<string, any> = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
} 