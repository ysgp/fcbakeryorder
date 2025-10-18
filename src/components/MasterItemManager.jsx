// File: src/components/MasterItemManager.jsx (新增導入/導出功能 - 大地色系優化)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import * as XLSX from 'xlsx'; // 確保您已安裝此庫

// 定義大地主題顏色
const TECH_ACCENT = '#A0522D'; // 土褐色 (Sienna)
const BG_PRIMARY = '#FFF8E1'; // 乳米色 (Creamy Beige)
const TEXT_COLOR = '#4E342E'; // 深棕色 (Dark Brown)
const BG_SECONDARY = '#F5E3C8'; // 淺棕色 (Light Tan)
const SUCCESS_COLOR = '#689F38'; // 青綠色
const ERROR_COLOR = '#D32F2F'; // 紅色
const WARNING_COLOR = '#FF9800'; // 警告色
const ACTION_COLOR = '#795548'; // 棕色

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
            fontSize: '15px'
        },
        td: { 
            border: `1px solid ${BG_SECONDARY}`, 
            padding: '8px', 
            textAlign: 'left',
            color: TEXT_COLOR,
            fontSize: '14px',
            backgroundColor: BG_PRIMARY,
            verticalAlign: 'middle',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            margin: '20px 0',
            boxShadow: `0 0 10px ${TEXT_COLOR}10`,
        },
        input: {
            padding: '6px',
            border: `1px solid ${TECH_ACCENT}50`,
            borderRadius: '3px',
            boxSizing: 'border-box',
            width: '100%',
            backgroundColor: 'white',
            color: TEXT_COLOR,
        },
        saveButton: {
            backgroundColor: SUCCESS_COLOR,
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '5px',
            fontWeight: 'bold',
            fontSize: '14px'
        },
        deleteButton: {
            backgroundColor: ERROR_COLOR,
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
        },
        addButton: {
            backgroundColor: TECH_ACCENT,
            color: BG_PRIMARY,
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            width: '100%',
            marginTop: '10px'
        },
        excelButton: {
            backgroundColor: ACTION_COLOR,
            color: 'white',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            marginRight: '10px'
        }
    };

    // 獲取品項主檔 (RLS 會自動過濾)
    const fetchItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        // RLS 會自動篩選出當前用戶的資料
        let query = supabase
            .from('master_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (search) {
            query = query.ilike('name_zh', `%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            setError('載入品項失敗: ' + error.message);
            setItems([]);
        } else {
            setItems(data);
        }
        setLoading(false);
    }, [search]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // 處理欄位變更
    const handleChange = (id, field, value) => {
        setItems(prevItems => prevItems.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // 儲存變更 (UPDATE)
    const handleSave = async (item) => {
        setMessage('');
        const { error } = await supabase
            .from('master_items')
            .update({ 
                name_zh: item.name_zh, 
                price: item.price, 
                is_active: item.is_active 
            })
            .eq('id', item.id);

        if (error) {
            setError('儲存失敗: ' + error.message);
        } else {
            setMessage(`品項 "${item.name_zh}" 儲存成功!`);
            fetchItems(); // 重新載入以確認
        }
    };

    // 刪除品項 (DELETE)
    const handleDelete = async (item) => {
        if (!window.confirm(`確定要刪除品項 "${item.name_zh}" 嗎? 此操作不可逆!`)) {
            return;
        }

        setMessage('');
        const { error } = await supabase
            .from('master_items')
            .delete()
            .eq('id', item.id);

        if (error) {
            setError('刪除失敗: ' + error.message);
        } else {
            setMessage(`品項 "${item.name_zh}" 已成功刪除!`);
            fetchItems(); // 重新載入清單
        }
    };
    
    // 新增品項 (INSERT)
    const handleAdd = async () => {
        if (!newItemName || newItemPrice <= 0) {
            setError('請輸入有效的品項名稱和價格!');
            return;
        }

        setMessage('');
        setError(null);
        
        // 1. 獲取當前用戶 ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError('請先登入!');
            return;
        }
        
        const newItem = {
            name_zh: newItemName,
            price: newItemPrice,
            is_active: true,
            user_id: user.id, // <--- 關鍵：寫入 user_id
        };

        const { error } = await supabase
            .from('master_items')
            .insert([newItem]);

        if (error) {
            setError('新增失敗: ' + error.message);
        } else {
            setMessage(`品項 "${newItemName}" 新增成功!`);
            setNewItemName('');
            setNewItemPrice(0);
            fetchItems(); // 重新載入清單
        }
    };
    
    // *** 導入/導出 Excel 功能 ***
    
    // 導出功能 (Export)
    const handleExport = () => {
        if (!items || items.length === 0) {
            setError('沒有品項數據可供導出。');
            return;
        }
        setMessage('');
        
        // 整理數據格式，只導出關鍵欄位
        const exportData = items.map(item => ({
            "品項名稱": item.name_zh,
            "價格 (NT$)": parseFloat(item.price),
            "是否啟用": item.is_active ? 'TRUE' : 'FALSE',
            "ID (請勿修改)": item.id, // 保留 ID 方便後續追蹤
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "品項主檔");
        
        // 導出檔案
        XLSX.writeFile(workbook, "MasterItems_Export.xlsx");
        setMessage('品項數據已成功導出為 Excel。');
    };

    // 導入功能 (Import)
    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setMessage('');
        setError(null);
        
        // 1. 獲取當前用戶 ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError('請先登入才能導入品項!');
            return;
        }
        const currentUserId = user.id;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                // 讀取 Excel 內容並轉為 JSON 陣列 (從 A1 開始)
                const jsonItems = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // 假設 Excel 格式: [0]品項名稱, [1]價格, [2]是否啟用 (可選)
                // 檢查表頭確保格式正確
                if (jsonItems.length < 2 || jsonItems[0][0] !== '品項名稱' || jsonItems[0][1] !== '價格 (NT$)') {
                    setError('導入失敗：Excel 格式不正確。請確保第一列為 "品項名稱"，第二列為 "價格 (NT$)"。');
                    return;
                }

                const itemsToInsert = [];
                for (let i = 1; i < jsonItems.length; i++) {
                    const row = jsonItems[i];
                    const name = String(row[0] || '').trim();
                    const price = parseFloat(row[1]);
                    const isActive = (String(row[2] || 'TRUE').toUpperCase() === 'TRUE');
                    
                    if (name && !isNaN(price) && price >= 0) {
                        itemsToInsert.push({
                            name_zh: name,
                            price: price,
                            is_active: isActive,
                            user_id: currentUserId,
                        });
                    }
                }

                if (itemsToInsert.length === 0) {
                    setError('導入失敗：檔案中找不到有效的品項數據 (名稱不可為空，價格必須為數字且大於等於 0)。');
                    return;
                }

                // 批量插入 Supabase
                // 注意：這裡只執行 INSERT。如果需要 UPDATE 現有項目，邏輯會更複雜，需要用到 'ID (請勿修改)' 欄位。
                const { error: insertError } = await supabase
                    .from('master_items')
                    .insert(itemsToInsert);

                if (insertError) {
                    setError('批量導入 Supabase 失敗: ' + insertError.message);
                } else {
                    setMessage(`成功導入 ${itemsToInsert.length} 個新項目!`);
                    fetchItems();
                }

            } catch (err) {
                setError('解析檔案失敗: ' + err.message);
                console.error(err);
            }
        };

        reader.readAsArrayBuffer(file);
    };


    return (
        <div style={{ padding: '20px', backgroundColor: BG_PRIMARY, borderRadius: '8px', boxShadow: `0 2px 8px ${TEXT_COLOR}20` }}>
            <h2 style={{ color: TECH_ACCENT, textAlign: 'center', marginBottom: '20px', fontSize: '20px' }}>
                品項主檔管理
            </h2>

            {/* 訊息顯示區 */}
            {error && (
                <div style={{ padding: '10px', borderRadius: '4px', marginBottom: '15px', backgroundColor: `${ERROR_COLOR}20`, color: ERROR_COLOR, border: `1px solid ${ERROR_COLOR}` }}>
                    錯誤: {error}
                </div>
            )}
            {message && !error && (
                <div style={{ padding: '10px', borderRadius: '4px', marginBottom: '15px', backgroundColor: `${SUCCESS_COLOR}20`, color: SUCCESS_COLOR, border: `1px solid ${SUCCESS_COLOR}` }}>
                    成功: {message}
                </div>
            )}
            
            {/* 導入/導出按鈕 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: `1px solid ${BG_SECONDARY}`, paddingBottom: '10px' }}>
                <button onClick={handleExport} style={tableStyle.excelButton}>
                    ⬇️ 導出品項 (Excel)
                </button>
                <label style={{ ...tableStyle.excelButton, cursor: 'pointer', backgroundColor: ACTION_COLOR }}>
                    ⬆️ 導入品項 (Excel)
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleImport} 
                        // 在導入完成後，將 input 的 value 清空，以便再次選擇同一個文件
                        onClick={(e) => e.target.value = null} 
                        style={{ display: 'none' }} 
                    />
                </label>
            </div>

            {/* 新增品項表單 */}
            <div style={{ border: `1px solid ${BG_SECONDARY}`, padding: '15px', borderRadius: '4px', marginBottom: '20px', backgroundColor: BG_SECONDARY }}>
                <h3 style={{ color: TEXT_COLOR, marginTop: 0, borderBottom: `1px solid ${TECH_ACCENT}50`, paddingBottom: '5px', fontSize: '18px' }}>新增品項</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 3 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: TEXT_COLOR, fontSize: '14px' }}>名稱 (中文):</label>
                        <input
                            type="text"
                            placeholder="例如: 鳳凰酥(12入)"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            style={tableStyle.input}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: TEXT_COLOR, fontSize: '14px' }}>價格:</label>
                        <input
                            type="number"
                            min="0"
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(parseFloat(e.target.value))}
                            style={tableStyle.input}
                        />
                    </div>
                    <button onClick={handleAdd} style={{ ...tableStyle.addButton, flex: 1, minWidth: '80px', margin: 0 }}>
                        新增
                    </button>
                </div>
            </div>

            {/* 搜尋欄 */}
            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: TEXT_COLOR, fontSize: '14px' }}>搜尋品項:</label>
                <input
                    type="text"
                    placeholder="輸入名稱進行篩選..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ ...tableStyle.input, paddingRight: '10px' }}
                />
            </div>


            {/* 品項清單表格 */}
            {loading ? (
                <p style={{ textAlign: 'center', color: TEXT_COLOR }}>載入中...</p>
            ) : items.length === 0 && !search ? (
                <p style={{ textAlign: 'center', color: WARNING_COLOR, fontWeight: 'bold' }}>沒有任何品項，請新增。</p>
            ) : items.length === 0 && search ? (
                <p style={{ textAlign: 'center', color: WARNING_COLOR, fontWeight: 'bold' }}>找不到符合 "{search}" 的品項。</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle.table}>
                        <thead>
                            <tr>
                                <th style={{ ...tableStyle.th, width: '40%' }}>品項名稱 (中文)</th>
                                <th style={{ ...tableStyle.th, width: '15%' }}>價格</th>
                                <th style={{ ...tableStyle.th, width: '15%' }}>狀態</th>
                                <th style={{ ...tableStyle.th, width: '30%' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td style={tableStyle.td}>
                                        <input
                                            type="text"
                                            value={item.name_zh || ''}
                                            onChange={(e) => handleChange(item.id, 'name_zh', e.target.value)}
                                            style={tableStyle.input}
                                        />
                                    </td>
                                    <td style={tableStyle.td}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.price || 0}
                                            onChange={(e) => handleChange(item.id, 'price', parseFloat(e.target.value))}
                                            style={tableStyle.input}
                                        />
                                    </td>
                                    <td style={tableStyle.td}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: item.is_active ? SUCCESS_COLOR : ERROR_COLOR, fontWeight: 'bold' }}>
                                            <input
                                                type="checkbox"
                                                checked={item.is_active}
                                                onChange={(e) => {
                                                    handleChange(item.id, 'is_active', e.target.checked);
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
            )}
        </div>
    );
};

export default MasterItemManager;