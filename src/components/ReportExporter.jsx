// File: src/components/ReportExporter.jsx (修正為米色現代風和移動設備寬度，並修復 TypeError)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import * as XLSX from 'xlsx'; 
import { saveAs } from 'file-saver'; 

// === 新增：米色/大地色系配色 ===
const ACCENT_COLOR = '#A0522D';
const BG_PRIMARY = '#FAF0E6';
const TEXT_COLOR = '#333333';
const BG_SECONDARY = '#FFFFFF';
const SUCCESS_COLOR = '#2E8B57';
const ACTION_COLOR = '#1E90FF'; // 淺藍色作為次要操作
const ERROR_COLOR = '#D9534F'; 
const WARNING_COLOR = '#F0AD4E'; 

// Excel 欄位限制：最多展開 5 個商品欄位
const MAX_PRODUCTS_COLUMNS = 5; 

// 現代簡約 CSS 樣式
const tableStyle = {
    th: { 
        borderBottom: `2px solid ${ACCENT_COLOR}`, 
        padding: '10px 5px', 
        textAlign: 'left', 
        backgroundColor: BG_SECONDARY, 
        color: ACCENT_COLOR,
        fontSize: '13px',
        fontWeight: 'bold'
    },
    td: { 
        borderBottom: `1px solid #eee`, 
        padding: '8px 5px',
        color: TEXT_COLOR,
        backgroundColor: BG_SECONDARY, 
        fontSize: '12px',
        wordBreak: 'break-word', // 適應手機寬度
    },
    button: {
        border: 'none',
        padding: '6px 8px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
        marginRight: '5px',
        transition: 'opacity 0.2s',
    },
    filterInput: {
        padding: '8px',
        border: `1px solid #ccc`,
        borderRadius: '6px',
        backgroundColor: BG_SECONDARY,
        color: TEXT_COLOR,
        width: '100%',
        boxSizing: 'border-box',
        marginBottom: '10px',
        fontSize: '15px'
    }
};

const ReportExporter = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterCompleted, setFilterCompleted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        let query = supabase
            .from('orders')
            .select('*') 
            .order('created_at', { ascending: false });

        if (filterCompleted) {
            query = query.eq('is_completed', false);
        }
        
        const { data, error } = await query;

        if (error) {
            console.error('Error fetching orders:', error);
            setError('無法讀取訂單清單: ' + error.message);
        } else {
            setOrders(data);
        }
        setLoading(false);
    }, [filterCompleted]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    // 匯出報表邏輯 (未修改)
    const exportToExcel = (data, filename) => {
        const header = ['訂單 ID', '訂單日期', '預取時間', '顧客姓名', '顧客電話', '付款狀態', '總金額', '訂單備註', '結單狀態'];
        
        // 確保產品欄位足夠
        for (let i = 1; i <= MAX_PRODUCTS_COLUMNS; i++) {
            header.push(`品項名稱${i}`);
        }
        
        const worksheetData = data.map(order => {
            const items = (order.items_list || '').split('; ').filter(s => s.trim() !== '');
            const row = [
                order.order_id,
                new Date(order.created_at).toLocaleString(),
                order.pickup_time,
                order.customer_name,
                order.customer_phone,
                order.payment_status,
                order.total_amount,
                order.order_notes,
                order.is_completed ? '已結單' : '未結單'
            ];
            
            // 填充品項欄位
            for (let i = 0; i < MAX_PRODUCTS_COLUMNS; i++) {
                row.push(items[i] || '');
            }
            return row;
        });

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([header, ...worksheetData]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "訂單報表");
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(dataBlob, filename + '.xlsx');
    };

    const handleExportAll = () => {
        exportToExcel(orders, '全部訂單報表');
    };

    const handleExportSingleOrder = (order) => {
        exportToExcel([order], `訂單_${order.customer_name}_${order.order_id}`);
    };
    
    // 結單操作 (未修改)
    const handleCompleteOrder = async (orderId) => {
        if (!window.confirm('確定要將此訂單標記為「已結單」嗎？')) return;
        
        const { error } = await supabase
            .from('orders')
            .update({ is_completed: true })
            .eq('order_id', orderId);

        if (error) {
            alert('結單失敗: ' + error.message);
        } else {
            alert('訂單已結單！');
            fetchOrders(); 
        }
    };

    // 修正過濾訂單：添加 null/undefined 檢查以避免 TypeError
    const filteredOrders = orders.filter(order => {
        // 確保所有被檢查的欄位都不是 null 或 undefined，使用空字串 '' 作為預設值
        const name = order.customer_name || '';
        const phone = order.customer_phone || '';
        const summary = order.items_list || '';
        
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return (
            name.toLowerCase().includes(lowerCaseSearchTerm) ||
            phone.includes(searchTerm) ||
            summary.toLowerCase().includes(lowerCaseSearchTerm)
        );
    });

    // 樣式調整以適應手機
    const containerStyle = { 
        padding: '10px', 
        maxWidth: '100%', 
        margin: '0 auto', 
        backgroundColor: BG_SECONDARY, 
        color: TEXT_COLOR 
    };

    return (
        <div style={containerStyle}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px', textAlign: 'center', color: ACCENT_COLOR }}>
                訂單報表中心
            </h2>

            {error && <p style={{ color: ERROR_COLOR }}>{error}</p>}
            
            {/* 篩選/搜尋/匯出區 */}
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: BG_PRIMARY, borderRadius: '8px', border: `1px solid #ccc` }}>
                <input
                    type="text"
                    placeholder="🔍 搜尋顧客姓名/電話/品項..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={tableStyle.filterInput}
                />
                
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', fontSize: '15px' }}>
                    <input
                        type="checkbox"
                        checked={filterCompleted}
                        onChange={(e) => setFilterCompleted(e.target.checked)}
                        style={{ marginRight: '8px', transform: 'scale(1.1)' }}
                    />
                    只顯示 **待處理** 訂單
                </label>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                     <button
                        onClick={handleExportAll}
                        disabled={loading}
                        style={{ ...tableStyle.button, backgroundColor: ACCENT_COLOR, color: 'white', flex: 1 }}
                    >
                        導出全部訂單 (Excel)
                    </button>
                    <button
                        onClick={() => fetchOrders()}
                        disabled={loading}
                        style={{ ...tableStyle.button, backgroundColor: WARNING_COLOR, color: BG_PRIMARY, flex: 1 }}
                    >
                        {loading ? '重新載入中...' : '重新整理'}
                    </button>
                </div>
            </div>

            {loading && <p style={{ color: ACCENT_COLOR }}>正在載入訂單清單...</p>}

            {/* 訂單列表 */}
            {/* 這一層 div 負責水平滑動功能 */}
            <div style={{ 
                overflowX: 'auto', 
                border: `1px solid #ddd`, 
                borderRadius: '8px', 
                overflowY: 'hidden' 
            }}>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    minWidth: '600px' /* 設定最小寬度以強制在手機上滑動 */ 
                }}>
                    <thead>
                        <tr>
                            <th style={{...tableStyle.th, width: '15%'}}>取貨時間</th>
                            <th style={{...tableStyle.th, width: '15%'}}>顧客</th>
                            <th style={{...tableStyle.th, width: '35%'}}>品項摘要/金額</th>
                            <th style={{...tableStyle.th, width: '15%'}}>狀態</th>
                            <th style={{...tableStyle.th, width: '20%'}}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && filteredOrders.length === 0 && (
                             <tr><td colSpan="5" style={{...tableStyle.td, textAlign: 'center', color: TEXT_COLOR}}>
                                 找不到符合條件的訂單。
                             </td></tr>
                        )}
                        {filteredOrders.map(order => (
                            <tr key={order.order_id} style={{ backgroundColor: order.is_completed ? '#f9f9f9' : BG_SECONDARY }}>
                                
                                <td style={tableStyle.td}>
                                    {order.pickup_time ? new Date(order.pickup_time).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '未指定'}
                                </td>
                                
                                <td style={tableStyle.td}>
                                    <strong>{order.customer_name}</strong><br/>
                                    <span style={{color: '#999'}}>{order.customer_phone}</span>
                                </td>
                                
                                <td style={tableStyle.td}>
                                    {order.items_list}
                                    <div style={{ marginTop: '5px', fontWeight: 'bold', color: ERROR_COLOR }}>${order.total_amount}</div>
                                </td>
                                
                                <td style={tableStyle.td}>
                                    <span style={{ color: order.is_completed ? SUCCESS_COLOR : WARNING_COLOR }}>
                                        {order.is_completed ? '✅ 已結單' : '⏳ 待處理'}
                                    </span>
                                </td>
                                
                                <td style={tableStyle.td}>
                                    {/* 單筆導出按鈕 */}
                                    <button
                                        onClick={() => handleExportSingleOrder(order)}
                                        style={{ ...tableStyle.button, backgroundColor: ACTION_COLOR, color: 'white' }}
                                    >
                                        導出單筆
                                    </button>
                                    
                                    {/* 結單按鈕 */}
                                    {!order.is_completed && (
                                        <button 
                                            onClick={() => handleCompleteOrder(order.order_id)}
                                            style={{ ...tableStyle.button, backgroundColor: SUCCESS_COLOR, color: 'white', marginTop: '5px' }}
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