// File: src/App.jsx (新增「品項主檔管理」切換按鈕)

import React, { useState } from 'react';
import ReportExporter from './components/ReportExporter';
import OrderFormWeb from './components/OrderFormWeb';
import MasterItemManager from './components/MasterItemManager'; // 引入新的組件
import './App.css'; 

const TECH_ACCENT = '#00CED1'; // 科技感青色作為強調色
const BG_PRIMARY = '#121212';  // 主背景色
const TEXT_COLOR = '#E0E0E0';  // 主要文字顏色
const BG_SECONDARY = '#1E1E1E';// 次級背景色 (用於卡片/按鈕)


function App() {
  // 新增一個頁面狀態：'masterItemManager'
  const [currentPage, setCurrentPage] = useState('orderInput'); 

  const NavButton = ({ name, targetPage }) => (
    <button
      onClick={() => setCurrentPage(targetPage)}
      style={{
        padding: '10px 15px',
        fontSize: '15px', // 調整字體大小以容納三個按鈕
        marginRight: '15px',
        cursor: 'pointer',
        border: `1px solid ${TECH_ACCENT}`,
        backgroundColor: currentPage === targetPage ? TECH_ACCENT : BG_SECONDARY,
        color: currentPage === targetPage ? BG_PRIMARY : TEXT_COLOR,
        borderRadius: '6px',
        boxShadow: currentPage === targetPage ? `0 0 10px ${TECH_ACCENT}` : 'none', 
        transition: 'all 0.3s ease-in-out',
        fontWeight: 'bold',
        flex: 1, // 讓按鈕平均分配空間
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
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 標題 */}
        <h1 style={{ color: TECH_ACCENT, borderBottom: `2px solid ${TECH_ACCENT}`, paddingBottom: '10px', marginBottom: '20px', textAlign: 'center' }}>
            鳳城訂單管理系統 (科技版)
        </h1>
        
        {/* 導航欄 - 包含品項管理 */}
        <div style={{ borderBottom: `1px solid ${BG_SECONDARY}`, paddingBottom: '15px', marginBottom: '25px', textAlign: 'center', display: 'flex', gap: '10px' }}>
          <NavButton name="外場訂單輸入 (A節點)" targetPage="orderInput" />
          <NavButton name="訂單報表中心 (B節點)" targetPage="reportExporter" />
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