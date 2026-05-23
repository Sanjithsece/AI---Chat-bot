import React, { useState } from "react";
import axios from "axios";
import ChatBox from "./components/ChatBox.jsx";
import InputBox from "./components/InputBox.jsx";

const API_URL = "http://localhost:5050/api/chat";

function App() {
  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      sender: "bot",
      text: "Hi! I am your OpenRouter AI chatbot. Ask me anything.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async (text) => {
    const userText = text.trim();

    if (!userText || isLoading) {
      return;
    }

    const userMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: userText,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(API_URL, {
        message: userText,
      });

      const botMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: response.data.reply,
      };

      setMessages((currentMessages) => [...currentMessages, botMessage]);
    } catch (requestError) {
      const errorMessage =
        requestError.response?.data?.error ||
        "Could not connect to the backend. Make sure the server is running.";

      setError(errorMessage);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          sender: "bot",
          text: `Sorry, ${errorMessage}`,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: "bot",
        text: "Chat cleared. What would you like to ask next?",
      },
    ]);
    setError("");
  };

  return (
    <main className="app-shell">
      <section className="chat-panel" aria-label="AI chatbot">
        <header className="chat-header">
          <div>
            <p className="eyebrow">OpenRouter AI</p>
            <h1>AI Chatbot</h1>
          </div>
          <button className="clear-button" type="button" onClick={clearChat}>
            Clear
          </button>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <ChatBox messages={messages} isLoading={isLoading} />
        <InputBox onSendMessage={sendMessage} isLoading={isLoading} />
      </section>
    </main>
  );
}

export default App;
