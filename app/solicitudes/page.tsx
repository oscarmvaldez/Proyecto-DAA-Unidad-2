"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Solicitud {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: string;
  userEmail: string;
}

export default function SolicitudesPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Agregando Funcionalidades de Formulario
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("soporte");
  const [mensaje, setMensaje] = useState("");

  // Aquí se agregan las funcionalidades de edición
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editTipo, setEditTipo] = useState("soporte");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

    const role = parsedUser?.role || "";
    const userId = parsedUser?.id || "";

    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/solicitudes", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        role,
        userid: userId,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar solicitudes");
        return res.json();
      })
      .then((data) => {
        setSolicitudes(data.solicitudes || []);
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudieron cargar las solicitudes");
        setLoading(false);
      });
  }, [router]);

  if (loading) return <p className="p-4">Cargando solicitudes...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  const crearSolicitud = async () => {
    setMensaje("");
    setError("");

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

    const role = parsedUser?.role || "";
    const userId = parsedUser?.id || "";
    const userEmail = parsedUser?.email || "";

    if (!token || !userId || !userEmail) {
      setError("Sesión inválida. Vuelve a iniciar sesión.");
      router.push("/login");
      return;
    }

    if (!titulo.trim() || !descripcion.trim()) {
      setError("Título y descripción son obligatorios.");
      return;
    }

    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          role,
          userid: userId,
        },
        body: JSON.stringify({
          titulo,
          descripcion,
          tipo,
          userId,
          userEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Error al crear solicitud");
        return;
      }

      setMensaje("Solicitud creada correctamente.");

      setTitulo("");
      setDescripcion("");
      setTipo("soporte");

      const resList = await fetch("/api/solicitudes", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          role,
          userid: userId,
        },
      });

      const listData = await resList.json();
      setSolicitudes(listData.solicitudes || []);
    } catch {
      setError("Error de conexión al crear la solicitud.");
    }
  };

  // FUNCIÓN ELIMINAR, esta función no se encontraba en el código que se nos compartió
  // en el ejercicio, pero busqué cómo agregarla porque se hace una llamada a esa función.
  
  const eliminarSolicitud = async (id: string) => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

    const role = parsedUser?.role || "";
    const userId = parsedUser?.id || "";

    if (!confirm("¿Seguro que deseas eliminar esta solicitud?")) return;

    try {
      const res = await fetch(`/api/solicitudes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          role,
          userid: userId,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Error al eliminar");
        return;
      }

      setSolicitudes((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Error de conexión al eliminar.");
    }
  };

  const iniciarEdicion = (s: Solicitud) => {
    setEditandoId(s.id);
    setEditTitulo(s.titulo);
    setEditDescripcion(s.descripcion);
    setEditTipo(s.tipo);
  };

  const guardarEdicion = async (id: string) => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

    const role = parsedUser?.role || "";
    const userId = parsedUser?.id || "";

    try {
      const res = await fetch(`/api/solicitudes/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          role,
          userid: userId,
        },
        body: JSON.stringify({
          titulo: editTitulo,
          descripcion: editDescripcion,
          tipo: editTipo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Error al actualizar");
        return;
      }

      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, titulo: editTitulo, descripcion: editDescripcion, tipo: editTipo }
            : s
        )
      );

      setEditandoId(null);
    } catch {
      setError("Error de conexión al actualizar.");
    }
  };

        const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">
         Listado de Solicitudes
        </h1>

        <button
          onClick={cerrarSesion}
         className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition text-white text-sm"
        >
          Cerrar sesión
        </button>
      </div>

      {/* FORMULARIO */}
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg mb-8 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">
          Nueva solicitud
        </h2>

        {mensaje && <p className="text-green-400 mb-3">{mensaje}</p>}
        {error && <p className="text-red-400 mb-3">{error}</p>}

        <input
          className="w-full p-3 mb-3 rounded bg-gray-700 border border-gray-600 text-gray-100"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <textarea
          className="w-full p-3 mb-3 rounded bg-gray-700 border border-gray-600 text-gray-100"
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <select
          className="w-full p-3 mb-4 rounded bg-gray-700 border border-gray-600 text-gray-100"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="soporte">Soporte</option>
          <option value="permiso">Permiso</option>
          <option value="requerimiento">Requerimiento</option>
        </select>

        <button
          onClick={crearSolicitud}
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
        >
          Crear solicitud
        </button>
      </div>

      {solicitudes.length === 0 ? (
        <p className="text-gray-400">No hay solicitudes registradas.</p>
      ) : (
        <div className="space-y-5">
          {solicitudes.map((s) => (
            <div
              key={s.id}
              className="bg-gray-800 border border-gray-700 p-5 rounded-lg shadow-md"
            >
              {editandoId === s.id ? (
                <>
                  <input
                    className="w-full p-2 mb-2 rounded bg-gray-700 border border-gray-600 text-gray-100"
                    value={editTitulo}
                    onChange={(e) => setEditTitulo(e.target.value)}
                  />

                  <textarea
                    className="w-full p-2 mb-2 rounded bg-gray-700 border border-gray-600 text-gray-100"
                    value={editDescripcion}
                    onChange={(e) => setEditDescripcion(e.target.value)}
                  />

                  <select
                    className="w-full p-2 mb-3 rounded bg-gray-700 border border-gray-600 text-gray-100"
                    value={editTipo}
                    onChange={(e) => setEditTipo(e.target.value)}
                  >
                    <option value="soporte">Soporte</option>
                    <option value="permiso">Permiso</option>
                    <option value="requerimiento">Requerimiento</option>
                  </select>

                  <div className="flex gap-3">
                    <button
                      onClick={() => guardarEdicion(s.id)}
                      className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white text-sm"
                    >
                      Guardar
                    </button>

                    <button
                      onClick={() => setEditandoId(null)}
                      className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-white mb-2">
                    {s.titulo}
                  </h2>

                  <p className="text-gray-300 mb-2">{s.descripcion}</p>

                  <p className="text-sm text-blue-400">
                    Tipo: {s.tipo} | Estado: {s.estado}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Usuario: {s.userEmail}
                  </p>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => iniciarEdicion(s)}
                      className="px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-500 text-white text-sm"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => eliminarSolicitud(s.id)}
                      className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
