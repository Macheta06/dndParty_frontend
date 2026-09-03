"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { ChatMessage } from "@/types/game";
import { useAuth } from "@/context/AuthContext";
import { gameService } from "@/services/game.service";

interface ChatProps {
  socket: Socket | null;
  gameId: string;
}

export default function Chat({ socket, gameId }: ChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMessages() {
      try {
        const history = await gameService.getChatMessages(gameId);
        setMessages(history);
      } catch {
        console.error("Error cargando mensajes del chat");
      } finally {
        setIsLoading(false);
      }
    }
    if (user) loadMessages();
  }, [gameId, user]);

  useEffect(() => {
    if (!socket) return;

    const handler = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chatMessage", handler);
    return () => {
      socket.off("chatMessage", handler);
    };
  }, [socket]);

  useEffect(() => {
    if (messagesEndRef.current?.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "" || !socket) return;

    socket.emit("chatMessage", { gameId, content: input.trim() });
    setInput("");
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow">
      <h3 className="text-sm font-bold text-slate-400 mb-3">Chat de la Sala</h3>

      <div className="h-48 overflow-y-auto space-y-2 mb-3 bg-slate-900 rounded p-2">
        {isLoading ? (
          <p className="text-slate-500 italic text-xs">Cargando mensajes...</p>
        ) : messages.length === 0 ? (
          <p className="text-slate-500 italic text-xs">No hay mensajes todavía.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-xs">
              <span
                className={`font-bold ${msg.senderId === user?.id ? "text-amber-400" : "text-purple-400"}`}
              >
                {msg.sender.name}
              </span>
              <span className="text-slate-500 ml-1">
                {new Date(msg.createdAt).toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <p className="text-slate-300 mt-0.5">{msg.content}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí un mensaje..."
          maxLength={1000}
          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm placeholder:text-slate-600 focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={input.trim() === ""}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded transition-colors disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
