// File: src/components/MasterItemManager.jsx (已修正 import useCallback)

// 請注意：此處已修正 import 語句，確保 useCallback 可用。
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

// === 定義現代簡潔主題顏色 ===
const ACCENT_COLOR = '#6C63FF';    
const BG_PRIMARY = '#1C1C1C';      
const TEXT_COLOR = '#F0F0F0';      
const BG_SECONDARY = '#2C2C2C';    
const SUCCESS_COLOR = '#4CAF50';   
const ERROR_COLOR = '#F44336';     
const WARNING_COLOR = '#FFB300';   

const MasterItemManager = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    
    // 新增：用於新增品項的狀態
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState(0);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('master_items')
            .select('*')
            .order('item_name', { ascending: true });

        if (error) {
            console.error('Error fetching items:', error);
            setError('載入品項主檔失敗。');
        } else {
            setItems(data);
            setError(null);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleFieldChange = (id, field, value) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSave = async (item) => {
        setMessage('');
        const { id, item_name, item_price, is_active } = item;
        
        if (!item_name || item_price === undefined || item_price < 0) {
            setMessage('錯誤: 品項名稱和價格欄位不能為空，且價格不能小於 0。');
            setTimeout(() => setMessage(''), 5000);
            return;
        }

        const { error } = await supabase
            .from('master_items')
            .update({ 
                item_name, 
                item_price: parseFloat(item_price), 
                is_active 
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating item:', error);
            setMessage(`儲存失敗: ${error.message}`);
        } else {
            setMessage(`✅ 品項 "${item_name}" 更新成功！`);
            fetchItems(); 
        }
        setTimeout(() => setMessage(''), 5000);
    };
    
    const handleAdd = async () => {
        setMessage('');
        if (!newItemName || newItemPrice <= 0) {
            setMessage('錯誤: 新增品項名稱和價格必須填寫，且價格必須大於 0。');
            setTimeout(() => setMessage(''), 5000);
            return;
        }
        
        const newItem = {
            item_name: newItemName,
            item_price: parseFloat(newItemPrice),
            is_active: true
        };
        
        const { error } = await supabase
            .from('master_items')
            .insert([newItem]);

        if (error) {
            console.error('Error adding item:', error);
            setMessage(`新增失敗: ${error.message}`);
        } else {
            setMessage(`✅ 品項 "${newItemName}" 新增成功！`);
            setNewItemName('');
            setNewItemPrice(0);
            fetchItems(); 
        }
        setTimeout(() => setMessage(''), 5000);
    };
    
    const handleDelete = async (item) => {
        if (!window.confirm(`確定要刪除品項 "${item.item_name}" 嗎？此操作不可逆！`)) {
            return;
        }

        setMessage('');
        const { error } = await supabase
            .from('master_items')
            .delete()
            .eq('id', item.id);

        if (error) {
            console.error('Error deleting item:', error);
            setMessage(`刪除失敗: ${error.message}`);
        } else {
            setMessage(`✅ 品項 "${item.item_name}" 已成功刪除。`);
            fetchItems(); 
        }
        setTimeout(() => setMessage(''), 5000);
    };


    const filteredItems = items.filter(item => 
        item.item_name.toLowerCase().includes(search.toLowerCase())
    );

    // 現代感表格樣式
    const tableStyle = {
        tableContainer: {
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
            borderSpacing: '0 10px', 
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

        saveButton: {
            backgroundColor: SUCCESS_COLOR,
            color: 'white', 
            border: 'none',
            padding: '8px 15px',
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            marginRight: '8px',
        },
        deleteButton: { 
            backgroundColor: ERROR_COLOR,
            color: 'white',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s',
        },
        input: {
            padding: '8px 10px',
            border: `1px solid ${BG_SECONDARY}`, 
            borderRadius: '6px', 
            backgroundColor: BG_SECONDARY,
            color: TEXT_COLOR,
            width: '100%',
            boxSizing: 'border-box',
        },
        searchContainer: {
            display: 'flex',
            marginBottom: '20px',
            gap: '10px',
        },
        addButton: {
            backgroundColor: ACCENT_COLOR,
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            boxShadow: `0 2px 10px ${ACCENT_COLOR}50`,
        },
        messageBox: (type) => ({
            padding: '15px',
            borderRadius: '8px', 
            marginBottom: '20px',
            border: `1px solid ${type === 'error' ? ERROR_COLOR : SUCCESS_COLOR}`, 
            fontWeight: 'bold',
            color: TEXT_COLOR,
            backgroundColor: type === 'error' ? `${ERROR_COLOR}20` : `${SUCCESS_COLOR}20`,
        }),
    };

    if (loading) return <div style={{ color: TEXT_COLOR, textAlign: 'center' }}>載入中...</div>;

    return (
        <div style={tableStyle.tableContainer}>
            <h2 style={tableStyle.title}>品項主檔管理</h2>
            
            {message && (
                <div style={tableStyle.messageBox(message.includes('錯誤') ? 'error' : 'success')}>
                    {message}
                </div>
            )}
            
            {error && <div style={tableStyle.messageBox('error')}>{error}</div>}

            {/* 新增品項區塊 */}
            <div style={{ ...tableStyle.searchContainer, marginBottom: '30px', borderBottom: `1px solid ${BG_PRIMARY}`, paddingBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="新增品項名稱"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    style={{ ...tableStyle.input, flex: 2 }}
                />
                <input
                    type="number"
                    min="0"
                    placeholder="價格"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    style={{ ...tableStyle.input, flex: 1 }}
                />
                <button 
                    onClick={handleAdd}
                    style={tableStyle.addButton}
                >
                    + 新增品項
                </button>
            </div>
            
            {/* 搜尋欄位 */}
            <div style={tableStyle.searchContainer}>
                <input
                    type="text"
                    placeholder="🔎 搜尋品項名稱..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ ...tableStyle.input, flex: 1 }}
                />
            </div>
            
            {/* 品項列表 */}
            <table style={tableStyle.table}>
                <thead>
                    <tr>
                        <th style={{ ...tableStyle.th, ...tableStyle.tdFirst }}>名稱</th>
                        <th style={tableStyle.th}>價格</th>
                        <th style={tableStyle.th}>狀態</th>
                        <th style={{ ...tableStyle.th, ...tableStyle.tdLast, width: '200px' }}>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map(item => (
                        <tr key={item.id} style={tableStyle.tr}>
                            {/* 品項名稱 */}
                            <td style={{ ...tableStyle.td, ...tableStyle.tdFirst }}>
                                <input
                                    type="text"
                                    value={item.item_name}
                                    onChange={(e) => handleFieldChange(item.id, 'item_name', e.target.value)}
                                    style={tableStyle.input}
                                />
                            </td>
                            {/* 價格 */}
                            <td style={tableStyle.td}>
                                <input
                                    type="number"
                                    min="0"
                                    value={item.item_price}
                                    onChange={(e) => handleFieldChange(item.id, 'item_price', e.target.value)}
                                    style={tableStyle.input}
                                />
                            </td>
                            {/* 狀態 */}
                            <td style={tableStyle.td}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={item.is_active}
                                        onChange={(e) => {
                                            handleFieldChange(item.id, 'is_active', e.target.checked);
                                            // 延遲保存狀態
                                            setTimeout(() => handleSave({...item, is_active: e.target.checked}), 100); 
                                        }}
                                        style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                                    />
                                    {item.is_active ? '✅ 啟用中' : '❌ 已禁用'}
                                </label>
                            </td>
                            {/* 操作 */}
                            <td style={{ ...tableStyle.td, ...tableStyle.tdLast }}>
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