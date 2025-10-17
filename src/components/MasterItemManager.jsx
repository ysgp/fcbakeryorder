// File: src/components/MasterItemManager.jsx (新增刪除功能 - 大地色系優化)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

// 定義大地主題顏色
const TECH_ACCENT = '#A0522D'; // 土褐色 (Sienna)
const BG_PRIMARY = '#FFF8E1'; // 乳米色 (Creamy Beige)
const TEXT_COLOR = '#4E342E'; // 深棕色 (Dark Brown)
const BG_SECONDARY = '#F5E3C8'; // 淺棕色 (Light Tan)
const SUCCESS_COLOR = '#689F38'; // 青綠色
const ERROR_COLOR = '#D32F2F'; // 紅色
const WARNING_COLOR = '#FF9800'; // 警告色

const MasterItemManager = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    
    // 新增：用於新增品項的狀態
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState(0);

    // 大地感表格樣式
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
        saveButton: {
            backgroundColor: SUCCESS_COLOR,
            color: BG_PRIMARY,
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'opacity 0.2s',
            marginRight: '8px'
        },
        deleteButton: { // 新增刪除按鈕樣式
            backgroundColor: ERROR_COLOR,
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'opacity 0.2s',
        },
        input: {
            padding: '5px',
            border: `1px solid ${TECH_ACCENT}50`,
            borderRadius: '4px',
            backgroundColor: BG_PRIMARY,
            color: TEXT_COLOR,
            width: '100%',
            boxSizing: 'border-box'
        }
    };

    const clearMessages = () => {
        setMessage('');
        setError(null);
    };

    const fetchItems = useCallback(async () => {
        setLoading(true);
        clearMessages();
        
        let query = supabase
            .from('master_items')
            .select('id, name_zh, price, is_active') 
            .order('name_zh', { ascending: true });
        
        const { data, error } = await query;

        if (error) {
            console.error('Error fetching master items:', error);
            setError('無法讀取品項清單: ' + error.message);
        } else {
            setItems(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // --- C: 建立品項 ---
    const handleCreateItem = async () => {
        clearMessages();
        
        if (!newItemName.trim() || newItemPrice === null || isNaN(newItemPrice) || parseFloat(newItemPrice) < 0) {
            setError('品項名稱或價格無效！請檢查輸入。');
            return;
        }

        const priceValue = parseFloat(newItemPrice);

        setMessage(`正在新增品項 ${newItemName}...`);
        
        const { data, error } = await supabase
            .from('master_items')
            .insert({ 
                name_zh: newItemName.trim(),
                price: priceValue,
                is_active: true // 預設新增為啟用狀態
            })
            .select();

        if (error) {
            console.error('Error creating item:', error);
            setError(`[錯誤] 新增品項失敗: ${error.message}`);
        } else {
            setMessage(`[成功] 品項 ${data[0].name_zh} 新增完成！`);
            setNewItemName('');
            setNewItemPrice(0);
            fetchItems(); // 重新載入列表
        }
    };

    // --- U: 更新品項 (價格/狀態) ---
    const handleFieldChange = (id, field, value) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
        clearMessages();
    };

    const handleSave = async (item) => {
        clearMessages();
        if (!item.name_zh || item.price === null || isNaN(item.price) || parseFloat(item.price) < 0) {
            setError('品項名稱或價格無效！');
            return;
        }

        setMessage(`正在更新 ${item.name_zh} ...`);
        
        const { error } = await supabase
            .from('master_items')
            .update({ 
                name_zh: item.name_zh, 
                price: parseFloat(item.price), 
                is_active: item.is_active 
            })
            .eq('id', item.id);

        if (error) {
            console.error('Error updating item:', error);
            setError(`[錯誤] 更新 ${item.name_zh} 失敗: ${error.message}`);
        } else {
            setMessage(`[成功] 品項 ${item.name_zh} 更新完成！`);
            fetchItems();
        }
    };

    // --- D: 刪除品項 ---
    const handleDelete = async (item) => {
        clearMessages();
        if (!window.confirm(`確定要永久刪除品項：${item.name_zh} 嗎？此操作不可逆！`)) {
            return;
        }
        
        setMessage(`正在刪除 ${item.name_zh} ...`);
        
        const { error } = await supabase
            .from('master_items')
            .delete()
            .eq('id', item.id);

        if (error) {
            console.error('Error deleting item:', error);
            setError(`[錯誤] 刪除 ${item.name_zh} 失敗: ${error.message}`);
        } else {
            setMessage(`[成功] 品項 ${item.name_zh} 已刪除。`);
            fetchItems(); // 重新載入列表
        }
    };

    // 根據搜尋條件過濾品項
    const filteredItems = items.filter(item =>
        item.name_zh.toLowerCase().includes(search.toLowerCase())
    );
    
    // MODIFICATION: 適應手機優化
    const containerStyle = { 
        padding: '15px', 
        maxWidth: '100%', 
        margin: '0 auto', 
        backgroundColor: BG_PRIMARY, 
        color: TEXT_COLOR 
    };
    const newEntryContainerStyle = {
        marginBottom: '30px', 
        padding: '15px', // 減少 padding
        backgroundColor: BG_SECONDARY, 
        borderRadius: '8px', 
        border: `1px solid ${TECH_ACCENT}55`,
        display: 'flex',
        flexDirection: 'column', // 手機上垂直堆疊
        gap: '10px',
        alignItems: 'stretch',
    };
    const createButton = {
        backgroundColor: TECH_ACCENT,
        color: BG_PRIMARY,
        border: 'none',
        padding: '10px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'opacity 0.2s',
        whiteSpace: 'nowrap'
    };


    return (
        <div style={containerStyle}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', textAlign: 'center', color: TECH_ACCENT }}>
                品項主檔管理 (新增/編輯/刪除)
            </h2>

            {/* 訊息顯示區 */}
            {message && !error && (
                <p style={{ color: SUCCESS_COLOR, fontWeight: 'bold' }}>{message}</p>
            )}
            {error && (
                <p style={{ color: ERROR_COLOR, fontWeight: 'bold' }}>{error}</p>
            )}

            {/* 新增品項區塊 (Create) */}
            <div style={newEntryContainerStyle}>
                <h3 style={{ color: WARNING_COLOR, margin: 0, fontSize: '18px', textAlign: 'center' }}>+ 新增品項</h3>
                <input
                    type="text"
                    placeholder="中文品名 (必填)"
                    value={newItemName}
                    onChange={(e) => { setNewItemName(e.target.value); clearMessages(); }}
                    style={tableStyle.input}
                />
                <input
                    type="number"
                    placeholder="價格 (必填)"
                    value={newItemPrice === 0 ? '' : newItemPrice}
                    onChange={(e) => { setNewItemPrice(e.target.value); clearMessages(); }}
                    style={{ ...tableStyle.input, textAlign: 'right' }}
                    min="0"
                />
                <button
                    onClick={handleCreateItem}
                    style={createButton}
                    disabled={!newItemName.trim() || isNaN(newItemPrice) || parseFloat(newItemPrice) < 0}
                >
                    新增品項
                </button>
            </div>
            
            {/* 搜尋欄 (Read/Update/Delete) */}
            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: BG_SECONDARY, borderRadius: '8px', border: `1px solid ${TECH_ACCENT}55` }}>
                <input
                    type="text"
                    placeholder="🔍 輸入品項名稱進行過濾..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ ...tableStyle.input, padding: '10px', fontSize: '16px' }}
                />
            </div>
            
            {loading && <p style={{ color: TECH_ACCENT }}>正在載入品項清單...</p>}

            {/* 品項列表 (Update/Delete) - 手機優化：改為允許水平捲動的 table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: '550px', borderCollapse: 'collapse', tableLayout: 'auto', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                        <tr>
                            <th style={{...tableStyle.th, width: '30%'}}>品項名稱</th>
                            <th style={{...tableStyle.th, width: '15%'}}>單價 ($)</th>
                            <th style={{...tableStyle.th, width: '25%'}}>狀態 (啟用/禁用)</th>
                            <th style={{...tableStyle.th, width: '30%'}}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && filteredItems.length === 0 && (
                             <tr><td colSpan="4" style={{...tableStyle.td, textAlign: 'center', backgroundColor: BG_SECONDARY, color: TECH_ACCENT}}>
                                 找不到符合條件的品項。
                             </td></tr>
                        )}
                        {filteredItems.map(item => (
                            <tr key={item.id} style={{ borderBottom: `1px solid ${BG_SECONDARY}` }}>
                                <td style={tableStyle.td}>
                                    {item.name_zh}
                                </td>
                                <td style={tableStyle.td}>
                                    <input
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => handleFieldChange(item.id, 'price', e.target.value)}
                                        onBlur={(e) => handleSave(item)} // 失去焦點時自動保存
                                        style={{...tableStyle.input, textAlign: 'right'}}
                                        min="0"
                                    />
                                </td>
                                <td style={tableStyle.td}>
                                    <label style={{ display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={item.is_active}
                                            onChange={(e) => {
                                                handleFieldChange(item.id, 'is_active', e.target.checked);
                                                // 延遲保存狀態，確保狀態已更新
                                                setTimeout(() => handleSave({...item, is_active: e.target.checked}), 100); 
                                            }}
                                            style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                                        />
                                        {item.is_active ? '✅ 啟用中' : '❌ 已禁用'}
                                    </label>
                                </td>
                                <td style={tableStyle.td}>
                                    <button
                                        onClick={() => handleSave(item)}
                                        style={tableStyle.saveButton}
                                    >
                                        儲存
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item)}
                                        style={tableStyle.deleteButton}
                                    >
                                        刪除
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MasterItemManager;