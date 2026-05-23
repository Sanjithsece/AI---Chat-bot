import React from "react";

function Message({ message }) {
  const isUser = message.sender === "user";

  return (
    <div className={`message-row ${isUser ? "user-row" : "bot-row"}`}>
      {!isUser && <div className="avatar bot-avatar">AI</div>}

      <div
        className={`message-bubble ${isUser ? "user-bubble" : "bot-bubble"} ${
          message.isError ? "error-bubble" : ""
        }`}
      >
        {message.text}
      </div>

      {isUser && <div className="avatar user-avatar">You</div>}
    </div>
  );
}

export default Message;
