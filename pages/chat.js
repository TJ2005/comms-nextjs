import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';
import chatStyles from '../styles/chat.module.css';
import { editMessage } from '@/src/server/database';

// WhatsApp-style Dropdown Menu Module
const DropdownMenu = ({ isOpen, anchorRef, items }) => {
    const dropdownRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0, placement: 'top' });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
                anchorRef.current && !anchorRef.current.contains(event.target)) {
                items[0].onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [anchorRef, items]);

    useEffect(() => {
        if (isOpen && anchorRef.current) {
            calculatePosition();
            // Recalculate on window resize
            window.addEventListener('resize', calculatePosition);
            return () => window.removeEventListener('resize', calculatePosition);
        }
    }, [isOpen]);

    const calculatePosition = () => {
        if (!anchorRef.current || !dropdownRef.current) return;
        
        const anchorRect = anchorRef.current.getBoundingClientRect();
        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        
        // Check if there's enough space above
        const spaceAbove = anchorRect.top;
        const spaceBelow = window.innerHeight - anchorRect.bottom;
        const dropdownHeight = dropdownRect.height || 100; // Default height assumption if not yet rendered
        
        let newPosition = {};
        
        // Prefer showing above (WhatsApp style) if there's enough space
        if (spaceAbove >= dropdownHeight || spaceAbove > spaceBelow) {
            // Position above the anchor
            newPosition = {
                top: anchorRect.top - dropdownHeight,
                left: anchorRect.left - dropdownRect.width + anchorRect.width,
                placement: 'top'
            };
        } else {
            // Position below the anchor
            newPosition = {
                top: anchorRect.bottom,
                left: anchorRect.left - dropdownRect.width + anchorRect.width,
                placement: 'bottom'
            };
        }
        
        // Ensure the dropdown doesn't go off-screen horizontally
        if (newPosition.left < 0) {
            newPosition.left = 0;
        } else if (newPosition.left + dropdownRect.width > window.innerWidth) {
            newPosition.left = window.innerWidth - dropdownRect.width;
        }
        
        setPosition(newPosition);
    };

    if (!isOpen) return null;

    return (
        <div 
            ref={dropdownRef}
            className={`${chatStyles.dropdownMenu} ${isOpen ? chatStyles.active : ''} ${position.placement === 'top' ? chatStyles.dropdownTop : chatStyles.dropdownBottom}`}
            style={{
                position: 'fixed',
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: 'none'
            }}
        >
            {items.map((item, idx) => (
                <button 
                    key={idx} 
                    className={chatStyles.dropdownMenuItem}
                    onClick={() => {
                        item.onClick();
                        item.onClose();
                    }}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
};

// Single Message Component
const Message = ({ msg, index }) => {
    const isSender = msg.username === localStorage.getItem('username');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownAnchorRef = useRef(null);

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => console.log('Copied to clipboard:', text))
            .catch(err => console.error('Copy failed:', err));
    };

    const dropdownItems = [
        {
            label: 'Copy Message',
            onClick: () => handleCopy(msg.content),
            onClose: () => setIsDropdownOpen(false)
        },
        {
            label: 'Edit',
            onClick: () => {
                console.log('Edit message:', msg.content)
                editMessage(msg.messageId, msg.content)
                    .then(() => console.log('Message edited successfully'))
                    .catch(err => console.error('Error editing message:', err));
            },
            onClose: () => setIsDropdownOpen(false)
        },
        {
            label: 'Delete',
            onClick: () => console.log('Delete message:', msg.content),
            onClose: () => setIsDropdownOpen(false)
        },
        {
            label: 'Reply',
            onClick: () => console.log('Reply to:', msg.username),
            onClose: () => setIsDropdownOpen(false)
        },
        {
            label: 'Forward',
            onClick: () => console.log('Forward message:', msg.content),
            onClose: () => setIsDropdownOpen(false)
        }
    ];

    return (
        <motion.div
            className={`${chatStyles.messageWrapper} ${isSender ? chatStyles.sent : chatStyles.received}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ flexDirection: isSender ? 'row-reverse' : 'row' }}
        >
            <div className={chatStyles.message} style={{ flexDirection: isSender ? 'row-reverse' : 'row' }}>
                <div className={chatStyles.pfpContainer}>
                    <img src={msg.pfp} alt="PFP" className={chatStyles.pfp} />
                </div>
                <div className={chatStyles.messageContent}>
                    <div className={chatStyles.messageMeta}>
                        <strong>{msg.username}</strong>
                        <div 
                            ref={dropdownAnchorRef}
                            className={chatStyles.dropdownContainer} 
                            onClick={toggleDropdown}
                        >
                            <FaChevronDown className={chatStyles.dropdownIcon} />
                        </div>
                    </div>
                    <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                const codeString = String(children).replace(/\n$/, '');
                                return !inline && match ? (
                                    <div style={{ position: 'relative' }}>
                                        <button onClick={() => handleCopy(codeString)} className={chatStyles.copyButton}>
                                            Copy
                                        </button>
                                        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div">
                                            {match[1] + "\n \n" + codeString}
                                        </SyntaxHighlighter>
                                    </div>
                                ) : (
                                    <code className={className} {...props}>{children}</code>
                                );
                            }
                        }}
                    >
                        {msg.content}
                    </ReactMarkdown>
                    
                    <DropdownMenu 
                        isOpen={isDropdownOpen} 
                        anchorRef={dropdownAnchorRef} 
                        items={dropdownItems} 
                    />
                </div>
            </div>
        </motion.div>
    );
};

// Main Chat Component
export default function Chat() {
    const [user, setUser] = useState(null);
    const [sessionCode, setSessionCode] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [username, setUsername] = useState('');
    const messagesEndRef = useRef(null);
    const ws = useRef(null);

    useEffect(() => {
        setUser(localStorage.getItem('user') || 'Guest');
        setSessionCode(localStorage.getItem('sessionCode'));
        setUsername(localStorage.getItem('username'));
    }, []);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch('/api/fetchChatMessages');
                const data = await response.json();
                if (response.ok && data.messages) {
                    setMessages(data.messages);
                }
                console.log('Fetched messages:', data.messages);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };
        fetchMessages();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!sessionCode) return;

        ws.current = new WebSocket('ws://localhost:8080');

        ws.current.onopen = () => console.log('WebSocket connected');
        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);
            setMessages((prev) => [...prev, message]);
        };
        ws.current.onerror = (error) => console.error('WebSocket error:', error);
        ws.current.onclose = () => console.log('WebSocket closed');

        return () => {
            ws.current.close();
        };
    }, [sessionCode]);

    const sendMessage = () => {
        if (!input.trim()) return;

        const message = {
            content: input,
            username: username,
            messageType: 'text',
            pfp: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1200px-Default_pfp.svg.png",
            timestamp: new Date().toISOString(),
        };

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        }
        setInput('');
    };

    return (
        <div className={chatStyles.container}>
            <Head>
                <title>Chat Page</title>
            </Head>
            <div className={chatStyles.codeContainer}>
                <p>Code: {sessionCode || 'Not available'}</p>
            </div>
            <div className={chatStyles.chatBox}>
                <div className={chatStyles.chatMessages}>
                    {messages.map((msg, index) => (
                        <Message key={index} msg={msg} index={index} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className={chatStyles.userUtility}>
                    <textarea 
                        className={chatStyles.input} 
                        placeholder="Type a message..." 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();  // Prevents adding a new line
                                sendMessage();
                            }
                        }}
                    ></textarea>
                    <button className={chatStyles.send} onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
}