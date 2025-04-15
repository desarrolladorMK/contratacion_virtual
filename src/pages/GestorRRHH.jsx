// GestorRRHH.jsx
import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { supabase } from "../client";
import "./GestorRRHH.css";

const estados = [
  "Postulado",
  "Preseleccionado",
  "Entrevista",
  "Documentación",
  "Contratado",
  "Rechazado"
];

const GestorRRHH = () => {
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPostulaciones = async () => {
      const { data, error } = await supabase.from("Postulaciones").select("*");
      if (!error) setPostulaciones(data);
      setLoading(false);
    };

    fetchPostulaciones();
  }, []);

  const handleEstadoChange = async (id, nuevoEstado) => {
    const { error } = await supabase
      .from("Postulaciones")
      .update({ estado: nuevoEstado })
      .eq("id", id);

    if (!error) {
      setPostulaciones((prev) =>
        prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p))
      );
    }
  };

  const columnas = [
    { name: "Nombre", selector: (row) => row.nombreApellido, sortable: true },
    { name: "Cargo", selector: (row) => row.cargo, sortable: true },
    { name: "Documento", selector: (row) => row.numeroDocumento },
    {
      name: "Estado",
      cell: (row) => (
        <select
          value={row.estado}
          onChange={(e) => handleEstadoChange(row.id, e.target.value)}
        >
          {estados.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>
      )
    }
  ];

  return (
    <div className="gestor-container">
      <h2>Gestión de Postulaciones</h2>
      <DataTable
        columns={columnas}
        data={postulaciones}
        progressPending={loading}
        pagination
        highlightOnHover
        striped
      />
    </div>
  );
};

export {GestorRRHH};
