// File: src/components/MasterItemManager.jsx (修正為米色現代風和移動設備寬度)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

// === 新增：米色/大地色系配色 ===
const ACCENT_COLOR = '#A0522D';
const BG_PRIMARY = '#FAF0E6';
const TEXT_COLOR = '#333333';
const BG_SECONDARY = '#FFFFFF';
const SUCCESS_COLOR = '#2E8B57';
const ERROR_COLOR = '#D9534F'; 
const WARNING_COLOR = '#F0AD4E'; 

const MasterItemManager = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState(0);

    // 現代簡約表格樣式
    const tableStyle = {
        th: { 
            borderBottom: `2px solid ${ACCENT_COLOR}`, 
            padding: '10px 5px', 
            textAlign: 'left', 
            backgroundColor: BG_SECONDARY, 
            color: ACCENT_COLOR,
            fontSize: '14px',
            fontWeight: 'bold'
        },
        td: { 
            borderBottom: `1px solid #ddd`, 
            padding: '8px 5px',
            color: TEXT_COLOR,
            backgroundColor: BG_SECONDARY, 
            fontSize: '14px'
        },
        saveButton: {
            backgroundColor: SUCCESS_COLOR,
            color: 'white',
            border: 'none',
            padding: '6px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'opacity 0.2s',
            marginRight: '5px',
            fontSize: '12px'
        },
        deleteButton: { 
            backgroundColor: ERROR_COLOR,
            color: 'white',
            border: 'none',
            padding: '6px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'opacity 0.2s',
            fontSize: '12px'
        },
        input: {
            padding: '5px',
            border: `1px solid #ccc`,
            borderRadius: '4px',
            backgroundColor: BG_SECONDARY,
            color: TEXT_COLOR,
            width: '100%',
            boxSizing: 'border-box',
            fontSize: '14px'
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
                is_active: true 
            })
            .select();

        if (error) {
            console.error('Error creating item:', error);
            setError(`[錯誤] 新增品項失敗: ${error.message}`);
        } else {
            setMessage(`[成功] 品項 ${data[0].name_zh} 新增完成！`);
            setNewItemName('');
            setNewItemPrice(0);
            fetchItems(); 
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
            fetchItems(); 
        }
    };

    // 根據搜尋條件過濾品項
    const filteredItems = items.filter(item =>
        item.name_zh.toLowerCase().includes(search.toLowerCase())
    );
    
    // 樣式調整以適應手機
    const containerStyle = { 
        padding: '10px', 
        maxWidth: '100%', 
        margin: '0 auto', 
        backgroundColor: BG_SECONDARY, 
        color: TEXT_COLOR 
    };
    const newEntryContainerStyle = {
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: BG_PRIMARY, // 使用主背景色作為新增區塊的底色
        borderRadius: '8px', 
        border: `1px solid ${ACCENT_COLOR}30`,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'stretch',
    };
    const createButton = {
        backgroundColor: ACCENT_COLOR,
        color: 'white',
        border: 'none',
        padding: '10px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'opacity 0.2s',
        fontSize: '15px'
    };


    return (
        <div style={containerStyle}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px', textAlign: 'center', color: ACCENT_COLOR }}>
                品項主檔管理
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
                <h3 style={{ color: ACCENT_COLOR, margin: 0, fontSize: '16px' }}>+ 新增品項:</h3>
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
            <div style={{ marginBottom: '15px' }}>
                <input
                    type="text"
                    placeholder="🔍 輸入品項名稱進行過濾..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ ...tableStyle.input, padding: '10px', fontSize: '15px' }}
                />
            </div>
            
            {loading && <p style={{ color: ACCENT_COLOR }}>正在載入品項清單...</p>}

            {/* 品項列表 (使用 flex/div 模擬表格以適應手機佈局) */}
             <div style={{ marginBottom: '15px', border: `1px solid #ddd`, borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', backgroundColor: BG_PRIMARY, borderBottom: `2px solid ${ACCENT_COLOR}` }}>
                    <div style={{ ...tableStyle.th, flex: 3 }}>名稱</div>
                    <div style={{ ...tableStyle.th, flex: 1.5, textAlign: 'right' }}>價格</div>
                    <div style={{ ...tableStyle.th, flex: 3.5 }}>操作/狀態</div>
                </div>
                
                {!loading && filteredItems.length === 0 && (
                     <div style={{padding: '10px', textAlign: 'center', color: TEXT_COLOR}}>找不到符合條件的品項。</div>
                )}

                {filteredItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', borderBottom: `1px solid #eee` }}>
                        
                        <div style={{ ...tableStyle.td, flex: 3, fontWeight: '500' }}>{item.name_zh}</div>
                        
                        <div style={{ ...tableStyle.td, flex: 1.5 }}>
                            <input
                                type="number"
                                value={item.price}
                                onChange={(e) => handleFieldChange(item.id, 'price', e.target.value)}
                                onBlur={() => handleSave(item)} 
                                style={{...tableStyle.input, textAlign: 'right'}}
                                min="0"
                            />
                        </div>
                        
                        <div style={{ ...tableStyle.td, flex: 3.5, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {/* 狀態切換 */}
                             <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                                <input
                                    type="checkbox"
                                    checked={item.is_active}
                                    onChange={(e) => {
                                        handleFieldChange(item.id, 'is_active', e.target.checked);
                                        setTimeout(() => handleSave({...item, is_active: e.target.checked}), 100); 
                                    }}
                                    style={{ marginRight: '5px', transform: 'scale(1.1)' }}
                                />
                                <span style={{ fontSize: '12px', color: item.is_active ? SUCCESS_COLOR : ERROR_COLOR }}>
                                    {item.is_active ? '啟用中' : '已禁用'}
                                </span>
                            </label>

                            {/* 操作按鈕 */}
                            <div style={{ display: 'flex', gap: '5px' }}>
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
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MasterItemManager;