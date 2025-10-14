// File: src/components/OrderFormWeb.jsx (已新增品項搜尋功能)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabase';

// 定義科技主題顏色
const TECH_ACCENT = '#00CED1';
const BG_PRIMARY = '#121212';
const TEXT_COLOR = '#E0E0E0';
const BG_SECONDARY = '#1E1E1E';
const ERROR_COLOR = '#FF4444';
const SUCCESS_COLOR = '#00BFA5';

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
        return masterItems.reduce((map, item) => {
            map[item.name_zh] = item.price;
            return map;
        }, {});
    }, [masterItems]);

    // 1. 載入**已啟用**的品項主檔和價格
    useEffect(() => {
        const fetchMasterItems = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('master_items')
                .select('name_zh, price') 
                .eq('is_active', true) // 確保只載入啟用的品項
                .order('name_zh', { ascending: true }); // 按名稱排序

            if (error) {
                console.error('Error fetching master items:', error);
                setMessage('錯誤：無法載入品項清單 (' + error.message + ')');
            } else {
                setMasterItems(data);
            }
            setLoading(false);
        };
        fetchMasterItems();
    }, []);

    // 2. 計算訂單總價
    const totalAmount = useMemo(() => {
        return orderItems.reduce((total, item) => {
            const price = itemPriceMap[item.item_name] || 0;
            return total + (price * item.quantity);
        }, 0);
    }, [orderItems, itemPriceMap]);


    // 處理品項列表的變動
    const handleItemChange = (index, field, value) => {
        const newItems = [...orderItems];
        if (field === 'quantity') {
            newItems[index][field] = Math.max(0, parseInt(value) || 0); 
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setOrderItems(newItems);
    };

    // 處理品項名稱輸入 (用於搜尋)
    const handleItemNameInput = (index, value) => {
        handleItemChange(index, 'item_name', value);
        setShowSuggestionsIndex(index); 
        setSearchTerm(value);
    };
    
    // 選擇建議品項
    const handleSelectSuggestion = (index, itemName) => {
        handleItemChange(index, 'item_name', itemName);
        setShowSuggestionsIndex(null); // 關閉建議列表
    };
    
    // 根據當前輸入過濾品項建議
    const getSuggestions = (currentInput) => {
        if (!currentInput) return masterItems;
        return masterItems.filter(item =>
            item.name_zh.toLowerCase().includes(currentInput.toLowerCase())
        ).slice(0, 10); // 限制只顯示前10個
    };

    const addItem = () => {
        setOrderItems([...orderItems, { ...initialItem }]);
        // 新增後，將焦點移到新項目的搜尋框
        setTimeout(() => {
            if (suggestionRefs.current[orderItems.length]) {
                 suggestionRefs.current[orderItems.length].focus();
            }
        }, 0);
    };
    
    const removeItem = (index) => {
        const newItems = orderItems.filter((_, i) => i !== index);
        setOrderItems(newItems.length > 0 ? newItems : [{ ...initialItem }]); 
        setShowSuggestionsIndex(null); 
    };
    
    const resetForm = () => {
        setCustomerName('');
        setCustomerPhone('');
        setPaymentStatus('欠款');
        setPickupTime('');
        setOrderNotes('');
        setOrderItems([{ ...initialItem }]); 
        setShowSuggestionsIndex(null); 
    };

    // 3. 送出訂單到 Supabase
    const handleSubmit = async (e) => {
        e.preventDefault(); 
        if (isSubmitting) return;

        // 確保選定的品項名稱是有效的 (即存在於 masterItems 中)
        const validItems = orderItems.filter(item => 
            itemPriceMap[item.item_name] !== undefined && item.quantity > 0
        );
        
        if (!customerName || !customerPhone || validItems.length === 0) {
            setMessage('請填寫完整的顧客資訊和至少一項有效品項及數量。');
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        const newOrder = {
            customer_last_name: customerName,
            customer_phone: customerPhone,
            payment_status: paymentStatus,
            pickup_date: new Date().toISOString().split('T')[0], 
            pickup_time: pickupTime,
            order_notes: orderNotes,
            items_list: validItems.map(item => ({
                ...item,
                price: itemPriceMap[item.item_name] || 0
            })),
            total_amount: totalAmount, 
        };

        const { data, error } = await supabase
            .from('orders')
            .insert([newOrder])
            .select(); 

        if (error) {
            console.error('Error inserting order:', error);
            setMessage(`訂單建立失敗：${error.message}`);
        } else {
            const insertedOrder = data[0];
            setMessage(`[成功] 資料傳輸完成！訂單編號: ${insertedOrder.order_id.substring(0, 8)}。 總金額: $${totalAmount.toFixed(0)}。`);
            resetForm(); 
        }
        setIsSubmitting(false);
    };

    if (loading) {
        return <div style={{padding: '20px', textAlign: 'center', color: TECH_ACCENT}}>載入核心數據中...</div>;
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>鳳城麵包店電子訂單 (A節點)</h2>
            
            {message && (
                <div style={{...styles.messageBox, backgroundColor: message.includes('成功') ? SUCCESS_COLOR + '30' : ERROR_COLOR + '30', borderColor: message.includes('成功') ? SUCCESS_COLOR : ERROR_COLOR}}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                
                {/* 顧客資訊 */}
                <label style={styles.label}>顧客資訊</label>
                <input type="text" placeholder="顧客姓氏 (例如: 王)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={styles.input} required/>
                <input type="tel" placeholder="顧客電話" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={styles.input} required/>

                {/* 訂單狀態 */}
                <label style={styles.label}>訂單與付款狀態</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={{...styles.input, ...styles.select, flex: 1}}>
                        <option value="欠款">欠款</option>
                        <option value="已付清">已付清</option>
                        <option value="定金">定金</option>
                    </select>

                    <input type="text" placeholder="預取時間 (例如: 15:00)" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} style={{...styles.input, flex: 1}} />
                </div>
                
                {/* 訂單備註 */}
                <textarea placeholder="訂單備註/特殊需求" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} style={styles.textarea}/>

                <h3 style={styles.sectionHeader}>品項清單</h3>
                
                {orderItems.map((item, index) => {
                    const price = itemPriceMap[item.item_name] || 0;
                    const subtotal = price * item.quantity;
                    const suggestions = getSuggestions(item.item_name);

                    return (
                        <div key={index} style={styles.itemRowContainer}>
                            
                            {/* 品項搜尋框 */}
                            <div style={{ flex: 3, marginRight: '10px', position: 'relative' }}>
                                <input 
                                    type="text"
                                    placeholder="輸入品項名稱搜尋..."
                                    value={item.item_name}
                                    onChange={(e) => handleItemNameInput(index, e.target.value)}
                                    onFocus={() => setShowSuggestionsIndex(index)}
                                    onBlur={() => setTimeout(() => setShowSuggestionsIndex(null), 200)} // 延遲關閉，允許點擊
                                    style={{...styles.input, marginBottom: '0'}}
                                    ref={el => suggestionRefs.current[index] = el}
                                    required
                                />
                                
                                {/* 建議列表 */}
                                {showSuggestionsIndex === index && suggestions.length > 0 && (
                                    <div style={styles.suggestionBox}>
                                        {suggestions.map((suggestion, i) => (
                                            <div 
                                                key={i} 
                                                style={styles.suggestionItem}
                                                onClick={() => handleSelectSuggestion(index, suggestion.name_zh)}
                                            >
                                                {suggestion.name_zh} (${suggestion.price})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* 數量輸入 */}
                            <input
                                type="number"
                                placeholder="數量"
                                value={item.quantity === 0 ? '' : item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                style={{...styles.input, flex: 1, textAlign: 'center', marginRight: '10px', marginBottom: '0'}}
                                min="1"
                                required
                            />

                            {/* 小計顯示 */}
                            <div style={styles.subtotalDisplay}>
                                ${subtotal.toFixed(0)}
                            </div>
                            
                            {/* 移除按鈕 */}
                            {orderItems.length > 1 && (
                                <button 
                                    type="button"
                                    onClick={() => removeItem(index)} 
                                    style={styles.removeButton}
                                >
                                    X
                                </button>
                            )}
                        </div>
                    );
                })}
                
                <button type="button" onClick={addItem} style={styles.addButton}>
                    + 增加品項
                </button>

                {/* 總金額顯示 */}
                <div style={styles.totalDisplay}>
                    訂單總金額: <span style={{ fontWeight: 'bold', fontSize: '28px', color: TECH_ACCENT }}>${totalAmount.toFixed(0)}</span>
                </div>
                
                <button type="submit" disabled={isSubmitting} style={styles.submitButton}>
                    {isSubmitting ? '資料傳輸中...' : `確認送出訂單 ($${totalAmount.toFixed(0)})`}
                </button>
            </form>
        </div>
    );
};

// 科技感 CSS 樣式 (新增搜尋建議的樣式)
const styles = {
    container: { 
        padding: '30px', 
        maxWidth: '550px', 
        margin: '20px auto', 
        backgroundColor: BG_SECONDARY, 
        borderRadius: '12px', 
        boxShadow: `0 0 20px ${TECH_ACCENT}33`, 
        border: `1px solid ${TECH_ACCENT}55`, 
    },
    header: { 
        fontSize: '28px', 
        marginBottom: '20px', 
        textAlign: 'center', 
        color: TECH_ACCENT,
        borderBottom: `2px dashed ${TECH_ACCENT}50`, 
        paddingBottom: '15px' 
    },
    input: { 
        width: '100%', 
        padding: '12px', 
        marginBottom: '15px', 
        border: `1px solid ${TECH_ACCENT}50`, 
        borderRadius: '6px', 
        backgroundColor: BG_PRIMARY, 
        color: TEXT_COLOR,
        boxSizing: 'border-box',
        fontSize: '16px',
    },
    textarea: {
        width: '100%', 
        padding: '12px', 
        marginBottom: '15px', 
        border: `1px solid ${TECH_ACCENT}50`, 
        borderRadius: '6px',
        minHeight: '100px',
        backgroundColor: BG_PRIMARY,
        color: TEXT_COLOR,
        boxSizing: 'border-box',
        fontSize: '16px',
    },
    select: {
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23${TECH_ACCENT.substring(1)}' class='bi bi-chevron-down' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        paddingRight: '30px',
    },
    label: { 
        display: 'block', 
        marginBottom: '8px', 
        fontWeight: 'bold',
        color: TECH_ACCENT,
    },
    sectionHeader: { 
        fontSize: '20px', 
        marginTop: '25px', 
        marginBottom: '15px', 
        color: TEXT_COLOR,
        borderBottom: `1px solid ${TECH_ACCENT}50`, 
        paddingBottom: '5px' 
    },
    itemRowContainer: { 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '15px',
        position: 'relative', // 確保建議列表可以絕對定位
    },
    subtotalDisplay: {
        flexShrink: 0,
        width: '80px',
        textAlign: 'right',
        fontWeight: 'bold',
        fontSize: '18px',
        marginRight: '10px',
        color: SUCCESS_COLOR, 
    },
    totalDisplay: {
        textAlign: 'right',
        fontSize: '20px',
        padding: '15px 0',
        borderTop: `2px solid ${TECH_ACCENT}`,
        marginTop: '20px',
        marginBottom: '15px',
        color: TEXT_COLOR,
    },
    removeButton: {
        backgroundColor: ERROR_COLOR,
        color: 'white',
        border: 'none',
        padding: '10px',
        borderRadius: '6px',
        cursor: 'pointer',
        width: '40px',
        height: '40px',
        flexShrink: 0,
        transition: 'background-color 0.2s',
        fontWeight: 'bold',
    },
    addButton: {
        backgroundColor: SUCCESS_COLOR,
        color: BG_PRIMARY,
        border: 'none',
        padding: '12px',
        borderRadius: '6px',
        cursor: 'pointer',
        width: '100%',
        marginTop: '15px',
        marginBottom: '20px',
        fontWeight: 'bold',
        transition: 'background-color 0.2s, box-shadow 0.2s',
    },
    submitButton: {
        backgroundColor: TECH_ACCENT,
        color: BG_PRIMARY,
        border: 'none',
        padding: '18px',
        borderRadius: '6px',
        cursor: 'pointer',
        width: '100%',
        fontSize: '20px',
        fontWeight: 'bold',
        boxShadow: `0 0 15px ${TECH_ACCENT}`, 
        transition: 'background-color 0.2s, box-shadow 0.2s',
    },
    messageBox: {
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '20px',
        border: '1px solid',
        fontWeight: 'bold',
        color: TEXT_COLOR
    },
    suggestionBox: {
        position: 'absolute',
        top: '100%', // 位於輸入框下方
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: BG_SECONDARY,
        border: `1px solid ${TECH_ACCENT}`,
        borderRadius: '6px',
        marginTop: '5px',
        maxHeight: '200px',
        overflowY: 'auto',
        boxShadow: `0 5px 15px ${BG_PRIMARY}99`,
    },
    suggestionItem: {
        padding: '10px',
        cursor: 'pointer',
        borderBottom: `1px solid ${BG_PRIMARY}`,
        color: TEXT_COLOR,
        fontSize: '14px',
    }
};

export default OrderFormWeb;