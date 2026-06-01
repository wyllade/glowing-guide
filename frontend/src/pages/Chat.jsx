import { useEffect, useState, useRef } from "react";
import { chatAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    chatAPI.getConversations().then((res) => setConversations(res.data.conversations));
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    chatAPI.getMessages(selectedUser.id).then((res) => setMessages(res.data.messages));

    const token = localStorage.getItem("token");
    const socket = io(SOCKET_URL, { query: { token } });
    socketRef.current = socket;

    socket.emit("join", { user1: user.id, user2: selectedUser.id });

    socket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.disconnect();
  }, [selectedUser]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const msg = { receiver_id: selectedUser.id, content };
    await chatAPI.sendMessage(msg);

    socketRef.current?.emit("send_message", msg);

    setMessages((prev) => [...prev, { ...msg, sender_id: user.id, is_read: false, created_at: new Date().toISOString() }]);
    setContent("");
  };

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <h3>Conversations</h3>
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`chat-user ${selectedUser?.id === c.id ? "active" : ""}`}
            onClick={() => setSelectedUser(c)}
          >
            <span className="chat-avatar">{c.first_name?.[0]}{c.last_name?.[0]}</span>
            <span>{c.first_name} {c.last_name}</span>
          </div>
        ))}
        {conversations.length === 0 && <p className="no-results">No conversations yet.</p>}
      </div>

      <div className="chat-main">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <h3>{selectedUser.first_name} {selectedUser.last_name}</h3>
            </div>
            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={m.id || i} className={`message ${m.sender_id === user.id ? "sent" : "received"}`}>
                  <p>{m.content}</p>
                  <span className="msg-time">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-input" onSubmit={handleSend}>
              <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type a message..." />
              <button type="submit" className="btn btn-primary">Send</button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">Select a conversation to start chatting</div>
        )}
      </div>
    </div>
  );
}
