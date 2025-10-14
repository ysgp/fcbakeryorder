// File: src/components/MasterItemManager.jsx (新增刪除功能)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

// 定義科技主題顏色
const TECH_ACCENT = '#00CED1';
const BG_PRIMARY = '#121212';
const TEXT_COLOR = '#E0E0E0';
const BG_SECONDARY = '#1E1E1E';
const SUCCESS_COLOR = '#00BFA5';
const ERROR_COLOR = '#FF4444';
const WARNING_COLOR = '#FFC107'; // 新增警告色

const MasterItemManager = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    
    // 新增：用於新增品項的狀態
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState(0);

    // 科技感表格樣式
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
    
    const containerStyle = { 
        padding: '20px', 
        maxWidth: '1000px', 
        margin: '0 auto', 
        backgroundColor: BG_PRIMARY, 
        color: TEXT_COLOR 
    };
    const newEntryContainerStyle = {
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: BG_SECONDARY, 
        borderRadius: '8px', 
        border: `1px solid ${TECH_ACCENT}55`,
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
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
            <h2 style={{ fontSize: '28px', marginBottom: '20px', textAlign: 'center', color: TECH_ACCENT }}>
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
                <h3 style={{ color: WARNING_COLOR, margin: 0, fontSize: '18px', whiteSpace: 'nowrap' }}>+ 新增品項:</h3>
                <input
                    type="text"
                    placeholder="中文品名 (必填)"
                    value={newItemName}
                    onChange={(e) => { setNewItemName(e.target.value); clearMessages(); }}
                    style={{ ...tableStyle.input, flex: 2 }}
                />
                <input
                    type="number"
                    placeholder="價格 (必填)"
                    value={newItemPrice === 0 ? '' : newItemPrice}
                    onChange={(e) => { setNewItemPrice(e.target.value); clearMessages(); }}
                    style={{ ...tableStyle.input, flex: 1, textAlign: 'right' }}
                    min="0"
                />
                <button
                    onClick={handleCreateItem}
                    style={createButton}
                    disabled={!newItemName.trim() || isNaN(newItemPrice) || parseFloat(newItemPrice) < 0}
                >
                    新增
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

            {/* 品項列表 (Update/Delete) */}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                    <tr>
                        <th style={{...tableStyle.th, width: '35%'}}>品項名稱</th>
                        <th style={{...tableStyle.th, width: '15%'}}>單價 ($)</th>
                        <th style={{...tableStyle.th, width: '15%'}}>狀態 (啟用/禁用)</th>
                        <th style={{...tableStyle.th, width: '20%'}}>操作</th>
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
                                            setTimeout(() => handleSave({...item, is_active: e.target.checked}), 100); // 延遲保存狀態
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
    );
};

export default MasterItemManager;