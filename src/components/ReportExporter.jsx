// File: src/components/ReportExporter.jsx (已升級為科技感暗黑主題 - 中文版)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import * as XLSX from 'xlsx'; 
import { saveAs } from 'file-saver'; 

// 定義科技主題顏色
const TECH_ACCENT = '#00CED1';
const BG_PRIMARY = '#121212';
const TEXT_COLOR = '#E0E0E0';
const BG_SECONDARY = '#1E1E1E';
const SUCCESS_COLOR = '#00BFA5';
const ACTION_COLOR = '#007BFF'; 
const ERROR_COLOR = '#FF4444';

// Excel 欄位限制：最多展開 5 個商品欄位
const MAX_PRODUCTS_COLUMNS = 5; 

// 科技感 CSS 樣式 (保持不變)
const tableStyle = {
    th: { 
        border: `1px solid ${TECH_ACCENT}55`, 
        padding: '12px 8px', 
        textAlign: 'left', 
        backgroundColor: BG_SECONDARY, 
        color: TECH_ACCENT,
        fontSize: '14px',
    },
    td: { 
        border: `1px solid ${BG_SECONDARY}`, 
        padding: '8px',
        color: TEXT_COLOR,
        backgroundColor: BG_PRIMARY, 
    },
    button: {
        padding: '8px 12px', 
        fontSize: '13px', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer',
        marginRight: '5px', 
        marginBottom: '5px' 
    }
};

const ReportExporter = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterCompleted, setFilterCompleted] = useState(false); 

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        let query = supabase
            .from('orders')
            .select('*, total_amount') 
            .order('created_at', { ascending: false });

        if (filterCompleted === false) {
            query = query.eq('is_completed', false); 
        }
        
        const { data, error } = await query;

        if (error) {
            console.error('Error fetching orders:', error);
            setError('無法讀取訂單數據: ' + error.message);
        } else {
            setOrders(data);
        }
        setLoading(false);
    }, [filterCompleted]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);


    // 數據處理函式：橫向展開商品 (與客戶範例 CSV 格式一致)
    const formatDataForExcel = (ordersData) => {
        const data = [];
        
        const itemHeaders = [];
        for (let i = 1; i <= MAX_PRODUCTS_COLUMNS; i++) {
            itemHeaders.push(`品項名稱${i}`); 
        }

        // Excel 標題列 (與客戶範例 CSV 欄位完全一致)
        data.push([
            '訂單 ID', 
            '訂單日期', 
            '預取時間', 
            '顧客姓氏', 
            '顧客電話', 
            '付款狀態', 
            ...itemHeaders, 
            '訂單備註',
            '結單狀態', 
        ]);

        ordersData.forEach(order => {
            const baseRow = [
                order.order_id.substring(0, 8), 
                new Date(order.created_at).toLocaleDateString('zh-TW'),
                order.pickup_time || '未指定',
                order.customer_last_name,
                order.customer_phone,
                order.payment_status,
            ];

            const itemColumns = [];
            if (order.items_list && order.items_list.length > 0) {
                order.items_list.slice(0, MAX_PRODUCTS_COLUMNS).forEach(item => {
                    itemColumns.push(`${item.item_name}${item.quantity}`);
                });
            }
            
            while (itemColumns.length < MAX_PRODUCTS_COLUMNS) {
                itemColumns.push('');
            }
            
            const trailingRow = [
                order.order_notes || '',
                order.is_completed ? '已結單' : '未結單',
            ];

            data.push([...baseRow, ...itemColumns, ...trailingRow]);
        });

        return data;
    };

    const handleExportAll = () => {
        if (orders.length === 0) {
            alert('沒有可導出的訂單數據！');
            return;
        }
        
        const formattedData = formatDataForExcel(orders);
        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '訂單數據');

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        
        const statusText = filterCompleted ? '所有訂單' : '未結單訂單';
        const filename = `鳳城麵包訂單_${statusText}_${new Date().toISOString().split('T')[0]}.xlsx`;
        // 修正成功訊息為中文
        saveAs(blob, filename);
        alert(`[導出] 成功導出 ${orders.length} 筆訂單到 ${filename}`);
    };
    
    const handleExportSingleOrder = (order) => {
        const formattedData = formatDataForExcel([order]); 
        
        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '單筆訂單');

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        
        const filename = `訂單_${order.customer_last_name}_${order.order_id.substring(0, 8)}.xlsx`;
        // 修正成功訊息為中文
        saveAs(blob, filename);
        alert(`[列印] 成功導出單筆訂單: ${order.customer_last_name}`);
    };
    
    const handleCompleteOrder = async (orderId) => {
        // 修正確認訊息為中文
        if(!confirm(`[操作確認] 確定要結單 ID 為 ${orderId.substring(0, 8)} 的訂單嗎？`)) {
            return;
        }

        const { error } = await supabase
            .from('orders')
            .update({ is_completed: true })
            .eq('order_id', orderId);

        if (error) {
            // 修正錯誤訊息為中文
            alert('[系統錯誤] 結單失敗: ' + error.message);
            console.error('Error completing order:', error);
        } else {
            // 修正成功訊息為中文
            alert('[成功] 訂單已成功結單！');
            fetchOrders(); 
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '100%', margin: '0 auto', backgroundColor: BG_PRIMARY, color: TEXT_COLOR }}>
            {/* 標題修正為中文 */}
            <h2 style={{ fontSize: '28px', marginBottom: '20px', textAlign: 'center', color: TECH_ACCENT }}>
                訂單管理中心 (B節點)
            </h2>
            
            {/* 篩選器和全部導出按鈕 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '10px', backgroundColor: BG_SECONDARY, borderRadius: '8px', border: `1px solid ${TECH_ACCENT}55` }}>
                
                {/* 篩選標籤修正為中文 */}
                <label style={{ marginRight: '20px', color: TEXT_COLOR }}>
                    <input 
                        type="checkbox" 
                        checked={filterCompleted} 
                        onChange={(e) => setFilterCompleted(e.target.checked)}
                        style={{ marginRight: '8px' }}
                    />
                    顯示所有訂單 (含已結單)
                </label>
                

                {/* 導出按鈕修正為中文 */}
                <button 
                    onClick={handleExportAll} 
                    disabled={loading || error || orders.length === 0}
                    style={{ 
                        ...tableStyle.button, 
                        backgroundColor: SUCCESS_COLOR, 
                        color: BG_PRIMARY, 
                        fontWeight: 'bold',
                        boxShadow: `0 0 8px ${SUCCESS_COLOR}`,
                    }}
                >
                    {/* 修正載入狀態為中文 */}
                    {loading ? '正在載入數據...' : `導出 EXCEL (${orders.length} 筆)`}
                </button>
            </div>
            
            {/* 錯誤訊息修正為中文 */}
            {error && <p style={{ color: ERROR_COLOR, fontWeight: 'bold' }}>[系統錯誤]: {error}</p>}
            {loading && <p style={{ color: TECH_ACCENT }}>正在載入訂單數據...</p>}
            
            {/* 訂單列表 */}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                    <tr style={{ backgroundColor: BG_SECONDARY }}>
                        {/* 表頭修正為中文 */}
                        <th style={{...tableStyle.th, width: '10%'}}>ID</th>
                        <th style={{...tableStyle.th, width: '15%'}}>預取時間</th>
                        <th style={{...tableStyle.th, width: '15%'}}>顧客</th>
                        <th style={{...tableStyle.th, width: '20%'}}>總金額</th> 
                        <th style={{...tableStyle.th, width: '10%'}}>狀態</th>
                        <th style={{...tableStyle.th, width: '30%'}}>操作 (導出/結單)</th> 
                    </tr>
                </thead>
                <tbody>
                    {!loading && orders.length === 0 && (
                         <tr style={{ borderBottom: `1px solid ${BG_SECONDARY}` }}><td colSpan="6" style={{...tableStyle.td, textAlign: 'center', backgroundColor: BG_SECONDARY, color: TECH_ACCENT}}>
                             {/* 修正提示訊息為中文 */}
                             {filterCompleted ? '>>> 系統閒置：無訂單記錄' : '>>> 所有訂單已結：無待處理訂單'}
                         </td></tr>
                    )}
                    {orders.map(order => (
                        <tr key={order.order_id} style={{ borderBottom: `1px solid ${BG_SECONDARY}`, backgroundColor: order.is_completed ? BG_SECONDARY : BG_PRIMARY }}>
                            <td style={tableStyle.td}>{order.order_id.substring(0, 8)}</td>
                            <td style={tableStyle.td}>{order.pickup_time || '未指定'}</td>
                            <td style={tableStyle.td}>{order.customer_last_name} ({order.customer_phone.substring(order.customer_phone.length - 4)})</td>
                            <td style={{...tableStyle.td, fontWeight: 'bold', color: TECH_ACCENT}}>
                                ${order.total_amount ? order.total_amount.toFixed(0) : 0}
                            </td>
                            {/* 狀態修正為中文 */}
                            <td style={tableStyle.td}>
                                {order.is_completed ? '✅ 已結單' : '⏳ 待處理'}
                            </td>
                            <td style={tableStyle.td}>
                                {/* 單筆導出按鈕修正為中文 */}
                                <button
                                    onClick={() => handleExportSingleOrder(order)}
                                    style={{ ...tableStyle.button, backgroundColor: '#FF9800', color: BG_PRIMARY, fontWeight: 'bold' }}
                                >
                                    導出單筆
                                </button>
                                
                                {/* 結單按鈕修正為中文 */}
                                {!order.is_completed && (
                                    <button 
                                        onClick={() => handleCompleteOrder(order.order_id)}
                                        style={{ ...tableStyle.button, backgroundColor: ACTION_COLOR, color: 'white', fontWeight: 'bold' }}
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
    );
};

export default ReportExporter;