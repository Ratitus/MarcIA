/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { MessageSquare, Calculator, Languages, Menu, X, Sun, Moon, ChevronLeft, ChevronRight, Plus, MessageCircle, Trash2 } from 'lucide-react';
import ChatView from './components/ChatView';
import CalculatorView from './components/CalculatorView';
import TranslatorView from './components/TranslatorView';
import { ChatSession, ChatMessage } from './types';

export default function App() {
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [activeTab, setActiveTab] = useState("chat");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [chats, setChats] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('marcia_chats');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error parsing chats from localStorage', e);
      return [];
    }
  });
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('marcia_chats', JSON.stringify(chats));
  }, [chats]);

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: 'Nou Xat',
      messages: [{ role: 'model', text: 'Hola! Sóc MarcIA. En què et puc ajudar amb el teu videojoc avui? Si em demanes que creï un joc en HTML, podràs previsualitzar-lo aquí mateix!' }],
      updatedAt: Date.now()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setActiveTab('chat');
    if (window.innerWidth < 768) setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (userName !== null && chats.length === 0) {
      createNewChat();
    } else if (userName !== null && !currentChatId && chats.length > 0) {
      setCurrentChatId(chats[0].id);
    }
  }, [userName, chats.length]);

  const updateChat = (id: string, messages: ChatMessage[], title?: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === id) {
        return {
          ...chat,
          messages,
          title: title || chat.title,
          updatedAt: Date.now()
        };
      }
      return chat;
    }).sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(chats.length > 1 ? chats.find(c => c.id !== id)?.id || null : null);
    }
  };

  if (userName === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full">
          <h1 className="text-3xl font-bold text-emerald-500 mb-4 text-center">Benvingut a MarcIA</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-center">Si us plau, introdueix el teu nom per començar.</p>
          <form onSubmit={(e) => { e.preventDefault(); if(nameInput.trim()) setUserName(nameInput.trim()); }}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="El teu nom..."
              className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-3 mb-4 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isAdmin = userName === 'ADMIN';
  const currentChat = chats.find(c => c.id === currentChatId);

  const tabs = [
    { id: "chat", label: "Xat MarcIA", icon: MessageSquare },
    { id: "translator", label: "Traductor", icon: Languages },
    { id: "calculator", label: "Calculadora", icon: Calculator },
  ];

  return (
    <div className={`flex h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors duration-200`}>
      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex flex-col bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-4 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div>
              <h1 className="text-2xl font-bold text-emerald-500 tracking-tight">MarcIA</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Hola, {userName}</p>
            </div>
          )}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors mx-auto">
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        
        <nav className="flex-1 px-3 space-y-2 mt-4 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center w-full p-3 rounded-xl transition-colors ${
                activeTab === tab.id && activeTab !== 'chat'
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
              } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? tab.label : ''}
            >
              <tab.icon className={`w-5 h-5 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
              {!isSidebarCollapsed && <span className="font-medium">{tab.label}</span>}
            </button>
          ))}

          {!isSidebarCollapsed && (
            <div className="pt-4 pb-2">
              <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Historial</span>
                <button onClick={createNewChat} className="hover:text-emerald-500 transition-colors p-1" title="Nou Xat">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {chats.map(chat => (
                  <div 
                    key={chat.id}
                    onClick={() => {
                      setCurrentChatId(chat.id);
                      setActiveTab('chat');
                    }}
                    className={`flex items-center justify-between w-full p-2 rounded-lg cursor-pointer transition-colors group ${
                      activeTab === 'chat' && currentChatId === chat.id
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center overflow-hidden">
                      <MessageCircle className="w-4 h-4 mr-2 shrink-0" />
                      <span className="text-sm truncate">{chat.title}</span>
                    </div>
                    <button 
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all shrink-0"
                      title="Esborrar Xat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-center shrink-0">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center w-full justify-center"
            title="Canviar Tema"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            {!isSidebarCollapsed && <span className="ml-3 font-medium">Tema {theme === 'light' ? 'Fosc' : 'Clar'}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-50 flex items-center justify-between px-4">
        <h1 className="text-xl font-bold text-emerald-500">MarcIA</h1>
        <div className="flex items-center space-x-2">
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 text-zinc-500">
            {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-zinc-500"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white dark:bg-zinc-950 z-40 flex flex-col p-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center w-full px-4 py-4 rounded-xl transition-colors ${
                activeTab === tab.id && activeTab !== 'chat'
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <tab.icon className="w-6 h-6 mr-4" />
              <span className="font-medium text-lg">{tab.label}</span>
            </button>
          ))}
          
          <div className="pt-4 pb-2 border-t border-zinc-200 dark:border-zinc-800 mt-2">
            <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <span>Historial</span>
              <button onClick={createNewChat} className="hover:text-emerald-500 transition-colors p-1">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              {chats.map(chat => (
                <div 
                  key={chat.id}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    setActiveTab('chat');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between w-full p-3 rounded-lg cursor-pointer transition-colors ${
                    activeTab === 'chat' && currentChatId === chat.id
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center overflow-hidden">
                    <MessageCircle className="w-5 h-5 mr-3 shrink-0" />
                    <span className="font-medium truncate">{chat.title}</span>
                  </div>
                  <button 
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col pt-16 md:pt-0 h-full overflow-hidden bg-white dark:bg-zinc-950">
        {activeTab === "chat" && <ChatView isAdmin={isAdmin} chat={currentChat} onUpdateChat={updateChat} />}
        {activeTab === "translator" && <TranslatorView />}
        {activeTab === "calculator" && <CalculatorView />}
      </main>
    </div>
  );
}
