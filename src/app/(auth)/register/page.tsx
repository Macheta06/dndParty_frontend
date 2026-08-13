"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import axios from "axios";

export default function RegisterPage() {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(formData);
    } catch (err: unknown) {
      let errorMessage = "Error al crear la cuenta";
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as
          | { message?: string | string[] }
          | undefined;
        if (responseData?.message) {
          errorMessage = Array.isArray(responseData.message)
            ? responseData.message.join(", ")
            : responseData.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-500 mb-2">
            Crear Cuenta
          </h1>
          <p className="text-slate-400 text-sm">
            Únete a la aventura en D&D Party Manager
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              Nombre de Usuario
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 text-slate-100"
              placeholder="Ej: Gandalf"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 text-slate-100"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 text-slate-100"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 mt-6"
          >
            {loading ? "Forjando cuenta..." : "Registrarse"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-amber-500 hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
