import React, { useEffect, useRef, useState } from "react";

function InputBox({ onSendMessage, isLoading }) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const isVoiceSupported = Boolean(SpeechRecognition);

  useEffect(() => {
    if (!isVoiceSupported) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError("");
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }

      setInput(transcript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setVoiceError(`Voice input error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [SpeechRecognition, isVoiceSupported]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!input.trim()) {
      return;
    }

    onSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      handleSubmit(event);
    }
  };

  const toggleVoiceInput = () => {
    if (!isVoiceSupported) {
      setVoiceError("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    try {
      recognitionRef.current?.start();
    } catch {
      setVoiceError("Voice input is already starting. Please wait a moment.");
    }
  };

  return (
    <div className="composer-wrap">
      {voiceError && <p className="voice-error">{voiceError}</p>}

      <form className="input-area" onSubmit={handleSubmit}>
        <button
          className={`icon-button mic-button ${isListening ? "listening" : ""}`}
          type="button"
          onClick={toggleVoiceInput}
          disabled={isLoading}
          title={isListening ? "Stop voice input" : "Start voice input"}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
        >
          {isListening ? "Stop" : "Mic"}
        </button>

        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Message AI Chatbot..."}
          rows="1"
          disabled={isLoading}
          aria-label="Chat message"
        />

        <button
          className="send-button"
          type="submit"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>

      <p className="composer-hint">
        Press Enter to send. Use the mic button for voice to text.
      </p>
    </div>
  );
}

export default InputBox;
