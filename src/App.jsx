// File: src/App.jsx (修正為現代米色主題，適用移動設備)

import React, { useState } from 'react';
import ReportExporter from './components/ReportExporter';
import OrderFormWeb from './components/OrderFormWeb';
import MasterItemManager from './components/MasterItemManager'; 
import './App.css'; 

// === 新增：米色/大地色系配色 ===
const ACCENT_COLOR = '#A0522D';  // 赤褐色/強調色
const BG_PRIMARY = '#FAF0E6';    // 主背景色 (米色)
const TEXT_COLOR = '#333333';    // 主要文字顏色 (深灰)
const BG_SECONDARY = '#FFFFFF';  // 次級背景色 (卡片/按鈕)

function App() {
  const [currentPage, setCurrentPage] = useState('orderInput'); 

  const NavButton = ({ name, targetPage }) => (
    <button
      onClick={() => setCurrentPage(targetPage)}
      style={{
        padding: '10px 15px',
        fontSize: '15px', 
        marginRight: '10px',
        cursor: 'pointer',
        border: `1px solid ${ACCENT_COLOR}`,
        // 活躍狀態使用強調色，非活躍使用次級背景色
        backgroundColor: currentPage === targetPage ? ACCENT_COLOR : BG_SECONDARY,
        color: currentPage === targetPage ? BG_SECONDARY : TEXT_COLOR,
        borderRadius: '8px', // 圓潤風格
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        fontWeight: '600'
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
        padding: '20px', 
        fontFamily: 'Roboto, sans-serif' 
    }}>
      
      {/* 限制最大寬度為手機尺寸 (約 iPhone 16 Pro Max 寬度: 430px) */}
      <div style={{ maxWidth: '430px', margin: '0 auto', padding: '15px', backgroundColor: BG_SECONDARY, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        
        {/* 標題 */}
        <h1 style={{ 
            color: ACCENT_COLOR, 
            borderBottom: `2px solid ${ACCENT_COLOR}30`, 
            paddingBottom: '10px', 
            marginBottom: '20px', 
            textAlign: 'center',
            fontSize: '22px' // 調整標題大小以符合移動設備
        }}>
            鳳城訂單管理系統
        </h1>
        
        {/* 導航欄 */}
        <div style={{ 
            borderBottom: `1px solid #ddd`, 
            paddingBottom: '15px', 
            marginBottom: '25px', 
            textAlign: 'center', 
            display: 'flex', 
            flexDirection: 'column', // 改為垂直排列以適應手機
            gap: '10px' 
        }}>
          <NavButton name="外場訂單輸入" targetPage="orderInput" />
          <NavButton name="訂單報表中心" targetPage="reportExporter" />
          <NavButton name="品項主檔管理" targetPage="masterItemManager" /> 
        </div>

        {/* 內容區塊 */}
        <div style={{ minHeight: '60vh' }}>
          {currentPage === 'orderInput' && <OrderFormWeb />}
          {currentPage === 'reportExporter' && <ReportExporter />}
          {currentPage === 'masterItemManager' && <MasterItemManager />}
        </div>
      </div>
    </div>
  );
}

export default App;