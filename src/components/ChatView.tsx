import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2, X, Play, Square, Download, Code, Image as ImageIcon, Cpu, Search, Plus, FileText, Braces, Folder, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChatMessageStream } from '../services/geminiService';
import { ChatSession, ChatMessage } from '../types';

interface ChatViewProps {
  isAdmin: boolean;
  chat: ChatSession | undefined;
  onUpdateChat: (id: string, messages: ChatMessage[], title?: string) => void;
}

export default function ChatView({ isAdmin, chat, onUpdateChat }: ChatViewProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{data: string, mimeType: string, name: string, isText: boolean}[]>([]);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'preview' | 'code'>('preview');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [model, setModel] = useState('gemini-3-flash-preview');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = chat?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      const isText = file.type.startsWith('text/') || file.name.endsWith('.json') || file.name.endsWith('.js') || file.name.endsWith('.py') || file.name.endsWith('.csv') || file.name.endsWith('.md');
      
      if (isText) {
        reader.onloadend = () => {
          setSelectedFiles(prev => [...prev, {
            data: reader.result as string,
            mimeType: file.type || 'text/plain',
            name: file.name,
            isText: true
          }]);
        };
        reader.readAsText(file);
      } else {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          setSelectedFiles(prev => [...prev, {
            data: base64String,
            mimeType: file.type,
            name: file.name,
            isText: false
          }]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!chat) return;
    if (!input.trim() && selectedFiles.length === 0) return;

    const userMsg = { role: 'user', text: input, files: selectedFiles.length > 0 ? [...selectedFiles] : undefined };
    const newMessages = [...messages, userMsg];
    
    let newTitle = chat.title;
    if (messages.length === 1 && chat.title === 'Nou Xat') {
      newTitle = input.slice(0, 30) + (input.length > 30 ? '...' : '');
    }

    onUpdateChat(chat.id, newMessages, newTitle);
    setInput('');
    setIsLoading(true);
    
    const filesToSend = [...selectedFiles];
    setSelectedFiles([]);

    const controller = new AbortController();
    setAbortController(controller);

    const messagesWithEmptyModel = [...newMessages, { role: 'model', text: '' }];
    onUpdateChat(chat.id, messagesWithEmptyModel, newTitle);

    try {
      const stream = sendChatMessageStream(
        newMessages.filter(m => !m.files),
        userMsg.text, 
        filesToSend,
        controller.signal,
        model
      );

      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk;
        const updatedMessages = [...newMessages, { role: 'model', text: fullText }];
        onUpdateChat(chat.id, updatedMessages, newTitle);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error(error);
        const updatedMessages = [...newMessages, { role: 'model', text: messagesWithEmptyModel[messagesWithEmptyModel.length-1].text + '\n\n[Error en processar la petició]' }];
        onUpdateChat(chat.id, updatedMessages, newTitle);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const downloadCode = (code: string, extension: string = 'html') => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `joc.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    setShowSettings(false);
  };

  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const isHtml = match && match[1] === 'html';
      const codeString = String(children).replace(/\n$/, '');
      
      return !inline && match ? (
        <div className="relative group mt-6 mb-6 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-mono flex justify-between items-center">
            <span className="font-bold">{match[1].toUpperCase()}</span>
            <div className="flex space-x-2">
              {isAdmin && !isHtml && (
                <>
                  <button
                    onClick={() => downloadCode(codeString, match[1])}
                    className="flex items-center text-zinc-500 hover:text-emerald-500 transition-colors"
                    title="Descarregar Codi"
                  >
                    <Download className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Descarregar</span>
                  </button>
                </>
              )}
              {isHtml && (
                <button
                  onClick={() => {
                    setPreviewCode(codeString);
                    setRightPanelTab('preview');
                    setShowPreviewMobile(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center shadow-sm"
                >
                  <Play className="w-4 h-4 mr-1.5" /> Previsualitzar Joc
                </button>
              )}
            </div>
          </div>
          {!isHtml && (
            <pre className="bg-zinc-50 dark:bg-zinc-950 p-4 overflow-x-auto text-sm m-0 text-zinc-800 dark:text-zinc-200">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          )}
          {isHtml && (
            <div className="p-8 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
              <Code className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Codi HTML generat. Fes clic a "Previsualitzar Joc" per veure'l.</p>
              {isAdmin && <p className="text-xs mt-2 opacity-70">Com a ADMIN, podràs veure el codi a la pestanya "Codi" del panell dret.</p>}
            </div>
          )}
        </div>
      ) : (
        <code className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-mono text-sm" {...props}>
          {children}
        </code>
      );
    }
  };

  if (!chat) {
    return <div className="flex-1 flex items-center justify-center text-zinc-500">Selecciona o crea un xat per començar.</div>;
  }

  return (
    <div className="flex h-full w-full bg-white dark:bg-zinc-950 overflow-hidden relative">
      {/* Chat Section */}
      <div className={`flex flex-col h-full transition-all duration-300 ${previewCode ? 'hidden lg:flex lg:w-1/2 border-r border-zinc-200 dark:border-zinc-800' : 'w-full'}`}>
        
        {/* Header for model selection */}
        <div className="h-14 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center">
            <Cpu className="w-5 h-5 text-emerald-500 mr-2" />
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-transparent text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="gemini-3-flash-preview">Gemini 3 Flash (Nou)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Antic)</option>
            </select>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Configuració"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[95%] md:max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-500 text-white rounded-br-sm' 
                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 rounded-bl-sm border border-zinc-200 dark:border-zinc-800'
              }`}>
                {msg.files && msg.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {msg.files.map((f: any, i: number) => (
                      <div key={i} className="bg-black/10 dark:bg-white/10 rounded-lg p-2 flex items-center text-xs">
                        {f.isText ? <Code className="w-4 h-4 mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                        <span className="truncate max-w-[150px]">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {msg.text && (
                  <div className={`prose dark:prose-invert prose-emerald max-w-none text-sm md:text-base leading-relaxed ${msg.role === 'user' ? 'text-white prose-p:text-white prose-headings:text-white prose-strong:text-white' : ''}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 rounded-bl-sm flex items-center space-x-3 text-zinc-500 dark:text-zinc-400 shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                <span className="text-sm font-medium">MarcIA està escrivint...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900">
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="relative inline-flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2 pr-8 border border-zinc-200 dark:border-zinc-700">
                  {file.isText ? <Code className="w-4 h-4 mr-2 text-emerald-500" /> : <ImageIcon className="w-4 h-4 mr-2 text-emerald-500" />}
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">{file.name}</span>
                  <button 
                    onClick={() => removeFile(idx)}
                    className="absolute top-1/2 -translate-y-1/2 right-2 text-zinc-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end space-x-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-zinc-400 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors"
              title="Adjuntar fitxers"
            >
              <Paperclip className="w-6 h-6" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              multiple
              className="hidden" 
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escriu a MarcIA..."
              className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none min-h-[52px] max-h-32"
              rows={1}
            />
            {isLoading ? (
              <button 
                onClick={handleStop}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shadow-sm flex items-center justify-center"
                title="Aturar"
              >
                <Square className="w-6 h-6 fill-current" />
              </button>
            ) : (
              <button 
                onClick={handleSend}
                disabled={!input.trim() && selectedFiles.length === 0}
                className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm"
              >
                <Send className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {previewCode && (
        <div className={`absolute inset-0 z-20 lg:relative lg:inset-auto flex flex-col h-full bg-white dark:bg-zinc-950 ${!showPreviewMobile ? 'hidden lg:flex lg:w-1/2' : 'flex w-full'}`}>
          <div className="h-14 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-2 sm:px-4 shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
                <button 
                  onClick={() => setRightPanelTab('preview')}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${rightPanelTab === 'preview' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                  Preview
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => setRightPanelTab('code')}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center ${rightPanelTab === 'code' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 ${rightPanelTab === 'code' ? 'bg-zinc-800 dark:bg-zinc-200' : 'bg-zinc-400'}`}></span>
                    Code
                  </button>
                )}
              </div>
              
              {rightPanelTab === 'code' && (
                <div className="hidden sm:flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs sm:text-sm font-medium border border-blue-100 dark:border-blue-800/30">
                  <Code className="w-3.5 h-3.5 mr-1.5" /> index.html
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 text-zinc-500">
              {isAdmin && rightPanelTab === 'code' && (
                <button onClick={() => downloadCode(previewCode, 'html')} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="Download">
                  <Download className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="Settings">
                <Settings className="w-4 h-4" />
              </button>
              <button onClick={() => { setPreviewCode(null); setShowPreviewMobile(false); }} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors" title="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full relative bg-white dark:bg-zinc-950 overflow-hidden flex">
            {rightPanelTab === 'preview' ? (
              <iframe 
                srcDoc={previewCode} 
                title="Game Preview"
                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                className="absolute inset-0 w-full h-full border-0 bg-white"
              />
            ) : (
              <>
                <div className="hidden sm:flex w-56 border-r border-zinc-200 dark:border-zinc-800 flex-col bg-zinc-50/50 dark:bg-zinc-900/20">
                  <div className="flex items-center justify-between p-3 text-xs text-zinc-500">
                    <span className="font-semibold uppercase tracking-wider">File explorer</span>
                    <div className="flex space-x-1">
                      <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded"><Search className="w-3.5 h-3.5" /></button>
                      <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded"><Plus className="w-3.5 h-3.5" /></button>
                      <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto py-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="px-3 py-1.5 flex items-center hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"><FileText className="w-4 h-4 mr-2 opacity-50"/> .env.example</div>
                    <div className="px-3 py-1.5 flex items-center hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"><FileText className="w-4 h-4 mr-2 opacity-50"/> .gitignore</div>
                    <div className="px-3 py-1.5 flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 cursor-pointer border-r-2 border-blue-500"><Code className="w-4 h-4 mr-2 text-orange-500"/> index.html</div>
                    <div className="px-3 py-1.5 flex items-center hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"><Braces className="w-4 h-4 mr-2 text-yellow-500"/> metadata.json</div>
                    <div className="px-3 py-1.5 flex items-center hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"><Braces className="w-4 h-4 mr-2 text-yellow-500"/> package.json</div>
                    <div className="px-3 py-1.5 flex items-center hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"><Folder className="w-4 h-4 mr-2 opacity-50"/> src</div>
                  </div>
                </div>
                
                <div className="flex-1 flex overflow-auto bg-white dark:bg-zinc-950">
                  <div className="flex flex-col text-right px-3 py-4 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 dark:text-zinc-600 font-mono text-xs sm:text-sm select-none border-r border-zinc-200 dark:border-zinc-800 min-w-[3rem]">
                    {previewCode.split('\n').map((_, i) => (
                      <div key={i} className="leading-relaxed">{i + 1}</div>
                    ))}
                  </div>
                  <div className="flex-1 p-4 overflow-x-auto">
                    <pre className="font-mono text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 m-0 leading-relaxed">
                      <code>{previewCode}</code>
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center">
                <Settings className="w-5 h-5 mr-2 text-emerald-500" />
                Configuració
              </h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Clau d'API de Gemini
                </label>
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Si vols allotjar aquesta web a GitHub Pages (sense servidor), necessites posar la teva pròpia clau d'API aquí. Es guardarà localment al teu navegador.
                </p>
              </div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button 
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
