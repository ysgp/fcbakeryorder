// File: src/components/OrderFormWeb.jsx (已修正 Supabase 欄位名稱)

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'; 
import { supabase } from '../supabase';

// === 定義現代簡潔主題顏色 ===
const ACCENT_COLOR = '#6C63FF';    
const BG_PRIMARY = '#1C1C1C';      
const TEXT_COLOR = '#F0F0F0';      
const BG_SECONDARY = '#2C2C2C';    
const ERROR_COLOR = '#F44336';     
const SUCCESS_COLOR = '#4CAF50';   

const initialItem = { item_name: '', quantity: 1 };

const OrderFormWeb = () => {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('欠款'); 
    const [pickupTime, setPickupTime] = useState('');
    const [orderNotes, setOrderNotes] = useState(''); 
    const [orderItems, setOrderItems] = useState([initialItem]); 
    const [masterItems, setMasterItems] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [message, setMessage] = useState('');
    
    // 用於搜尋功能的狀態
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestionsIndex, setShowSuggestionsIndex] = useState(null); 
    const suggestionRefs = useRef([]);


    const itemPriceMap = useMemo(() => {
        // 使用 item.price 來建立價格對應
        return masterItems.reduce((map, item) => {
            map[item.master_items] = item.price; // <--- 修正: 用 master_items 作為 key
            return map;
        }, {});
    }, [masterItems]);


    const fetchMasterItems = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('master_items')
            // 修正: 選擇 master_items (品項名稱) 和 price (價格)
            .select('master_items, price')
            .eq('is_active', true) 
            .order('master_items', { ascending: true }); // <--- 修正: 用 master_items 排序

        if (error) {
            console.error('Error fetching master items:', error);
            setMessage(`錯誤: 無法載入品項主檔 - ${error.message}`);
        } else {
            setMasterItems(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchMasterItems();
    }, [fetchMasterItems]);


    const handleItemChange = (index, field, value) => {
        const newItems = [...orderItems];
        newItems[index][field] = value;
        setOrderItems(newItems);

        if (field === 'item_name') {
            setSearchTerm(value);
            setShowSuggestionsIndex(index);
        }
    };

    const handleAddItem = () => {
        setOrderItems([...orderItems, initialItem]);
    };

    const handleRemoveItem = (index) => {
        if (orderItems.length > 1) {
            const newItems = orderItems.filter((_, i) => i !== index);
            setOrderItems(newItems);
        } else {
            setMessage("至少需要一個訂購品項！");
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleSelectSuggestion = (index, selectedItemName) => {
        const newItems = [...orderItems];
        newItems[index].item_name = selectedItemName;
        // 選擇後將焦點移到數量欄位
        const quantityInput = document.getElementById(`quantity-${index}`);
        if (quantityInput) {
            quantityInput.focus();
        }
        setOrderItems(newItems);
        setShowSuggestionsIndex(null);
    };

    const handleKeyDown = (e, index) => {
        if (showSuggestionsIndex === index) {
            const suggestions = filteredMasterItems;
            if (suggestions.length === 0) return;

            const currentActiveIndex = suggestionRefs.current.findIndex(ref => ref === document.activeElement);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = (currentActiveIndex + 1) % suggestions.length;
                suggestionRefs.current[nextIndex].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = (currentActiveIndex - 1 + suggestions.length) % suggestions.length;
                suggestionRefs.current[prevIndex].focus();
            } else if (e.key === 'Enter' && currentActiveIndex >= 0) {
                e.preventDefault();
                // 修正: 使用 master_items 作為品項名稱
                handleSelectSuggestion(index, suggestions[currentActiveIndex].master_items); 
            }
        }
    };

    const filteredMasterItems = useMemo(() => {
        if (!searchTerm) return [];
        return masterItems.filter(item => 
            // 修正: 用 item.master_items 進行過濾
            item.master_items.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5); 
    }, [masterItems, searchTerm]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!customerName || !customerPhone || orderItems.some(item => !item.item_name || item.quantity <= 0)) {
            setMessage('錯誤: 客戶名稱、電話及所有品項的名稱和數量都為必填！');
            setTimeout(() => setMessage(''), 5000);
            return;
        }

        setIsSubmitting(true);

        const orderData = {
            customer_name: customerName,
            customer_phone: customerPhone,
            payment_status: paymentStatus,
            pickup_time: pickupTime || null, 
            order_notes: orderNotes || null, 
            is_completed: false,
            created_at: new Date().toISOString(),
        };

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (orderError) {
            console.error('Error inserting order:', orderError);
            setMessage(`錯誤: 訂單創建失敗 - ${orderError.message}`);
            setIsSubmitting(false);
            return;
        }

        const orderId = order.order_id;
        const itemInserts = orderItems.map(item => ({
            order_id: orderId,
            item_name: item.item_name,
            quantity: item.quantity,
            // 修正: 從 itemPriceMap 中用 item.item_name 取得價格
            item_price: itemPriceMap[item.item_name] || 0, 
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemInserts);

        if (itemsError) {
            console.error('Error inserting order items:', itemsError);
            setMessage(`錯誤: 品項新增失敗 (訂單已建立) - ${itemsError.message}`);
        } else {
            setMessage('✅ 訂單成功送出！');
            // 重置表單
            setCustomerName('');
            setCustomerPhone('');
            setPaymentStatus('欠款');
            setPickupTime('');
            setOrderNotes('');
            setOrderItems([initialItem]);
        }

        setIsSubmitting(false);
        setTimeout(() => setMessage(''), 5000);
    };

    // ... (樣式代碼保持不變) ...
    // 現代簡潔樣式
    const formStyle = {
        formContainer: {
            backgroundColor: BG_SECONDARY, 
            padding: '30px',
            borderRadius: '10px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)', 
            maxWidth: '600px',
            margin: '0 auto',
        },
        title: {
            color: ACCENT_COLOR,
            textAlign: 'center',
            marginBottom: '30px',
            fontSize: '24px',
            borderBottom: `2px solid ${ACCENT_COLOR}30`,
            paddingBottom: '10px'
        },
        inputGroup: {
            marginBottom: '20px',
            borderBottom: `1px solid #444`, 
            paddingBottom: '15px',
        },
        label: {
            display: 'block',
            marginBottom: '8px',
            color: TEXT_COLOR,
            fontWeight: 'bold',
        },
        input: {
            padding: '12px',
            border: 'none', 
            borderRadius: '6px', 
            backgroundColor: BG_PRIMARY, 
            color: TEXT_COLOR,
            width: '100%',
            boxSizing: 'border-box',
            fontSize: '16px',
            marginTop: '8px',
            transition: 'background-color 0.2s',
        },
        select: {
            padding: '12px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: BG_PRIMARY,
            color: TEXT_COLOR,
            width: '100%',
            boxSizing: 'border-box',
            fontSize: '16px',
            marginTop: '8px',
            appearance: 'none', 
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(TEXT_COLOR)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            backgroundSize: '16px',
        },
        itemRow: {
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            marginBottom: '15px',
            position: 'relative',
        },
        itemNameContainer: {
            flex: 3,
            position: 'relative',
        },
        itemQuantityContainer: {
            flex: 1,
        },
        removeButton: {
            backgroundColor: ERROR_COLOR,
            color: 'white',
            border: 'none',
            padding: '8px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
            height: '42px', 
            alignSelf: 'flex-end',
        },
        addButton: {
            backgroundColor: SUCCESS_COLOR,
            color: 'white', 
            border: 'none',
            padding: '12px 18px',
            borderRadius: '8px', 
            cursor: 'pointer',
            width: '100%',
            marginTop: '15px',
            marginBottom: '20px',
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'background-color 0.2s, box-shadow 0.2s',
            boxShadow: `0 2px 10px ${SUCCESS_COLOR}50`,
        },
        submitButton: {
            backgroundColor: ACCENT_COLOR, 
            color: 'white', 
            border: 'none',
            padding: '18px',
            borderRadius: '10px', 
            cursor: 'pointer',
            width: '100%',
            fontSize: '20px',
            fontWeight: 'bold',
            boxShadow: `0 4px 20px ${ACCENT_COLOR}80`, 
            transition: 'background-color 0.2s, box-shadow 0.2s, opacity 0.3s',
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
        suggestionBox: {
            position: 'absolute',
            top: 'calc(100% + 5px)', 
            left: 0,
            right: 0,
            zIndex: 10,
            backgroundColor: BG_SECONDARY,
            border: `1px solid ${ACCENT_COLOR}50`, 
            borderRadius: '8px', 
            marginTop: '5px',
            maxHeight: '200px',
            overflowY: 'auto',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
        },
        suggestionItem: {
            padding: '10px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            color: TEXT_COLOR,
        },
    };

    return (
        <div style={formStyle.formContainer}>
            <h2 style={formStyle.title}>外場訂單輸入</h2>
            
            {message && (
                <div style={formStyle.messageBox(message.includes('錯誤') ? 'error' : 'success')}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={formStyle.inputGroup}>
                    <label style={formStyle.label}>客戶名稱</label>
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        style={formStyle.input}
                        placeholder="請輸入客戶名稱"
                    />
                </div>

                <div style={formStyle.inputGroup}>
                    <label style={formStyle.label}>聯絡電話</label>
                    <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        style={formStyle.input}
                        placeholder="請輸入客戶電話"
                    />
                </div>

                <div style={formStyle.inputGroup}>
                    <label style={formStyle.label}>付款狀態</label>
                    <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        style={formStyle.select}
                    >
                        <option value="已付款">✅ 已付款</option>
                        <option value="欠款">⏳ 欠款</option>
                    </select>
                </div>

                <div style={formStyle.inputGroup}>
                    <label style={formStyle.label}>取貨時間 (可選)</label>
                    <input
                        type="datetime-local"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        style={formStyle.input}
                    />
                </div>
                
                <div style={formStyle.inputGroup}>
                    <label style={formStyle.label}>訂單備註 (可選)</label>
                    <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        style={{ ...formStyle.input, resize: 'vertical', minHeight: '80px' }}
                        placeholder="輸入訂單備註..."
                    />
                </div>

                <h3 style={{ color: ACCENT_COLOR, marginTop: '30px', marginBottom: '20px' }}>訂購品項</h3>
                {orderItems.map((item, index) => (
                    <div key={index} style={formStyle.itemRow}>
                        
                        <div style={formStyle.itemNameContainer}>
                            <input
                                id={`item-name-${index}`}
                                type="text"
                                value={item.item_name}
                                onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                onFocus={() => setShowSuggestionsIndex(index)}
                                onBlur={() => setTimeout(() => setShowSuggestionsIndex(null), 200)} 
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                style={formStyle.input}
                                placeholder="品項名稱"
                                autoComplete="off"
                            />
                            {/* 品項名稱建議清單 */}
                            {showSuggestionsIndex === index && filteredMasterItems.length > 0 && (
                                <div style={formStyle.suggestionBox}>
                                    {filteredMasterItems.map((sItem, sIndex) => (
                                        <div
                                            key={sIndex}
                                            tabIndex={0}
                                            ref={el => suggestionRefs.current[sIndex] = el}
                                            // 修正: 使用 sItem.master_items 作為品項名稱
                                            onMouseDown={() => handleSelectSuggestion(index, sItem.master_items)} 
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    // 修正: 使用 sItem.master_items 作為品項名稱
                                                    handleSelectSuggestion(index, sItem.master_items);
                                                }
                                            }}
                                            style={{ 
                                                ...formStyle.suggestionItem,
                                                backgroundColor: sIndex === suggestionRefs.current.findIndex(ref => ref === document.activeElement) ? `${ACCENT_COLOR}30` : BG_SECONDARY,
                                            }}
                                        >
                                            {/* 修正: 顯示 sItem.master_items 和 sItem.price */}
                                            {sItem.master_items} (NT${sItem.price}) 
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={formStyle.itemQuantityContainer}>
                            <input
                                id={`quantity-${index}`}
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                style={formStyle.input}
                                placeholder="數量"
                            />
                        </div>
                        
                        {orderItems.length > 1 && (
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                style={formStyle.removeButton}
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={handleAddItem}
                    style={formStyle.addButton}
                >
                    + 新增品項
                </button>

                <button
                    type="submit"
                    style={{ ...formStyle.submitButton, opacity: isSubmitting ? 0.6 : 1 }}
                    disabled={isSubmitting || loading}
                >
                    {isSubmitting ? '送出中...' : '送出訂單'}
                </button>
            </form>
        </div>
    );
};

export default OrderFormWeb;