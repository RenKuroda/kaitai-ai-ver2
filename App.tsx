
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { FileWithPreview, EstimationResult, EstimationHistoryEntry, ChatMessage } from './types';
import { ImageUploadArea } from './components/ImageUploadArea';
import { ImagePreviewCard } from './components/ImagePreviewCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { ResultsDisplay } from './components/ResultsDisplay';
import { EstimationHistoryList } from './components/EstimationHistoryList';
import { ChatInterface } from './components/ChatInterface';
import { generateDemolitionEstimate } from './services/geminiService';
import { DEMOLITION_ESTIMATE_PROMPT, LOCAL_STORAGE_HISTORY_KEY, MAX_HISTORY_ITEMS, GEMINI_MODEL_NAME } from './constants';

const getApiKeyOrThrow = (): string => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY!;
  if (!apiKey) {
    console.error("APIキーが設定されていません。環境変数 API_KEY を設定してください。");
    throw new Error("APIキーが設定されていません。チャット機能は利用できません。");
  }
  return apiKey;
};


const App: React.FC = () => {
  const [uploadedImages, setUploadedImages] = useState<FileWithPreview[]>([]);
  const [estimationResult, setEstimationResult] = useState<EstimationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [estimationHistory, setEstimationHistory] = useState<EstimationHistoryEntry[]>([]);
  
  const resultsRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [aiInstance, setAiInstance] = useState<GoogleGenAI | null>(null);
  const [chatInstance, setChatInstance] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isChatUIVisible, setIsChatUIVisible] = useState<boolean>(false);

  // History section visibility state
  const [isHistoryDetailsVisible, setIsHistoryDetailsVisible] = useState<boolean>(false);


  useEffect(() => {
    try {
      const key = getApiKeyOrThrow(); 
      setAiInstance(new GoogleGenAI({ apiKey: key }));
    } catch (e: any) {
      setError(`初期化エラー: ${e.message}. アプリケーションの一部の機能が利用できない可能性があります。`);
      console.error("Failed to initialize GoogleGenAI:", e);
    }
  }, []);


  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (storedHistory) {
        setEstimationHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage:", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(estimationHistory));
    } catch (e) {
      console.error("Failed to save history to localStorage:", e);
    }
  }, [estimationHistory]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImagesPromises = Array.from(files).map(file => {
        return new Promise<FileWithPreview>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              id: crypto.randomUUID(),
              file: file,
              preview: reader.result as string,
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newImagesPromises).then(newImages => {
         setUploadedImages(prevImages => [...prevImages, ...newImages].slice(0, 10));
         setEstimationResult(null); 
         setError(null);
         setChatInstance(null); 
         setChatMessages([]);
         setIsChatUIVisible(false); 
      });
    }
  }, []);

  const handleRemoveImage = useCallback((imageId: string) => {
    setUploadedImages(prevImages => {
        const newImages = prevImages.filter(img => img.id !== imageId);
        if (newImages.length === 0) {
            setEstimationResult(null);
            setChatInstance(null);
            setChatMessages([]);
            setIsChatUIVisible(false);
        }
        return newImages;
    });
  }, []);

  const initializeChat = useCallback((estimateText: string) => {
    if (!aiInstance) {
        setChatError("AIクライアントが初期化されていません。チャットを開始できません。");
        console.error("Cannot initialize chat: AI instance is not available.");
        return;
    }
    setChatMessages([]); 
    setChatError(null);
    try {
        const systemInstruction = `あなたは親切なAIアシスタントです。ユーザーは提供された画像と特定の指示に基づいて解体現場を受け取りました。提供された現場は以下の通りです：「${estimateText.substring(0, 1500)}」。あなたの役割は、この特定の現場情報取得に関するフォローアップの質問に答えることです。簡潔に、現場情報内の点を明確にするか、詳しく説明することに焦点を当ててください。質問が現場情報の範囲外である場合は、丁寧にお知らせください。`;
        
        const newChat = aiInstance.chats.create({
            model: GEMINI_MODEL_NAME,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        setChatInstance(newChat);
    } catch (e: any) {
        console.error("チャットの初期化に失敗しました:", e);
        setChatError(`チャットの初期化エラー: ${e.message}`);
        setChatInstance(null);
    }
  }, [aiInstance]);


  const getEstimate = useCallback(async () => {
    if (uploadedImages.length === 0) {
      setError("画像を1枚以上アップロードしてください。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setChatInstance(null); 
    setChatMessages([]);
    setIsChatUIVisible(false); 

    try {
      const imageParts = uploadedImages.map(img => ({
        inlineData: {
          mimeType: img.file.type,
          data: img.preview.split(',')[1],
        },
      }));

      const resultText = await generateDemolitionEstimate(DEMOLITION_ESTIMATE_PROMPT, imageParts);
      const currentResult = { text: resultText };
      setEstimationResult(currentResult); 
      initializeChat(resultText); 

      const newHistoryEntry: EstimationHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        images: uploadedImages.map(img => ({ id: img.id, file: { name: img.file.name, type: img.file.type } as File, preview: img.preview })),
        result: currentResult,
        promptText: DEMOLITION_ESTIMATE_PROMPT,
      };
      setEstimationHistory(prevHistory => [newHistoryEntry, ...prevHistory].slice(0, MAX_HISTORY_ITEMS));
      
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }

    } catch (err) {
      console.error("Error getting estimation:", err);
      if (err instanceof Error) {
        setError(`現調中にエラーが発生しました: ${err.message}`);
      } else {
        setError("現調中に不明なエラーが発生しました。");
      }
      setEstimationResult(null); 
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImages, initializeChat, aiInstance]);

  const handleSendChatMessage = useCallback(async (messageText: string) => {
    if (!chatInstance) {
      setChatError("チャットセッションがアクティブではありません。");
      return;
    }
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: messageText,
      timestamp: Date.now(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);
    setChatError(null);

    try {
      const stream = await chatInstance.sendMessageStream({ message: messageText });
      let modelResponseText = "";
      const modelMessageId = crypto.randomUUID();
      
      setChatMessages(prev => [...prev, {id: modelMessageId, role: 'model', text: "...", timestamp: Date.now()}]);

      for await (const chunk of stream) {
        modelResponseText += chunk.text;
        setChatMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? {...msg, text: modelResponseText } : msg
        ));
      }
       setChatMessages(prev => prev.map(msg => 
        msg.id === modelMessageId ? {...msg, text: modelResponseText || "AIからの応答がありませんでした。" } : msg
      ));

    } catch (err) {
      console.error("チャットメッセージの送信エラー:", err);
      const errorMessage = err instanceof Error ? err.message : "不明なチャットエラー";
      setChatError(`AIとのチャット中にエラーが発生しました: ${errorMessage}`);
      setChatMessages(prev => [...prev, {id: crypto.randomUUID(), role: 'model', text: `エラー: ${errorMessage}`, timestamp: Date.now()}]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInstance]);


  const loadHistoryEntry = useCallback((entryId: string) => {
    const entry = estimationHistory.find(item => item.id === entryId);
    if (entry) {
      const historyImages = entry.images.map(img => ({
        id: img.id,
        file: new File([""], img.file.name, { type: img.file.type }),
        preview: img.preview,
      }));
      setUploadedImages(historyImages);
      setEstimationResult(entry.result);
      initializeChat(entry.result.text); 
      setIsChatUIVisible(true); 
      setError(null);
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [estimationHistory, initializeChat]);

  const deleteHistoryEntry = useCallback((entryId: string) => {
    setEstimationHistory(prevHistory => prevHistory.filter(item => item.id !== entryId));
  }, []);

  const clearAllHistory = useCallback(() => {
    if (window.confirm("本当にすべての履歴を削除しますか？この操作は元に戻せません。")) {
      setEstimationHistory([]);
    }
  }, []);

  const mainContentPaddingBottom = estimationResult && aiInstance 
    ? (isChatUIVisible ? 'pb-[70vh]' : 'pb-20 sm:pb-16') 
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-gray-100">
      <div className={`w-full max-w-4xl mx-auto p-4 sm:p-8 ${mainContentPaddingBottom}`}>
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
            解体現調AI
          </h1>
          <p className="mt-2 text-lg text-slate-300">建物の写真をアップロードして、AIによる解体現場情報を取得します。</p>
        </header>

        <main className="bg-slate-800 shadow-2xl rounded-lg p-6 sm:p-8">
          <ImageUploadArea onImageUpload={handleImageUpload} disabled={isLoading || uploadedImages.length >= 10} />
          
          {uploadedImages.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-sky-400 mb-3">アップロードされた画像 ({uploadedImages.length}/10)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {uploadedImages.map(img => (
                  <ImagePreviewCard key={img.id} image={img} onRemove={handleRemoveImage} disabled={isLoading} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={getEstimate}
              disabled={isLoading || uploadedImages.length === 0 || !aiInstance}
              className="px-8 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
              aria-live="polite"
            >
              {isLoading ? '現調中...' : '解体費用を見積もる'}
            </button>
            {!aiInstance && !error?.includes("初期化エラー") && !error?.includes("APIキー") && <p className="text-xs text-yellow-400 mt-2">AIサービスの準備中です...</p>}
          </div>
          
          <div ref={resultsRef}>
            {isLoading && <LoadingSpinner />}
            {error && !error.startsWith("チャットの初期化エラー") && !error.startsWith("AIとのチャット中にエラーが発生しました") && <ErrorMessage message={error} />}
            {estimationResult && !isLoading && (
              <ResultsDisplay result={estimationResult} />
            )}
          </div>
        </main>

        {estimationHistory.length > 0 && (
          <section className="w-full mt-12" aria-labelledby="history-heading">
            <div className="bg-slate-800 shadow-2xl rounded-lg p-6 sm:p-8">
              <div className="flex justify-between items-center mb-4">
                <h2 id="history-heading" className="text-2xl font-semibold text-sky-400">
                現場履歴
                </h2>
                <button
                  onClick={() => setIsHistoryDetailsVisible(!isHistoryDetailsVisible)}
                  className="p-1.5 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                  aria-expanded={isHistoryDetailsVisible}
                  aria-controls="history-details-content"
                  title={isHistoryDetailsVisible ? '履歴を隠す' : '履歴を表示する'}
                >
                  {isHistoryDetailsVisible ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-300">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /> {/* Chevron Up */}
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-300">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /> {/* Chevron Down */}
                    </svg>
                  )}
                  <span className="sr-only">{isHistoryDetailsVisible ? '履歴を隠す' : '履歴を表示する'}</span>
                </button>
              </div>

              {isHistoryDetailsVisible && (
                <div id="history-details-content">
                  {estimationHistory.length > 0 && (
                     <div className="flex justify-end mb-4">
                        <button
                        onClick={clearAllHistory}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-md transition-colors duration-200 ease-in-out"
                        aria-label="すべての現場履歴を削除する"
                        >
                        全履歴を消去
                        </button>
                    </div>
                  )}
                  <EstimationHistoryList
                    history={estimationHistory}
                    onLoadEntry={loadHistoryEntry}
                    onDeleteEntry={deleteHistoryEntry}
                  />
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Fixed Bottom Bar Area */}
      {estimationResult && aiInstance && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          {isChatUIVisible && chatInstance && (
            <div 
              id="chat-interface-panel" 
              className="bg-slate-800/90 backdrop-blur-md shadow-lg max-w-[800px] w-full mx-auto p-2.5"
              style={{ maxHeight: '60vh', overflowY: 'auto' }}
            >
              <ChatInterface
                messages={chatMessages}
                isLoading={isChatLoading}
                error={chatError}
                onSendMessage={handleSendChatMessage}
              />
            </div>
          )}
          <div className="bg-slate-900/90 backdrop-blur-md p-3 border-t border-slate-700/50 shadow-top-lg">
            <div className="max-w-[800px] w-full mx-auto flex justify-center items-center">
              <button
                onClick={() => setIsChatUIVisible(!isChatUIVisible)}
                className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 ease-in-out flex items-center justify-center text-sm"
                aria-expanded={isChatUIVisible}
                aria-controls="chat-interface-panel"
              >
                {isChatUIVisible ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                    </svg>
                    チャットを閉じる
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.862 8.25-8.625 8.25S3.75 16.556 3.75 12s3.862-8.25 8.625-8.25S21 7.444 21 12Z" />
                    </svg>
                    この現場についてAIに質問する
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
