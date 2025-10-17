// File: src/components/OrderFormWeb.jsx (最終檢查：確保 map 內部只渲染字串/數字/JSX元素)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabase';

// === 米色/大地色系配色 ===
const ACCENT_COLOR = '#A0522D';
const BG_PRIMARY = '#FAF0E6';
const TEXT_COLOR = '#333333';
const BG_SECONDARY = '#FFFFFF';
const ERROR_COLOR = '#D9534F'; 
const SUCCESS_COLOR = '#2E8B57';
const WARNING_COLOR = '#F0AD4E'; 

// 初始品項結構
const initialItem = { item_name: '', quantity: 1 };

const OrderFormWeb = () => {
    // 狀態：適應資料庫欄位 customer_last_name
    const [customerLastName, setCustomerLastName] = useState(''); 
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('欠款'); 
    
    // 狀態：適應資料庫欄位 pickup_date 和 pickup_time
    const [pickupDate, setPickupDate] = useState('');
    const [pickupTimeOfDay, setPickupTimeOfDay] = useState(''); 
    
    const [orderNotes, setOrderNotes] = useState(''); 
    const [orderItems, setOrderItems] = useState([{ ...initialItem }]); 
    const [masterItems, setMasterItems] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [message, setMessage] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestionsIndex, setShowSuggestionsIndex] = useState(null);
    const itemRefs = useRef([]);

    // 載入品項主檔
    useEffect(() => {
        const fetchMasterItems = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('master_items')
                .select('name_zh, price') 
                .eq('is_active', true);

            if (error) {
                console.error('Error fetching master items:', error);
                setMessage({ type: 'error', text: '錯誤：無法載入品項清單 (請檢查 Supabase 連線)' });
            } else {
                setMasterItems(data);
                setMessage('');
            }
            setLoading(false);
        };
        fetchMasterItems();
    }, []);

    // 樣式定義 (未變動)
    const inputStyle = {
        padding: '12px',
        border: `1px solid #ccc`,
        borderRadius: '8px', 
        backgroundColor: BG_SECONDARY,
        color: TEXT_COLOR,
        width: '100%',
        boxSizing: 'border-box',
        fontSize: '16px',
        marginTop: '5px'
    };

    const selectStyle = {
        ...inputStyle,
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%23333333' d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        paddingRight: '30px',
    };
    
    const styles = {
        container: { maxWidth: '100%', margin: '0 auto', padding: '10px' },
        formGroup: { marginBottom: '15px' },
        input: inputStyle,
        select: selectStyle,
        label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '15px', color: TEXT_COLOR },
        sectionHeader: { fontSize: '18px', marginTop: '20px', marginBottom: '10px', borderBottom: `1px solid ${ACCENT_COLOR}50`, paddingBottom: '5px', color: ACCENT_COLOR },
        itemRow: { display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '8px' },
        removeButton: {
            backgroundColor: ERROR_COLOR,
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '8px', 
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            flexShrink: 0,
            fontSize: '18px'
        },
        addButton: {
            backgroundColor: SUCCESS_COLOR,
            color: BG_SECONDARY,
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%',
            marginTop: '10px',
            marginBottom: '20px',
            fontWeight: 'bold',
            fontSize: '16px'
        },
        submitButton: {
            backgroundColor: ACCENT_COLOR,
            color: BG_SECONDARY,
            border: 'none',
            padding: '18px',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%',
            fontSize: '20px',
            fontWeight: 'bold',
            boxShadow: `0 4px 10px ${ACCENT_COLOR}50`, 
            transition: 'background-color 0.2s, box-shadow 0.2s',
        },
        messageBox: {
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: `1px solid`,
            fontWeight: 'bold',
            color: TEXT_COLOR
        },
        suggestionBox: {
            position: 'absolute',
            top: '100%', 
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: BG_SECONDARY,
            border: `1px solid ${ACCENT_COLOR}50`,
            borderRadius: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        },
        suggestionItem: {
            padding: '10px',
            cursor: 'pointer',
            borderBottom: '1px solid #eee',
            fontSize: '15px',
        }
    };
    
    // 處理訂單項目變更
    const handleItemChange = (index, field, value) => {
        const newItems = [...orderItems]; 
        
        newItems[index] = { 
            ...newItems[index], 
            [field]: value 
        };
        
        setOrderItems(newItems);

        if (field === 'item_name') {
            setSearchTerm(value);
            setShowSuggestionsIndex(index);
        }
    };
    
    // 處理搜尋建議點擊
    const handleSelectSuggestion = (index, name) => {
        const newItems = [...orderItems];
        newItems[index] = { 
            ...newItems[index], 
            item_name: name 
        };
        setOrderItems(newItems);
        setShowSuggestionsIndex(null); 

        if (itemRefs.current[index] && itemRefs.current[index].quantityInput) {
             itemRefs.current[index].quantityInput.focus();
        }
    };

    // 過濾建議
    const suggestions = useMemo(() => {
        if (!searchTerm || showSuggestionsIndex === null) return [];
        const uniqueItems = Array.from(new Set(masterItems.map(item => item.name_zh)));
        return uniqueItems
            .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 10); 
    }, [searchTerm, masterItems, showSuggestionsIndex]);

    // 移除品項
    const handleRemoveItem = (index) => {
        const newItems = orderItems.filter((_, i) => i !== index);
        setOrderItems(newItems.length > 0 ? newItems : [{ ...initialItem }]);
    };

    // 新增品項
    const handleAddItem = () => {
        setOrderItems([...orderItems, { ...initialItem }]);
    };

    // 總金額計算
    const calculateTotal = () => {
        return orderItems.reduce((total, item) => {
            const masterItem = masterItems.find(mi => mi.name_zh === item.item_name);
            const price = masterItem ? masterItem.price : 0;
            const quantity = parseInt(item.quantity) || 0;
            return total + price * quantity;
        }, 0);
    };

    // 提交表單
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        // 驗證
        if (!customerLastName || !customerPhone || !pickupDate || !pickupTimeOfDay || orderItems.every(item => !item.item_name.trim())) {
            setMessage({ type: 'error', text: '請填寫顧客姓名、電話、取貨日期和時間，並至少輸入一個品項名稱。' });
            return;
        }

        setIsSubmitting(true);
        setMessage({ type: 'info', text: '訂單提交中...' });
        
        // 處理訂單項目格式
        const itemsToInsert = orderItems
            .filter(item => item.item_name.trim() && (parseInt(item.quantity) > 0))
            .map(item => {
                const masterItem = masterItems.find(mi => mi.name_zh === item.item_name);
                const price = masterItem ? masterItem.price : 0;
                const quantity = parseInt(item.quantity);
                return `${item.item_name} x ${quantity} ($${price * quantity})`; 
            });

        // 建立訂單主體
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                customer_last_name: customerLastName, 
                customer_phone: customerPhone,
                pickup_date: pickupDate,             
                pickup_time: pickupTimeOfDay,        
                
                payment_status: paymentStatus,
                order_notes: orderNotes,
                
                items_list: itemsToInsert.join('; '), 
                
                total_amount: calculateTotal(),
                is_completed: false,
                created_at: new Date().toISOString()
            })
            .select();

        if (orderError) {
            console.error('Order submission error:', orderError);
            setMessage({ type: 'error', text: `訂單提交失敗: ${orderError.message}` });
        } else {
            // 提交成功後清除表單
            setCustomerLastName(''); 
            setCustomerPhone('');
            setPickupDate(''); 
            setPickupTimeOfDay(''); 
            setOrderNotes('');
            setOrderItems([{ ...initialItem }]);
            setMessage({ type: 'success', text: `訂單 #${orderData[0].order_id} 提交成功！總金額：$${calculateTotal()}` });
        }

        setIsSubmitting(false);
    };
    
    return (
        <div style={styles.container}>
            <h2 style={{ color: ACCENT_COLOR, textAlign: 'center', marginBottom: '20px' }}>外場訂單輸入</h2>

            {/* 訊息框 */}
            {message && (
                <div style={{ 
                    ...styles.messageBox, 
                    borderColor: message.type === 'error' ? ERROR_COLOR : (message.type === 'success' ? SUCCESS_COLOR : WARNING_COLOR),
                    backgroundColor: message.type === 'error' ? `${ERROR_COLOR}10` : (message.type === 'success' ? `${SUCCESS_COLOR}10` : `${WARNING_COLOR}10`),
                    color: message.type === 'error' ? ERROR_COLOR : (message.type === 'success' ? SUCCESS_COLOR : TEXT_COLOR),
                    fontWeight: 'bold',
                }}>
                    {message.text}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                {/* 顧客資料輸入區 (略) */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>顧客姓名 (必填)</label>
                    <input
                        type="text"
                        value={customerLastName}
                        onChange={(e) => setCustomerLastName(e.target.value)}
                        style={styles.input}
                        placeholder="輸入顧客姓名"
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>顧客電話 (必填)</label>
                    <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        style={styles.input}
                        placeholder="輸入顧客電話"
                        required
                    />
                </div>

                {/* 取貨日期/時間輸入區 (略) */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>預計取貨日期 (必填)</label>
                    <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        style={styles.input}
                        required
                    />
                </div>
                
                <div style={styles.formGroup}>
                    <label style={styles.label}>預計取貨時間 (必填)</label>
                    <input
                        type="time"
                        value={pickupTimeOfDay}
                        onChange={(e) => setPickupTimeOfDay(e.target.value)}
                        style={styles.input}
                        required
                    />
                </div>
                
                <div style={styles.formGroup}>
                    <label style={styles.label}>付款狀態</label>
                    <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        style={styles.select}
                    >
                        <option value="已付清">已付清</option>
                        <option value="欠款">欠款</option>
                    </select>
                </div>

                <h3 style={styles.sectionHeader}>訂單明細</h3>

                {/* 品項輸入區 - 這是最可能發生錯誤的地方 */}
                {orderItems.map((item, index) => (
                    <div key={index} style={styles.itemRow}>
                        
                        {/* 品項名稱 (佔 60%) */}
                        <div style={{ flex: 3, position: 'relative' }}>
                            <input
                                type="text"
                                value={item.item_name} 
                                onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                onFocus={() => {
                                    setSearchTerm(item.item_name);
                                    setShowSuggestionsIndex(index);
                                }}
                                onBlur={() => setTimeout(() => setShowSuggestionsIndex(null), 200)} 
                                style={styles.input}
                                placeholder="品項名稱"
                                ref={el => itemRefs.current[index] = { ...itemRefs.current[index], nameInput: el }}
                            />
                            
                            {/* 搜尋建議 */}
                            {showSuggestionsIndex === index && suggestions.length > 0 && (
                                <div style={styles.suggestionBox}>
                                    {suggestions.map((name, i) => (
                                        <div
                                            key={i}
                                            style={styles.suggestionItem}
                                            onMouseDown={() => handleSelectSuggestion(index, name)} 
                                        >
                                            {name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* 數量 (佔 30%) */}
                        <input
                            type="number"
                            value={item.quantity} 
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            style={{ ...styles.input, flex: 1, textAlign: 'right' }}
                            min="1"
                            placeholder="數量"
                            ref={el => itemRefs.current[index] = { ...itemRefs.current[index], quantityInput: el }}
                        />
                        
                        {/* 移除按鈕 */}
                        <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            style={styles.removeButton}
                        >
                            <span role="img" aria-label="remove">❌</span>
                        </button>
                    </div>
                ))}
                
                {/* 新增品項按鈕 */}
                <button
                    type="button"
                    onClick={handleAddItem}
                    style={styles.addButton}
                >
                    + 新增品項
                </button>

                {/* 備註與總金額 (略) */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>訂單備註</label>
                    <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                        placeholder="輸入特殊要求或注意事項..."
                    />
                </div>
                
                <h3 style={{ ...styles.sectionHeader, borderBottom: 'none', textAlign: 'right', fontSize: '20px' }}>
                    預估總金額: <span style={{ color: ERROR_COLOR }}>${calculateTotal()}</span>
                </h3>

                {/* 提交按鈕 */}
                <button
                    type="submit"
                    disabled={isSubmitting || orderItems.every(item => !item.item_name.trim())}
                    style={{ 
                        ...styles.submitButton,
                        opacity: isSubmitting ? 0.7 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isSubmitting ? '提交中...' : '提交訂單'}
                </button>
            </form>
        </div>
    );
};

export default OrderFormWeb;