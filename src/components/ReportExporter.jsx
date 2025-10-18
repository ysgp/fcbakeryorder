// File: src/components/ReportExporter.jsx (已升級為大地感主題 - 中文版 & 新增總金額 & 拆分日期/時間 & 檔名/ID格式優化)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import * as XLSX from 'xlsx'; 
import { saveAs } from 'file-saver'; 

// 定義大地主題顏色
const TECH_ACCENT = '#A0522D'; // 土褐色 (Sienna)
const BG_PRIMARY = '#FFF8E1'; // 乳米色 (Creamy Beige)
const TEXT_COLOR = '#4E342E'; // 深棕色 (Dark Brown)
const BG_SECONDARY = '#F5E3C8'; // 淺棕色 (Light Tan)
const SUCCESS_COLOR = '#689F38'; // 青綠色
const ACTION_COLOR = '#795548'; // 棕色
const ERROR_COLOR = '#D32F2F'; // 紅色

// Excel 欄位限制：最多展開 5 個商品欄位
const MAX_PRODUCTS_COLUMNS = 5; 

// 大地感 CSS 樣式
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
        
        // MODIFICATION 1: 確保選取了 pickup_date 欄位
        let query = supabase
            .from('orders')
            .select('*, total_amount, pickup_date') 
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
    
    // 假定的訂單序列號格式化器 (從 1 開始，四位數)
    // 由於我們只有 UUID，這裡我們將取最後四位，並補零，以模擬序列號
    const formatOrderIdForDisplay = (id, index) => {
        // 為了符合 '0001' 的格式要求，這裡做一個簡化模擬：
        // 假定列表中的第一個是 0001，第二個是 0002...
        return String(orders.length - index).padStart(4, '0');
    };

    // 數據處理函式：橫向展開商品 (與客戶範例 CSV 格式一致)
    const formatDataForExcel = (ordersData, isSingleOrder = false) => {
        const data = [];
        
        const itemHeaders = [];
        for (let i = 1; i <= MAX_PRODUCTS_COLUMNS; i++) {
            itemHeaders.push(`品項名稱${i}`); 
        }

        // MODIFICATION 2: Excel 標題列：將 '訂單日期' 改為 '預取日期'，並新增 '總金額'
        data.push([
            '訂單 ID (序列)', // 變更標題以匹配 '0001' 需求
            '訂單建立日期', // 區分訂單建立日期和預取日期
            '預取日期', // 新增欄位
            '預取時間', 
            '顧客姓氏', 
            '顧客電話', 
            '付款狀態', 
            ...itemHeaders, 
            '總金額', // 新增欄位
            '訂單備註',
            '結單狀態', 
        ]);

        ordersData.forEach((order, index) => {
            // 由於 Supabase ID 是 UUID，我們使用索引來模擬 0001, 0002...
            const displayId = formatOrderIdForDisplay(order.order_id, index); 
            
            const baseRow = [
                displayId, 
                new Date(order.created_at).toLocaleDateString('zh-TW'),
                order.pickup_date || '未指定', // 使用 pickup_date 狀態
                order.pickup_time || '未指定',
                order.customer_last_name,
                order.customer_phone,
                order.payment_status,
            ];

            const itemColumns = [];
            if (order.items_list && order.items_list.length > 0) {
                order.items_list.slice(0, MAX_PRODUCTS_COLUMNS).forEach(item => {
                    // 確保 price 在 item 中存在
                    const price = item.price !== undefined ? item.price : 0;
                    itemColumns.push(`${item.item_name} x ${item.quantity} ($${price.toFixed(0)})`);
                });
            }
            
            while (itemColumns.length < MAX_PRODUCTS_COLUMNS) {
                itemColumns.push('');
            }
            
            // MODIFICATION 3: 插入總金額
            const totalAmountColumn = [order.total_amount ? order.total_amount.toFixed(0) : '0'];

            const trailingRow = [
                order.order_notes || '',
                order.is_completed ? '已結單' : '未結單',
            ];

            // 組合新的行數據
            data.push([...baseRow, ...itemColumns, ...totalAmountColumn, ...trailingRow]);
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
        const filename = `訂單_${statusText}_${new Date().toISOString().split('T')[0]}.xlsx`;
        // 修正成功訊息為中文
        saveAs(blob, filename);
        alert(`[導出] 成功導出 ${orders.length} 筆訂單到 ${filename}`);
    };
    
    const handleExportSingleOrder = (order, index) => {
        const formattedData = formatDataForExcel([order], true); 
        
        const ws = XLSX.utils.aoa_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '單筆訂單');

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        
        // MODIFICATION: 檔名格式為 單號+顧客姓氏
        const displayId = formatOrderIdForDisplay(order.order_id, index); 
        const filename = `${displayId}_${order.customer_last_name}.xlsx`;
        
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

    // MODIFICATION 4: 優化容器樣式以適應手機
    return (
        <div style={{ padding: '15px', maxWidth: '100%', margin: '0 auto', backgroundColor: BG_PRIMARY, color: TEXT_COLOR }}>
            {/* 標題修正為中文 */}
            <h2 style={{ fontSize: '24px', marginBottom: '15px', textAlign: 'center', color: TECH_ACCENT }}>
                訂單管理中心 (B節點)
            </h2>
            
            {/* 篩選器和全部導出按鈕 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', padding: '10px', backgroundColor: BG_SECONDARY, borderRadius: '8px', border: `1px solid ${TECH_ACCENT}55` }}>
                
                {/* 篩選標籤修正為中文 */}
                <label style={{ color: TEXT_COLOR }}>
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
                        boxShadow: `0 0 8px ${SUCCESS_COLOR}50`,
                        marginTop: '10px', // 增加手機間距
                        width: '100%', // 手機全寬
                    }}
                >
                    {/* 修正載入狀態為中文 */}
                    {loading ? '正在載入數據...' : `導出 EXCEL (${orders.length} 筆)`}
                </button>
            </div>
            
            {/* 錯誤訊息修正為中文 */}
            {error && <p style={{ color: ERROR_COLOR, fontWeight: 'bold' }}>[系統錯誤]: {error}</p>}
            {loading && <p style={{ color: TECH_ACCENT }}>正在載入訂單數據...</p>}
            
            {/* 訂單列表 (使用 table-layout: auto 和 overflow: auto 提高手機可視性) */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '600px', borderCollapse: 'collapse', tableLayout: 'auto', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                        <tr style={{ backgroundColor: BG_SECONDARY }}>
                            {/* 表頭修正為中文 */}
                            <th style={{...tableStyle.th, width: '10%'}}>ID</th>
                            <th style={{...tableStyle.th, width: '15%'}}>預取時間</th>
                            <th style={{...tableStyle.th, width: '15%'}}>顧客</th>
                            <th style={{...tableStyle.th, width: '20%'}}>總金額</th> 
                            <th style={{...tableStyle.th, width: '10%'}}>狀態</th>
                            <th style={{...tableStyle.th, width: '30%'}}>操作</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && orders.length === 0 && (
                            <tr style={{ borderBottom: `1px solid ${BG_SECONDARY}` }}><td colSpan="6" style={{...tableStyle.td, textAlign: 'center', backgroundColor: BG_SECONDARY, color: TECH_ACCENT}}>
                                {/* 修正提示訊息為中文 */}
                                {filterCompleted ? '>>> 系統閒置：無訂單記錄' : '>>> 所有訂單已結：無待處理訂單'}
                            </td></tr>
                        )}
                        {orders.map((order, index) => (
                            <tr key={order.order_id} style={{ borderBottom: `1px solid ${BG_SECONDARY}`, backgroundColor: order.is_completed ? BG_SECONDARY : BG_PRIMARY }}>
                                <td style={{...tableStyle.td, fontSize: '12px', fontWeight: 'bold', color: ACTION_COLOR}}>
                                    {formatOrderIdForDisplay(order.order_id, index)}
                                </td>
                                <td style={{...tableStyle.td, fontSize: '12px'}}>{order.pickup_date} {order.pickup_time || '未指定'}</td>
                                <td style={{...tableStyle.td, fontSize: '12px'}}>{order.customer_last_name} ({order.customer_phone.substring(order.customer_phone.length - 4)})</td>
                                <td style={{...tableStyle.td, fontWeight: 'bold', color: TECH_ACCENT, fontSize: '13px'}}>
                                    ${order.total_amount ? order.total_amount.toFixed(0) : 0}
                                </td>
                                {/* 狀態修正為中文 */}
                                <td style={{...tableStyle.td, fontSize: '12px'}}>
                                    {order.is_completed ? '✅ 已結單' : '⏳ 待處理'}
                                </td>
                                <td style={tableStyle.td}>
                                    {/* 單筆導出按鈕修正為中文 */}
                                    <button
                                        onClick={() => handleExportSingleOrder(order, index)}
                                        style={{ ...tableStyle.button, backgroundColor: ACTION_COLOR, color: 'white', fontWeight: 'bold' }}
                                    >
                                        導出
                                    </button>
                                    
                                    {/* 結單按鈕修正為中文 */}
                                    {!order.is_completed && (
                                        <button 
                                            onClick={() => handleCompleteOrder(order.order_id)}
                                            style={{ ...tableStyle.button, backgroundColor: SUCCESS_COLOR, color: 'white', fontWeight: 'bold' }}
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
        </div>
    );
};

export default ReportExporter;