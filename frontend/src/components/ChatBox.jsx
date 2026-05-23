import React, { useEffect, useRef } from "react";
import Message from "./Message.jsx";

function ChatBox({ messages, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="chat-box">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="message-row bot-row">
          <div className="avatar bot-avatar">AI</div>
          <div className="message-bubble bot-bubble typing-bubble">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

export default ChatBox;
