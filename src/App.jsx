// File: src/App.jsx (新增「品項主檔管理」切換按鈕 & 手機優化 - 大地色系)

import React, { useState } from 'react';
import ReportExporter from './components/ReportExporter';
import OrderFormWeb from './components/OrderFormWeb';
import MasterItemManager from './components/MasterItemManager'; // 引入新的組件
import './App.css'; 

const TECH_ACCENT = '#A0522D'; // 土褐色 (Sienna)
const BG_PRIMARY = '#FFF8E1'; // 乳米色 (Creamy Beige)
const TEXT_COLOR = '#4E342E'; // 深棕色 (Dark Brown)
const BG_SECONDARY = '#F5E3C8'; // 淺棕色 (Light Tan)


function App() {
  // 新增一個頁面狀態：'masterItemManager'
  const [currentPage, setCurrentPage] = useState('orderInput'); 

  const NavButton = ({ name, targetPage }) => (
    <button
      onClick={() => setCurrentPage(targetPage)}
      style={{
        padding: '8px 10px', // 調整 padding
        fontSize: '14px', // 調整字體大小
        marginRight: '0', // 移除間距，改用 gap
        cursor: 'pointer',
        border: `1px solid ${TECH_ACCENT}`,
        backgroundColor: currentPage === targetPage ? TECH_ACCENT : BG_SECONDARY,
        color: currentPage === targetPage ? BG_PRIMARY : TEXT_COLOR,
        borderRadius: '4px', // 調整圓角
        boxShadow: currentPage === targetPage ? `0 0 8px ${TECH_ACCENT}` : 'none', 
        transition: 'all 0.3s ease-in-out',
        fontWeight: 'bold',
        flex: 1, 
        minWidth: 'auto', // 確保按鈕在小螢幕上可以縮小
        textAlign: 'center'
      }}
    >
      {name}
    </button>
  );

  return (
    <div style={{ 
        backgroundColor: BG_PRIMARY, 
        color: TEXT_COLOR, 
        minHeight: '100vh', 
        padding: '10px', // 減少整體 padding
        fontFamily: 'Roboto, sans-serif' 
    }}>
      
      <div style={{ maxWidth: '100%', margin: '0 auto' }}> {/* 適應手機寬度 */}
        {/* 標題 */}
        <h1 style={{ color: TECH_ACCENT, borderBottom: `2px solid ${TECH_ACCENT}`, paddingBottom: '10px', marginBottom: '15px', textAlign: 'center', fontSize: '22px' }}>
            鳳城訂單管理系統 (大地版)
        </h1>
        
        {/* 導航欄 - 包含品項管理 */}
        <div style={{ borderBottom: `1px solid ${BG_SECONDARY}`, paddingBottom: '10px', marginBottom: '15px', textAlign: 'center', display: 'flex', gap: '5px' }}> {/* 減少 gap */}
          <NavButton name="訂單輸入 (A)" targetPage="orderInput" />
          <NavButton name="報表中心 (B)" targetPage="reportExporter" />
          <NavButton name="品項管理" targetPage="masterItemManager" /> 
        </div>

        {/* 內容區塊：確保內容可以全寬顯示 */}
        <div style={{ display: 'flex', minHeight: '80vh' }}>
          {currentPage === 'orderInput' && (
            <div style={{ flex: 1, padding: 0 }}> {/* 移除內邊距 */}
              <OrderFormWeb />
            </div>
          )}
          {currentPage === 'reportExporter' && (
            <div style={{ flex: 1, padding: 0 }}>
              <ReportExporter />
            </div>
          )}
          {currentPage === 'masterItemManager' && (
            <div style={{ flex: 1, padding: 0 }}>
              <MasterItemManager />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;