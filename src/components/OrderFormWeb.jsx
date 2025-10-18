// File: src/components/OrderFormWeb.jsx (已修正 ACTION_COLOR 錯誤與品項同步問題)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabase';

// 定義大地主題顏色
const TECH_ACCENT = '#A0522D'; // 土褐色 (Sienna)
const BG_PRIMARY = '#FFF8E1'; // 乳米色 (Creamy Beige)
const TEXT_COLOR = '#4E342E'; // 深棕色 (Dark Brown)
const BG_SECONDARY = '#F5E3C8'; // 淺棕色 (Light Tan)
const ERROR_COLOR = '#D32F2F'; // 紅色
const SUCCESS_COLOR = '#689F38'; // 青綠色
// FIX 1: 確保 ACTION_COLOR 在 styles 物件前宣告
const ACTION_COLOR = '#795548'; // 棕色

const initialItem = { item_name: '', quantity: 1 };

const OrderFormWeb = () => {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('欠款'); 
    // MODIFICATION 1: 拆分日期和時間
    const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]); // 預設為今天
    const [pickupTime, setPickupTime] = useState(''); 
    const [orderNotes, setOrderNotes] = useState(''); 
    const [orderItems, setOrderItems] = useState([initialItem]);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    // 品項主檔相關
    const [masterItems, setMasterItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [currentItemIndex, setCurrentItemIndex] = useState(null);
    const itemInputRef = useRef(null); // 用於儲存當前聚焦的輸入框引用

    const fetchMasterItems = async () => {
        // RLS 會自動篩選出當前用戶的資料
        const { data, error } = await supabase
            .from('master_items')
            .select('name_zh, price')
            .eq('is_active', true); // 只選取啟用的品項

        if (error) {
            console.error('Error fetching master items:', error.message);
        } else {
            setMasterItems(data.map(item => ({ name: item.name_zh, price: parseFloat(item.price) })));
        }
    };

    useEffect(() => {
        fetchMasterItems();
    }, []);

    const findItemPrice = (itemName) => {
        const item = masterItems.find(i => i.name === itemName);
        return item ? item.price : 0;
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...orderItems];
        // FIX 2: 確保修改單一品項時，該品項物件也被複製 (深層複製)，防止同步問題
        newItems[index] = { ...newItems[index], [field]: value };
        
        if (field === 'item_name') {
            const price = findItemPrice(value);
            // 確保 price 也被寫入複製後的新物件
            newItems[index].price = price;
        }

        setOrderItems(newItems);
        
        if (field === 'item_name') {
            setSearchTerm(value);
            setCurrentItemIndex(index);
            setShowSuggestions(true);
        }
    };

    const handleAddItem = () => {
        setOrderItems([...orderItems, initialItem]);
    };

    const handleRemoveItem = (index) => {
        const newItems = orderItems.filter((_, i) => i !== index);
        setOrderItems(newItems);
    };

    const totalAmount = useMemo(() => {
        return orderItems.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 0;
            return sum + (price * quantity);
        }, 0);
    }, [orderItems]);

    const handleSuggestionClick = (itemName, price) => {
        if (currentItemIndex !== null) {
            const newItems = [...orderItems];
            // FIX 2: 確保物件複製
            newItems[currentItemIndex] = { 
                ...newItems[currentItemIndex], 
                item_name: itemName, 
                price: price 
            };
            
            setOrderItems(newItems);
            setShowSuggestions(false);
            setSearchTerm('');
            setCurrentItemIndex(null);
        }
    };

    const filteredSuggestions = useMemo(() => {
        if (!searchTerm || currentItemIndex === null) return [];
        return masterItems
            .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 10);
    }, [searchTerm, masterItems, currentItemIndex]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsError(false);

        // 1. 驗證
        if (!customerName || orderItems.some(item => !item.item_name || item.quantity <= 0) || !pickupDate || !pickupTime) {
            setMessage('請填寫完整的客戶名稱、品項名稱、數量、取貨日期和時間。');
            setIsError(true);
            setLoading(false);
            return;
        }

        // 2. 獲取當前用戶 ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setMessage('請先登入!');
            setIsError(true);
            setLoading(false);
            return;
        }

        const newOrder = {
            customer_last_name: customerName,
            customer_phone: customerPhone,
            payment_status: paymentStatus,
            items_list: orderItems.map(item => ({
                item_name: item.item_name,
                quantity: parseInt(item.quantity) || 0,
                price: parseFloat(findItemPrice(item.item_name) || item.price || 0) // 確保使用主檔價格或輸入的價格
            })),
            pickup_date: pickupDate,
            pickup_time: pickupTime,
            order_notes: orderNotes,
            total_amount: totalAmount,
            is_completed: false,
            user_id: user.id, // <--- 關鍵：寫入 user_id
        };

        const { error } = await supabase
            .from('orders')
            .insert([newOrder]);

        setLoading(false);

        if (error) {
            setMessage('訂單提交失敗: ' + error.message);
            setIsError(true);
        } else {
            setMessage('訂單提交成功!');
            setIsError(false);
            // 重置表單
            setCustomerName('');
            setCustomerPhone('');
            setPaymentStatus('欠款');
            setPickupDate(new Date().toISOString().split('T')[0]);
            setPickupTime('');
            setOrderNotes('');
            setOrderItems([initialItem]);
        }
    };

    // 大地感 CSS 樣式
    const styles = {
        formContainer: {
            padding: '20px',
            backgroundColor: BG_PRIMARY,
            borderRadius: '8px',
            boxShadow: `0 2px 8px ${TEXT_COLOR}20`,
        },
        formGroup: {
            marginBottom: '15px',
        },
        label: {
            display: 'block',
            marginBottom: '5px',
            fontWeight: 'bold',
            color: TEXT_COLOR,
            fontSize: '15px'
        },
        input: {
            width: '100%',
            padding: '10px',
            border: `1px solid ${TECH_ACCENT}50`,
            borderRadius: '4px',
            boxSizing: 'border-box',
            backgroundColor: 'white',
            color: TEXT_COLOR,
            fontSize: '16px'
        },
        select: {
            width: '100%',
            padding: '10px',
            border: `1px solid ${TECH_ACCENT}50`,
            borderRadius: '4px',
            boxSizing: 'border-box',
            backgroundColor: 'white',
            color: TEXT_COLOR,
            fontSize: '16px',
            appearance: 'none', // 移除原生箭頭
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='${TECH_ACCENT.replace('#', '%23')}' d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z'/%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            backgroundSize: '12px',
        },
        itemRow: {
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-end',
            marginBottom: '10px',
            borderBottom: `1px dashed ${BG_SECONDARY}`,
            paddingBottom: '10px'
        },
        itemInputContainer: {
            flex: 1,
            position: 'relative', // 讓 suggestionBox 絕對定位
        },
        quantityInput: {
            width: '60px',
            textAlign: 'center',
            fontSize: '16px',
            padding: '10px',
            border: `1px solid ${TECH_ACCENT}50`,
            borderRadius: '4px',
            backgroundColor: 'white',
            color: TEXT_COLOR,
        },
        removeButton: {
            backgroundColor: ERROR_COLOR,
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            minWidth: '40px',
        },
        addButton: {
            backgroundColor: ACTION_COLOR, // <--- 使用 ACTION_COLOR
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
            marginTop: '10px',
            marginBottom: '15px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s, box-shadow 0.2s',
            fontSize: '16px'
        },
        submitButton: {
            backgroundColor: TECH_ACCENT,
            color: BG_PRIMARY,
            border: 'none',
            padding: '15px',
            borderRadius: '6px',
            cursor: 'pointer',
            width: '100%',
            fontSize: '18px', // 調整字體大小
            fontWeight: 'bold',
            boxShadow: `0 0 10px ${TECH_ACCENT}50`, 
            transition: 'background-color 0.2s, box-shadow 0.2s',
        },
        messageBox: {
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '15px',
            border: '1px solid',
            fontWeight: 'bold',
            color: TEXT_COLOR,
            fontSize: '14px'
        },
        suggestionBox: {
            position: 'absolute',
            top: '100%', 
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: BG_SECONDARY,
            border: `1px solid ${TECH_ACCENT}`,
            borderRadius: '6px',
            maxHeight: '150px',
            overflowY: 'auto',
            boxShadow: `0 4px 8px ${TEXT_COLOR}20`,
        },
        suggestionItem: {
            padding: '10px',
            cursor: 'pointer',
            borderBottom: `1px solid ${TECH_ACCENT}30`,
        }
    };

    return (
        <div style={styles.formContainer}>
            <h2 style={{ color: TECH_ACCENT, textAlign: 'center', marginBottom: '20px', fontSize: '20px' }}>
                訂單輸入 (A)
            </h2>

            {message && (
                <div style={{ 
                    ...styles.messageBox, 
                    borderColor: isError ? ERROR_COLOR : SUCCESS_COLOR, 
                    backgroundColor: isError ? `${ERROR_COLOR}10` : `${SUCCESS_COLOR}10`,
                    color: isError ? ERROR_COLOR : SUCCESS_COLOR
                }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* 客戶資訊 */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>客戶名稱 (姓氏或暱稱):</label>
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        style={styles.input}
                        required
                    />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>客戶電話:</label>
                    <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        style={styles.input}
                    />
                </div>

                {/* 狀態與取貨時間 */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>付款狀態:</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            style={styles.select}
                        >
                            <option value="欠款">欠款</option>
                            <option value="已付">已付</option>
                        </select>
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>取貨日期:</label>
                        <input
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>取貨時間:</label>
                        <input
                            type="time"
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>
                </div>

                {/* 品項清單 */}
                <label style={{ ...styles.label, borderBottom: `1px solid ${TECH_ACCENT}`, paddingBottom: '5px', marginBottom: '10px' }}>
                    訂購品項 (共: {orderItems.length} 項)
                </label>
                
                {orderItems.map((item, index) => (
                    <div key={index} style={styles.itemRow}>
                        <div style={styles.itemInputContainer}>
                            <label style={{ ...styles.label, fontSize: '12px' }}>品項名稱:</label>
                            <input
                                ref={currentItemIndex === index ? itemInputRef : null}
                                type="text"
                                placeholder="輸入品項名稱..."
                                value={item.item_name}
                                onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                onFocus={() => {
                                    setCurrentItemIndex(index);
                                    setShowSuggestions(true);
                                }}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // 延遲隱藏
                                style={{ ...styles.input, paddingRight: '50px' }} 
                                required
                            />
                            {currentItemIndex === index && showSuggestions && filteredSuggestions.length > 0 && (
                                <div style={styles.suggestionBox}>
                                    {filteredSuggestions.map((suggestion, sIndex) => (
                                        <div
                                            key={sIndex}
                                            style={{ ...styles.suggestionItem, backgroundColor: sIndex % 2 === 0 ? BG_PRIMARY : BG_SECONDARY }}
                                            onMouseDown={() => handleSuggestionClick(suggestion.name, suggestion.price)} // 使用 onMouseDown 避免 onBlur 觸發
                                        >
                                            {suggestion.name} (NT${suggestion.price})
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ width: '80px' }}>
                            <label style={{ ...styles.label, fontSize: '12px' }}>數量:</label>
                            <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                style={styles.quantityInput}
                                required
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            style={styles.removeButton}
                        >
                            移除
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={handleAddItem}
                    style={styles.addButton}
                >
                    + 增加品項
                </button>

                {/* 備註 */}
                <div style={styles.formGroup}>
                    <label style={styles.label}>訂單備註:</label>
                    <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        style={{ ...styles.input, minHeight: '80px' }}
                    />
                </div>

                {/* 總金額 */}
                <div style={{ ...styles.formGroup, textAlign: 'right', fontWeight: 'bold', fontSize: '20px', color: TECH_ACCENT }}>
                    總金額: NT$ {totalAmount.toLocaleString()}
                </div>

                <button
                    type="submit"
                    style={styles.submitButton}
                    disabled={loading}
                >
                    {loading ? '提交中...' : `提交訂單 (NT$ ${totalAmount.toLocaleString()})`}
                </button>
            </form>
        </div>
    );
};

export default OrderFormWeb;