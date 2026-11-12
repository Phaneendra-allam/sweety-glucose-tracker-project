
import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Activity,
  CalendarDays
} from "lucide-react";

import api from "./api";
import "./Chatbot.css";

const quickQuestions = [
  "How do I add a reading?",
  "How can I view my reports?",
  "How do I edit a reading?",
  "How many readings can I add?"
];

function getToday() {
  const now = new Date();

  return new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 10);
}

function formatSummary(data) {
  const summary = data.summary;

  if (!summary.total_readings) {
    return "You haven't recorded any glucose readings for today yet. Add a reading from your Dashboard to see your daily summary.";
  }

  return [
    `Here is your glucose summary for ${data.date}:`,
    `Total readings: ${summary.total_readings}`,
    `Highest: ${summary.highest} mg/dl`,
    `Lowest: ${summary.lowest} mg/dl`,
    `Average: ${summary.average} mg/dl`,
    "",
    "This is a record summary, not a medical assessment."
  ].join("\n");
}

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hello! I'm Sweety, your health tracking assistant. How can I help you today?",
      mode: "faq"
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, open]);

  const addMessage = (sender, text, mode = "faq") => {
    setMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-${Math.random()}`,
        sender,
        text,
        mode
      }
    ]);
  };

  const sendMessage = async (text) => {
    const message = text.trim();

    if (!message || sending) return;

    addMessage("user", message);
    setInput("");
    setSending(true);

    try {
      const response = await api.post("/chat/message", {
        message
      });

      addMessage(
        "bot",
        response.data.reply,
        response.data.mode || "faq"
      );
    } catch (error) {
      addMessage(
        "bot",
        error.response?.data?.message ||
          "I couldn't connect right now. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const loadTodaySummary = async () => {
    if (sending) return;

    addMessage("user", "Show my today's glucose summary.");
    setSending(true);

    try {
      const response = await api.get("/chat/today-summary", {
        params: { date: getToday() }
      });

      addMessage(
        "bot",
        formatSummary(response.data),
        "summary"
      );
    } catch (error) {
      addMessage(
        "bot",
        error.response?.data?.message ||
          "Unable to load your reading summary."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          className="sweety-chat-toggle"
          onClick={() => setOpen(true)}
          aria-label="Open Sweety assistant"
        >
          <MessageCircle size={25} />
          <span className="sweety-chat-dot" />
        </button>
      )}

      {open && (
        <section className="sweety-chat-window">
          <header className="sweety-chat-header">
            <div className="sweety-chat-brand">
              <div className="sweety-chat-avatar">
                <Bot size={23} />
              </div>

              <div>
                <h3>Sweety Assistant</h3>
                <p>
                  <span className="sweety-online-dot" />
                  Your health companion
                </p>
              </div>
            </div>

            <button
              type="button"
              className="sweety-chat-close"
              onClick={() => setOpen(false)}
              aria-label="Close chatbot"
            >
              <X size={20} />
            </button>
          </header>

          <div className="sweety-chat-body">
            <div className="sweety-chat-notice">
              <Sparkles size={15} />
              <span>
                Ask about Sweety features or your reading records.
              </span>
            </div>

            <div className="sweety-chat-quick">
              <p>QUICK QUESTIONS</p>

              <div className="sweety-quick-list">
                {quickQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={sending}
                    onClick={() => sendMessage(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="sweety-summary-button"
                disabled={sending}
                onClick={loadTodaySummary}
              >
                <CalendarDays size={15} />
                Show my today's summary
              </button>
            </div>

            <div className="sweety-chat-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`sweety-chat-row ${
                    message.sender === "user"
                      ? "sweety-chat-user-row"
                      : ""
                  }`}
                >
                  {message.sender === "bot" && (
                    <div className="sweety-message-avatar">
                      <Bot size={15} />
                    </div>
                  )}

                  <div
                    className={`sweety-message ${
                      message.sender === "user"
                        ? "sweety-user-message"
                        : "sweety-bot-message"
                    }`}
                  >
                    <p>{message.text}</p>

                    {message.sender === "bot" &&
                      message.mode === "ai" && (
                        <span className="sweety-mode-label">
                          AI response
                        </span>
                      )}

                    {message.sender === "bot" &&
                      message.mode === "summary" && (
                        <span className="sweety-mode-label">
                          <Activity size={11} />
                          Your private reading summary
                        </span>
                      )}
                  </div>

                  {message.sender === "user" && (
                    <div className="sweety-message-avatar sweety-user-avatar">
                      <User size={15} />
                    </div>
                  )}
                </div>
              ))}

              {sending && (
                <div className="sweety-typing">
                  <span />
                  <span />
                  <span />
                  Sweety is replying...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <form
            className="sweety-chat-input-area"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sweety something..."
              maxLength={1000}
              disabled={sending}
            />

            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>

          <div className="sweety-chat-disclaimer">
            For tracking help and general education only.
            Not a medical diagnosis.
          </div>
        </section>
      )}
    </>
  );
}

export default Chatbot;
