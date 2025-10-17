// File: src/App.jsx (新增「品項主檔管理」切換按鈕 - 現代簡潔風格)

import React, { useState } from 'react';
import ReportExporter from './components/ReportExporter';
import OrderFormWeb from './components/OrderFormWeb';
import MasterItemManager from './components/MasterItemManager'; // 引入新的組件
import './App.css'; 

// === 定義現代簡潔主題顏色 ===
const ACCENT_COLOR = '#6C63FF';    // 現代藍紫色作為強調色 (取代 TECH_ACCENT)
const BG_PRIMARY = '#1C1C1C';      // 主背景色 (柔和深灰色)
const TEXT_COLOR = '#F0F0F0';      // 主要文字顏色 (更亮)
const BG_SECONDARY = '#2C2C2C';    // 次級背景色/卡片背景
const SUCCESS_COLOR = '#4CAF50';   // 成功色
const ERROR_COLOR = '#F44336';     // 錯誤色


function App() {
  // 新增一個頁面狀態：'masterItemManager'
  const [currentPage, setCurrentPage] = useState('orderInput'); 

  const NavButton = ({ name, targetPage }) => (
    <button
      onClick={() => setCurrentPage(targetPage)}
      style={{
        padding: '10px 20px',
        fontSize: '16px', 
        marginRight: '10px',
        cursor: 'pointer',
        border: 'none', // 移除邊框
        borderRadius: '8px', // 增加圓角
        backgroundColor: currentPage === targetPage ? ACCENT_COLOR : BG_SECONDARY, // 使用新的強調色
        color: currentPage === targetPage ? 'white' : TEXT_COLOR, // 修正為白色以提高對比
        // 新增 subtle shadow
        boxShadow: currentPage === targetPage ? `0 4px 12px ${ACCENT_COLOR}60` : 'none', 
        transition: 'all 0.3s ease',
        fontWeight: 'bold',
      }}
    >
      {name}
    </button>
  );

  const appStyle = {
    backgroundColor: BG_PRIMARY, 
    color: TEXT_COLOR, 
    minHeight: '100vh', 
    padding: '30px', // 增加一些內邊距
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif' // 使用現代字體
  };

  return (
    <div className="App" style={appStyle}>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 標題 - 簡化風格 */}
        <h1 style={{ 
            color: ACCENT_COLOR, 
            paddingBottom: '10px', 
            marginBottom: '30px', 
            textAlign: 'center',
            fontSize: '32px',
            fontWeight: '300' // 較輕的字體
        }}>
            鳳城訂單管理系統
        </h1>
        
        {/* 導航欄 */}
        <div style={{ 
            paddingBottom: '20px', 
            marginBottom: '30px', 
            textAlign: 'center', 
            display: 'flex', 
            gap: '15px', 
            justifyContent: 'center'
        }}>
          <NavButton name="外場訂單輸入" targetPage="orderInput" />
          <NavButton name="訂單報表中心" targetPage="reportExporter" />
          <NavButton name="品項主檔管理" targetPage="masterItemManager" /> 
        </div>

        {/* 內容區塊：新增 MasterItemManager 的渲染邏輯 */}
        <div style={{ display: 'flex', minHeight: '80vh' }}>
          {currentPage === 'orderInput' && (
            <div style={{ flex: 1 }}>
              <OrderFormWeb />
            </div>
          )}
          {currentPage === 'reportExporter' && (
            <div style={{ flex: 1 }}>
              <ReportExporter />
            </div>
          )}
          {currentPage === 'masterItemManager' && (
             <div style={{ flex: 1 }}>
                <MasterItemManager />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;