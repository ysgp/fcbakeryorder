// File: src/components/ReportExporter.jsx (已升級為現代簡潔暗黑主題)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import * as XLSX from 'xlsx'; 
import { saveAs } from 'file-saver'; 

// === 定義現代簡潔主題顏色 ===
const ACCENT_COLOR = '#6C63FF';    // 現代藍紫色作為強調色 
const BG_PRIMARY = '#1C1C1C';      // 主背景色
const TEXT_COLOR = '#F0F0F0';      // 主要文字顏色
const BG_SECONDARY = '#2C2C2C';    // 次級背景色/卡片背景
const SUCCESS_COLOR = '#4CAF50';   // 成功色
const ERROR_COLOR = '#F44336';     // 錯誤色

// Excel 欄位限制：最多展開 5 個商品欄位
const MAX_PRODUCTS_COLUMNS = 5; 

// 現代簡潔 CSS 樣式
const tableStyle = {
    container: {
        backgroundColor: BG_SECONDARY, 
        padding: '20px',
        borderRadius: '10px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
    },
    title: {
        color: ACCENT_COLOR,
        textAlign: 'center',
        marginBottom: '30px',
        fontSize: '24px',
        borderBottom: `2px solid ${ACCENT_COLOR}30`,
        paddingBottom: '10px'
    },
    table: {
        width: '100%',
        borderCollapse: 'separate', 
        borderSpacing: '0 10px', // 增加行間距
        marginTop: '20px',
    },
    th: { 
        border: 'none', 
        padding: '12px 15px', 
        textAlign: 'left', 
        backgroundColor: BG_SECONDARY, 
        color: ACCENT_COLOR,
        fontSize: '15px',
        fontWeight: '600',
    },
    tr: {
        backgroundColor: BG_PRIMARY, 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    },
    td: { 
        border: 'none', 
        padding: '12px 15px',
        color: TEXT_COLOR,
        backgroundColor: BG_PRIMARY, 
    },
    // 確保第一和最後一列有圓角
    tdFirst: { borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' },
    tdLast: { borderTopRightRadius: '8px', borderBottomRightRadius: '8px' },
    
    button: {
        padding: '8px 15px', 
        fontSize: '14px', 
        border: 'none', 
        borderRadius: '6px', 
        cursor: 'pointer',
        marginRight: '8px', 
        marginBottom: '5px',
        fontWeight: 'bold',
        transition: 'all 0.2s',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    },
    input: {
        padding: '10px',
        border: `1px solid ${BG_PRIMARY}`,
        borderRadius: '6px', 
        backgroundColor: BG_PRIMARY,
        color: TEXT_COLOR,
        transition: 'border-color 0.2s',
        marginRight: '10px',
    },
    searchContainer: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '10px',
        padding: '10px',
        backgroundColor: BG_PRIMARY,
        borderRadius: '8px',
    }
};

// ... (fetchOrders, handleExportSingleOrder, handleExportAll, handleCompleteOrder 函數保持不變)

const ReportExporter = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        let query = supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    item_name,
                    quantity,
                    item_price
                )
            `)
            .order('created_at', { ascending: false });

        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            // 結束日期應包含當天直到午夜
            const endOfDay = new Date(endDate);
            endOfDay.setDate(endOfDay.getDate() + 1);
            query = query.lt('created_at', endOfDay.toISOString());
        }
        if (statusFilter !== 'all') {
            query = query.eq('is_completed', statusFilter === 'completed');
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching orders:', error);
            setError('載入訂單報表失敗。');
        } else {
            setOrders(data || []);
            setError(null);
        }
        setLoading(false);
    }, [startDate, endDate, statusFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const calculateTotal = (orderItems) => {
        return orderItems.reduce((total, item) => total + item.quantity * item.item_price, 0);
    };

    const handleExportSingleOrder = (order) => {
        const total = calculateTotal(order.order_items);
        const products = order.order_items.map(item => `${item.item_name} x ${item.quantity} (NT$${item.item_price})`);

        const data = [
            ["訂單編號", order.order_id],
            ["客戶名稱", order.customer_name],
            ["聯絡電話", order.customer_phone],
            ["付款狀態", order.payment_status],
            ["取貨時間", order.pickup_time ? new Date(order.pickup_time).toLocaleString() : '無'],
            ["訂單備註", order.order_notes || '無'],
            ["訂單總額", `NT$${total}`],
            ["結單狀態", order.is_completed ? '已結單' : '待處理'],
            ["創建時間", new Date(order.created_at).toLocaleString()],
            ["---", "---"],
            ["品項名稱", "數量", "單價"]
        ];

        order.order_items.forEach(item => {
            data.push([item.item_name, item.quantity, item.item_price]);
        });
        
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "訂單詳情");
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(blob, `Order_${order.order_id}_${order.customer_name}.xlsx`);
        setMessage(`✅ 訂單 ${order.order_id} 導出成功！`);
        setTimeout(() => setMessage(''), 5000);
    };

    const handleExportAll = () => {
        if (orders.length === 0) {
            setMessage('錯誤: 沒有訂單數據可以導出！');
            setTimeout(() => setMessage(''), 5000);
            return;
        }

        // 確定需要多少商品欄位
        let maxProducts = 0;
        orders.forEach(order => {
            if (order.order_items && order.order_items.length > maxProducts) {
                maxProducts = order.order_items.length;
            }
        });
        
        // 限制最大欄位數，避免表格過寬
        maxProducts = Math.min(maxProducts, MAX_PRODUCTS_COLUMNS); 

        // 設置標題欄
        let header = [
            "訂單編號", 
            "客戶名稱", 
            "聯絡電話", 
            "總金額", 
            "付款狀態", 
            "結單狀態",
            "取貨時間", 
            "訂單備註", 
            "創建時間"
        ];

        // 根據最大商品數添加商品標題
        for (let i = 1; i <= maxProducts; i++) {
            header.push(`品項${i} 名稱`, `品項${i} 數量`);
        }

        const data = [header];

        orders.forEach(order => {
            const total = calculateTotal(order.order_items);
            let row = [
                order.order_id,
                order.customer_name,
                order.customer_phone,
                total,
                order.payment_status,
                order.is_completed ? '已結單' : '待處理',
                order.pickup_time ? new Date(order.pickup_time).toLocaleString() : '無',
                order.order_notes || '',
                new Date(order.created_at).toLocaleString()
            ];

            // 展開商品
            for (let i = 0; i < maxProducts; i++) {
                if (order.order_items && i < order.order_items.length) {
                    const item = order.order_items[i];
                    row.push(item.item_name, item.quantity);
                } else {
                    row.push('', ''); // 填充空白欄位
                }
            }
            data.push(row);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "訂單總覽");

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(blob, `Orders_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
        setMessage(`✅ 共 ${orders.length} 筆訂單導出成功！`);
        setTimeout(() => setMessage(''), 5000);
    };

    const handleCompleteOrder = async (orderId) => {
        if (!window.confirm("確定要將此訂單標記為已結單嗎？")) {
            return;
        }
        
        const { error } = await supabase
            .from('orders')
            .update({ is_completed: true })
            .eq('order_id', orderId);

        if (error) {
            setMessage(`錯誤: 結單失敗 - ${error.message}`);
        } else {
            setMessage(`✅ 訂單 ${orderId} 已標記為已結單！`);
            fetchOrders(); // 重新載入數據
        }
        setTimeout(() => setMessage(''), 5000);
    };

    return (
        <div style={tableStyle.container}>
            <h2 style={tableStyle.title}>訂單報表中心</h2>
            
            {message && (
                <div style={tableStyle.messageBox(message.includes('錯誤') ? 'error' : 'success')}>
                    {message}
                </div>
            )}
            {error && <div style={tableStyle.messageBox('error')}>{error}</div>}

            <div style={{ padding: '10px', backgroundColor: BG_SECONDARY, borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <label style={{ color: TEXT_COLOR, marginRight: '10px' }}>起始日期:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={tableStyle.input}
                    />
                    <label style={{ color: TEXT_COLOR, marginRight: '10px', marginLeft: '20px' }}>結束日期:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={tableStyle.input}
                    />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ color: TEXT_COLOR, marginRight: '10px' }}>狀態過濾:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ ...tableStyle.input, width: '150px', appearance: 'none' }}
                    >
                        <option value="all">所有訂單</option>
                        <option value="pending">待處理</option>
                        <option value="completed">已結單</option>
                    </select>

                    <button
                        onClick={fetchOrders}
                        style={{ 
                            ...tableStyle.button, 
                            backgroundColor: ACCENT_COLOR, 
                            color: 'white',
                            marginLeft: '20px'
                        }}
                    >
                        🔄 篩選/刷新
                    </button>
                    
                    <button
                        onClick={handleExportAll}
                        style={{ 
                            ...tableStyle.button, 
                            backgroundColor: SUCCESS_COLOR, 
                            color: 'white'
                        }}
                    >
                        ⬇️ 導出所有結果 ({orders.length})
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ color: TEXT_COLOR, textAlign: 'center' }}>載入訂單中...</div>
            ) : orders.length === 0 ? (
                <div style={{ color: TEXT_COLOR, textAlign: 'center', padding: '20px' }}>
                    找不到符合條件的訂單。
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle.table}>
                        <thead>
                            <tr>
                                <th style={{ ...tableStyle.th, ...tableStyle.tdFirst }}>編號</th>
                                <th style={tableStyle.th}>客戶</th>
                                <th style={tableStyle.th}>電話</th>
                                <th style={tableStyle.th}>品項概覽</th>
                                <th style={tableStyle.th}>總金額</th>
                                <th style={tableStyle.th}>狀態</th>
                                <th style={{ ...tableStyle.th, ...tableStyle.tdLast, width: '200px' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.order_id} style={tableStyle.tr}>
                                    <td style={{ ...tableStyle.td, ...tableStyle.tdFirst }}>
                                        {order.order_id}
                                    </td>
                                    <td style={tableStyle.td}>{order.customer_name}</td>
                                    <td style={tableStyle.td}>{order.customer_phone}</td>
                                    <td style={tableStyle.td}>
                                        {order.order_items?.slice(0, 2).map(item => 
                                            <div key={item.item_name}>
                                                {item.item_name} x {item.quantity}
                                            </div>
                                        )}
                                        {order.order_items?.length > 2 && `...還有 ${order.order_items.length - 2} 項`}
                                    </td>
                                    <td style={tableStyle.td}>
                                        NT${calculateTotal(order.order_items || [])}
                                    </td>
                                    {/* 狀態修正為中文 */}
                                    <td style={tableStyle.td}>
                                        {order.is_completed ? '✅ 已結單' : 
                                         (order.payment_status === '已付款' ? '🟢 待出貨' : '🟡 欠款')}
                                    </td>
                                    <td style={{ ...tableStyle.td, ...tableStyle.tdLast }}>
                                        {/* 單筆導出按鈕 - 現代橙色 */}
                                        <button
                                            onClick={() => handleExportSingleOrder(order)}
                                            style={{ 
                                                ...tableStyle.button, 
                                                backgroundColor: '#FF9800', 
                                                color: BG_PRIMARY 
                                            }}
                                        >
                                            導出單筆
                                        </button>
                                        
                                        {/* 結單按鈕 - 現代強調色 */}
                                        {!order.is_completed && (
                                            <button 
                                                onClick={() => handleCompleteOrder(order.order_id)}
                                                style={{ 
                                                    ...tableStyle.button, 
                                                    backgroundColor: ACCENT_COLOR, // 使用新的強調色
                                                    color: 'white', 
                                                }}
                                            >
                                                結單
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ReportExporter;