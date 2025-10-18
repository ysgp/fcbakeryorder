import React, { useState } from 'react';
import { supabase } from '../supabase';

const TECH_ACCENT = '#A0522D'; // 土褐色 (Sienna)
const BG_PRIMARY = '#FFF8E1'; // 乳米色 (Creamy Beige)
const TEXT_COLOR = '#4E342E'; // 深棕色 (Dark Brown)
const BG_SECONDARY = '#F5E3C8'; // 淺棕色 (Light Tan)
const ERROR_COLOR = '#D32F2F'; // 紅色
const SUCCESS_COLOR = '#689F38'; // 青綠色

const styles = {
    container: {
        maxWidth: '400px',
        margin: '50px auto',
        padding: '20px',
        border: `1px solid ${BG_SECONDARY}`,
        borderRadius: '8px',
        backgroundColor: BG_PRIMARY,
        boxShadow: `0 4px 12px ${TEXT_COLOR}20`,
    },
    title: {
        textAlign: 'center',
        color: TECH_ACCENT,
        marginBottom: '20px',
        borderBottom: `2px solid ${TECH_ACCENT}`,
        paddingBottom: '10px',
    },
    inputGroup: {
        marginBottom: '15px',
    },
    label: {
        display: 'block',
        marginBottom: '5px',
        fontWeight: 'bold',
        color: TEXT_COLOR,
    },
    input: {
        width: '100%',
        padding: '10px',
        border: `1px solid ${TECH_ACCENT}50`,
        borderRadius: '4px',
        boxSizing: 'border-box',
        backgroundColor: 'white',
        color: TEXT_COLOR,
    },
    button: {
        width: '100%',
        padding: '10px',
        backgroundColor: TECH_ACCENT,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        transition: 'background-color 0.2s',
        marginTop: '10px',
    },
    buttonSecondary: {
        backgroundColor: BG_SECONDARY,
        color: TEXT_COLOR,
        border: `1px solid ${TECH_ACCENT}`,
    },
    message: {
        padding: '10px',
        borderRadius: '4px',
        marginTop: '15px',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    errorMessage: {
        backgroundColor: `${ERROR_COLOR}20`,
        color: ERROR_COLOR,
        border: `1px solid ${ERROR_COLOR}`,
    },
    successMessage: {
        backgroundColor: `${SUCCESS_COLOR}20`,
        color: SUCCESS_COLOR,
        border: `1px solid ${SUCCESS_COLOR}`,
    },
    toggleLink: {
        textAlign: 'center',
        marginTop: '15px',
        color: TEXT_COLOR,
        cursor: 'pointer',
        textDecoration: 'underline',
        fontSize: '14px',
    }
};

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [isError, setIsError] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setIsError(false);

        let response;
        if (isLogin) {
            // 登入
            response = await supabase.auth.signInWithPassword({ email, password });
        } else {
            // 註冊
            response = await supabase.auth.signUp({ email, password });
        }

        setLoading(false);

        if (response.error) {
            setMessage(response.error.message);
            setIsError(true);
        } else if (isLogin) {
            setMessage('登入成功!');
            setIsError(false);
        } else {
            setMessage('註冊成功! 請檢查您的電子郵件以完成驗證。');
            setIsError(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>{isLogin ? '用戶登入' : '註冊新用戶'}</h2>
            <form onSubmit={handleAuth}>
                <div style={styles.inputGroup}>
                    <label style={styles.label} htmlFor="email">電子郵件:</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={styles.input}
                    />
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label} htmlFor="password">密碼:</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="密碼 (至少6位)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={styles.input}
                    />
                </div>
                <button
                    type="submit"
                    style={styles.button}
                    disabled={loading}
                >
                    {loading ? '處理中...' : (isLogin ? '登入' : '註冊')}
                </button>
            </form>

            {message && (
                <div style={{ ...styles.message, ...(isError ? styles.errorMessage : styles.successMessage) }}>
                    {message}
                </div>
            )}

            <p
                style={styles.toggleLink}
                onClick={() => {
                    setIsLogin(!isLogin);
                    setMessage(null);
                    setEmail('');
                    setPassword('');
                }}
            >
                {isLogin ? '還沒有帳號? 點此註冊' : '已有帳號? 點此登入'}
            </p>
        </div>
    );
};

export default Auth;