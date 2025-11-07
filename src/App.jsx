import { useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react'; // icons for theme toggle
import './custom.css';

const WS_URL = 'wss://e7ealggbaf.execute-api.ap-south-1.amazonaws.com/dev/';

export default function App() {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState('');
  const [tempName, setTempName] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(0);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket connection
  const connectWS = (userName) => {
    const socket = new WebSocket(`${WS_URL}?name=${userName}`);
    setWs(socket);

    socket.onopen = () => {
      console.log(`[open] Connected as ${userName}`);
      setConnected(true);
      setName(userName);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // ✨ Typing indicator
        if (data.typing && data.sender) {
          setTypingUser(data.sender);
          clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setTypingUser(null), 2000);
          return;
        }

        // 💬 Normal message
        if (data.system && data.message) {
          // 🟢 System join/leave message
          setMessages((prev) => [
            ...prev,
            { type: 'system', text: data.message },
          ]);
        } else if (data.sender && data.message) {
          // 💬 Normal chat message
          if (data.sender !== userName) {
            setMessages((prev) => [
              ...prev,
              {
                type: 'chat',
                sender: data.sender,
                text: data.message,
                time: new Date(data.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            ]);
          }
        } else {
          // 🧩 fallback for plain text (old messages)
          setMessages((prev) => [
            ...prev,
            { type: 'system', text: event.data },
          ]);
        }
      } catch {
        setMessages((prev) => [...prev, { type: 'system', text: event.data }]);
      }
    };

    socket.onclose = () => {
      console.log('[close] Disconnected');
      setConnected(false);
      setTypingUser(null);
    };

    socket.onerror = (err) => {
      console.error('[error]', err);
      setConnected(false);
    };
  };

  const disconnectWS = () => {
    ws?.close();
    setConnected(false);
  };

  // Debounced typing
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInput(newValue);

    if (!ws || !connected) return;

    const now = Date.now();
    const elapsed = now - lastTypingTimeRef.current;

    if (elapsed > 1500) {
      ws.send(JSON.stringify({ typing: true }));
      lastTypingTimeRef.current = now;
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      lastTypingTimeRef.current = 0;
    }, 3000);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    ws?.send(JSON.stringify({ message: input }));
    setMessages((prev) => [
      ...prev,
      {
        type: 'self',
        text: input,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    setInput('');
  };

  // 🌓 Theme toggle
  const toggleTheme = () => setDarkMode(!darkMode);
  const speak = (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; // speaking speed
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    speechSynthesis.speak(utterance);
  } else {
    alert('Text-to-Speech not supported on this browser.');
  }
};


  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen transition-colors duration-500 ${
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'
      }`}
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-xl overflow-hidden border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <div
          className={`flex justify-between items-center px-4 py-2 ${
            darkMode
              ? 'bg-gradient-to-r from-indigo-600 to-blue-500'
              : 'bg-gradient-to-r from-blue-500 to-cyan-400'
          } text-white`}
        >
          <span className="font-semibold text-sm sm:text-base">
            {connected ? `Connected as ${name}` : 'Not Connected'}
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition"
              title={darkMode ? 'Switch to Light' : 'Switch to Dark'}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-yellow-300" />
              ) : (
                <Moon className="w-4 h-4 text-gray-100" />
              )}
            </button>
            {connected && (
              <button
                onClick={disconnectWS}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Connection screen */}
        {!connected && (
          <div className="p-5 space-y-3">
            <input
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-400'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-200'
              }`}
              placeholder="Enter your name"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && connectWS(tempName)}
            />
            <button
              onClick={() => connectWS(tempName)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
            >
              Connect
            </button>
          </div>
        )}

        {/* Chat area */}
        {connected && (
          <>
            <div
              className={`p-4 h-96 overflow-y-auto space-y-2 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`${
                    msg.type === 'system'
                      ? 'text-center text-sm italic text-gray-400 py-1'
                      : msg.type === 'self'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block px-3 py-2 rounded-xl text-sm sm:text-base ${
                      msg.type === 'system'
                        ? ''
                        : msg.type === 'self'
                        ? darkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : darkMode
                        ? 'bg-gray-600 text-gray-100'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.type === 'self'
                      ? msg.text
                      : msg.sender
                      ? `${msg.sender}: ${msg.text}`
                      : msg.text}
                  </div>
                  {msg.type !== 'system' && (
                    <button
                      onClick={() => speak(`${msg.sender ? msg.sender + ' says: ' : ''}${msg.text}`)}
                      className={`ml-2 text-xs hover:text-blue-500 transition ${
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}
                      title="Read aloud"
                    >
                      🔊
                    </button>
                  )}
                  <div
                    className={`text-xs mt-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {typingUser && (
                <div className="flex items-center space-x-2 text-gray-400 italic text-sm">
                  <div className="flex space-x-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
                  </div>
                  <span>{typingUser} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div
              className={`flex items-center p-3 border-t ${
                darkMode ? 'border-gray-600' : 'border-gray-200'
              }`}
            >
              <input
                className={`flex-grow border rounded-l px-3 py-2 focus:outline-none focus:ring ${
                  darkMode
                    ? 'bg-gray-600 border-gray-500 text-white focus:ring-indigo-400'
                    : 'bg-white border-gray-300 focus:ring-blue-200'
                }`}
                placeholder="Type your message..."
                value={input}
                onChange={(e) => handleInputChange(e)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className={`px-4 py-2 rounded-r font-medium ${
                  darkMode
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
