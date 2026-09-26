import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircle, X, Send, Bot, User, ChevronDown, Languages } from 'lucide-react';
import {
  CHATBOT_LANGUAGES,
  HELP_TOPICS,
  QUICK_TOPIC_IDS,
  matchTopic,
  getTopicAnswer,
  getTopicLabel,
  getChatUi
} from '../services/chatbotContent';

const QUICK_TOPICS = QUICK_TOPIC_IDS
  .map((id) => HELP_TOPICS.find((t) => t.id === id))
  .filter(Boolean);

let nextMsgId = 1;

export default function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState(() => {
    // Default to the app's saved UI language when it is supported, else English.
    const appLang = localStorage.getItem('retina_ai_lang') || 'en';
    return CHATBOT_LANGUAGES.some((l) => l.code === appLang) ? appLang : 'en';
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const ui = getChatUi(lang);

  // Seed the greeting when the language changes or on first open.
  useEffect(() => {
    setMessages([{ id: nextMsgId++, from: 'bot', text: ui.greeting }]);
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const pushBotAnswer = (topic) => {
    setMessages((prev) => [
      ...prev,
      { id: nextMsgId++, from: 'bot', text: getTopicAnswer(topic, lang), topicId: topic.id }
    ]);
  };

  const handleTopicClick = (topic) => {
    setMessages((prev) => [
      ...prev,
      { id: nextMsgId++, from: 'user', text: getTopicLabel(topic, lang) }
    ]);
    pushBotAnswer(topic);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages((prev) => [...prev, { id: nextMsgId++, from: 'user', text }]);
    const topic = matchTopic(text);
    if (topic) {
      pushBotAnswer(topic);
    } else {
      setMessages((prev) => [
        ...prev,
        { id: nextMsgId++, from: 'bot', text: ui.fallback, isFallback: true }
      ]);
    }
  };

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) setUnread(false);
  };

  const activeLang = useMemo(
    () => CHATBOT_LANGUAGES.find((l) => l.code === lang) || CHATBOT_LANGUAGES[0],
    [lang]
  );

  return (
    <>
      {/* Floating action button */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 flex items-center justify-center transition-all hover:scale-105"
          aria-label={ui.title}
          title={ui.title}
        >
          <MessageCircle className="w-7 h-7" />
          {unread && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>}
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm sm:w-96 flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200 max-h-[80vh]">

          {/* Header */}
          <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-teal-600 text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm truncate">{ui.title}</p>
                <p className="text-[10px] text-sky-100 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block"></span>
                  <span>{ui.subtitle}</span>
                </p>
              </div>
            </div>

            {/* Language picker */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowLangPicker((p) => !p)}
                className="flex items-center space-x-1 bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-colors"
                title="Change chatbot language"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{activeLang.native}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showLangPicker && (
                <div className="absolute right-0 top-full mt-2 w-48 max-h-64 overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-10">
                  {CHATBOT_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setShowLangPicker(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                        l.code === lang
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{l.native}</span>
                      <span className="text-[10px] text-slate-400">{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Close */}
            <button
              onClick={toggleOpen}
              className="text-white/80 hover:text-white p-1 shrink-0"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/40">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start space-x-2 ${msg.from === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.from === 'bot'
                    ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {msg.from === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                  msg.from === 'bot'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200 dark:border-slate-700'
                    : 'bg-sky-600 text-white rounded-tr-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Quick reply chips (after fallback or always at bottom) */}
            <div className="pt-1">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{ui.quickTitle}</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicClick(topic)}
                    className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 px-2.5 py-1.5 rounded-full transition-colors text-left"
                  >
                    {getTopicLabel(topic, lang)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ui.placeholder}
              className="flex-1 text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
              aria-label={ui.send}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
