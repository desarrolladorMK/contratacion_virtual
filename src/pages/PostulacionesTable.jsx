import React, { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import "./PostulacionesTable.css";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

const PostulacionesTable = () => {
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [editingObservation, setEditingObservation] = useState("");

  // Observation Modal Handlers
  const openObservationModal = (observation, id) => {
    setSelectedObservation({ id, observation });
    setEditingObservation(observation || "");
  };

  const closeObservationModal = () => {
    setSelectedObservation(null);
    setEditingObservation("");
  };

  const saveObservation = async (id) => {
    try {
      await handleObservacionBlur(id, editingObservation);
      setPostulaciones((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, observacion_BD: editingObservation } : item
        )
      );
      closeObservationModal();
    } catch (error) {
      console.error("Error al guardar la observación:", error);
    }
  };

  const deleteObservation = async (id) => {
    try {
      await handleObservacionBlur(id, "");
      setPostulaciones((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, observacion_BD: "" } : item
        )
      );
      closeObservationModal();
    } catch (error) {
      console.error("Error al eliminar la observación:", error);
    }
  };

  // Custom Styles for DataTable
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#210d65",
        borderRadius: "8px 8px 0 0",
      },
    },
    headCells: {
      style: {
        color: "#fff",
        fontSize: "14px",
        fontWeight: "600",
        padding: "12px",
        textTransform: "uppercase",
      },
    },
    cells: {
      style: {
        padding: "10px",
        fontSize: "13px",
        color: "#333",
      },
    },
    rows: {
      style: {
        "&:nth-child(even)": {
          backgroundColor: "#f9fafb",
        },
        "&:hover": {
          backgroundColor: "#e5e7eb",
        },
      },
    },
  };

  // Format Date
  const formatFecha = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toISOString().split("T")[0];
  };

  // Fetch Postulaciones
  useEffect(() => {
    const fetchPostulaciones = async () => {
      try {
        const response = await fetch(
          "https://backend-mk.vercel.app/api/postulaciones"
        );
        const data = await response.json();
        setPostulaciones(data.data || []);
      } catch (error) {
        console.error("Error al obtener las postulaciones:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPostulaciones();
  }, []);

  // Download Handler
  const handleDownload = async (filePath) => {
    try {
      const response = await fetch(
        `https://backend-mk.vercel.app/api/descargar/${filePath}`
      );
      if (!response.ok) throw new Error("Error al descargar el archivo");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filePath.split("/").pop());
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error durante la descarga:", err.message);
    }
  };

  // Check Handler
  const handleCheckChange = async (id, newValue) => {
    try {
      setPostulaciones((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, check_BD: newValue } : item
        )
      );
      const response = await fetch(
        `https://backend-mk.vercel.app/api/postulaciones/${id}/check`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ check_BD: newValue }),
        }
      );
      if (!response.ok) throw new Error("Error al actualizar en la base de datos.");
    } catch (error) {
      console.error(`Error al actualizar la fila ${id}:`, error.message);
    }
  };

  // Observation Handlers
  const handleObservacionChange = (id, newValue) => {
    setPostulaciones((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, observacion_BD: newValue } : item
      )
    );
  };

  const handleObservacionBlur = async (id, newValue) => {
    try {
      const response = await fetch(
        `https://backend-mk.vercel.app/api/postulaciones/${id}/observacion`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ observacion_BD: newValue }),
        }
      );
      if (!response.ok) throw new Error("Error al actualizar observacion_BD.");
    } catch (error) {
      console.error(`Error al actualizar observación para la fila ${id}:`, error.message);
    }
  };

  // Estado Handler
  const estadosDisponibles = [
    "Postulado",
    "Preseleccionado",
    "Entrevista",
    "Documentación",
    "Contratado",
    "Rechazado",
  ];

  const handleEstadoChange = async (id, nuevoEstado) => {
    try {
      setPostulaciones((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, estado: nuevoEstado } : item
        )
      );
      const response = await fetch(
        `https://backend-mk.vercel.app/api/postulaciones/${id}/estado`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );
      if (!response.ok) throw new Error("Error al actualizar el estado.");
    } catch (error) {
      console.error(`Error al actualizar estado para la fila ${id}:`, error.message);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (postulaciones.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(postulaciones);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Postulaciones");
    XLSX.writeFile(workbook, "Postulaciones.xlsx");
  };

  // Filtered and Sorted Data
  const filteredItems = postulaciones.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  const sortedItems = useMemo(
    () =>
      [...filteredItems].sort(
        (a, b) => new Date(b.fechaPostulacion) - new Date(a.fechaPostulacion)
      ),
    [filteredItems]
  );

  // Loading and Empty States
  if (loading) return <p className="loading-text">Cargando datos...</p>;
  if (!postulaciones || postulaciones.length === 0) {
    return <p className="empty-text">No hay postulaciones disponibles.</p>;
  }

  // Format Header
  const formatHeader = (header) => {
    let formatted = header.replace(/_/g, " ");
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    return formatted;
  };

  // Columns
  const baseColumns = Object.keys(postulaciones[0])
    .filter(
      (key) =>
        key !== "created_at" &&
        key !== "check_BD" &&
        key !== "observacion_BD" &&
        key !== "estado" // Excluir la columna de estado no editable
    )
    .map((key) => {
      if (key === "hojaVida") {
        return {
          name: "Hojas de Vida",
          cell: (row) =>
            row.hojaVida && (
              <button
                onClick={() =>
                  handleDownload(
                    row.hojaVida.replace(
                      "https://pitpougbnibmfrjykzet.supabase.co/storage/v1/object/public/",
                      ""
                    )
                  )
                }
                className="download-button"
              >
                Descargar
              </button>
            ),
          center: "true",
          width: "120px",
        };
      } else {
        return {
          name: formatHeader(key),
          selector: (row) =>
            key.includes("fecha") && row[key]
              ? formatFecha(row[key])
              : row[key],
          sortable: key === "id",
          wrap: true,
          width: key === "id" ? "80px" : undefined,
        };
      }
    });

  const estadoColumn = {
    name: "Estado",
    cell: (row) => (
      <select
        value={row.estado || "Postulado"}
        onChange={(e) => handleEstadoChange(row.id, e.target.value)}
        className="estado-select"
        aria-label={`Estado de la postulación ${row.id}`}
      >
        {estadosDisponibles.map((estado) => (
          <option key={estado} value={estado}>
            {estado}
          </option>
        ))}
      </select>
    ),
    center: "true",
    width: "150px",
  };

  const checkColumn = {
    name: "Revisado",
    cell: (row) => (
      <label className="checkbox-container">
        <input
          type="checkbox"
          checked={row.check_BD}
          onChange={(e) => handleCheckChange(row.id, e.target.checked)}
          aria-label={`Revisado para la postulación ${row.id}`}
        />
        <span className="checkmark"></span>
      </label>
    ),
    center: "true",
    width: "100px",
  };

  const observacionColumn = {
    name: "Observación",
    cell: (row) => (
      <div
        onClick={() => openObservationModal(row.observacion_BD, row.id)}
        className="editable-observation"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && openObservationModal(row.observacion_BD, row.id)}
      >
        {row.observacion_BD || "Editar ✏️"}
      </div>
    ),
    width: "200px",
  };

  const columns = [...baseColumns, estadoColumn, checkColumn, observacionColumn];

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) setFilterText("");
  };

  return (
    <div className="postulaciones-container">
      <header className="table-header">
        <Link to="/" className="back-logo">
          <img src="/mkicono.webp" alt="Logo Merkahorro" className="logo-image" />
        </Link>
        <h2>Postulaciones</h2>
      </header>

      <DataTable
        columns={columns}
        data={sortedItems}
        pagination
        highlightOnHover
        pointerOnHover
        striped
        responsive
        subHeader
        customStyles={customStyles}
        subHeaderComponent={
          <div className="busqueda-container">
            <button
              className="busqueda-boton"
              onClick={toggleSearch}
              aria-label={showSearch ? "Cerrar búsqueda" : "Abrir búsqueda"}
            >
              <FaSearch />
            </button>
            <input
              type="text"
              placeholder="Buscar..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className={`busqueda-input ${showSearch ? "active" : ""}`}
              aria-label="Filtrar postulaciones"
            />
          </div>
        }
      />

      <button onClick={exportToExcel} className="excel-button">
        Exportar a Excel
      </button>

      {selectedObservation && (
        <div className="modal-overlay" onClick={closeObservationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Editar Observación</h3>
            <textarea
              value={editingObservation}
              onChange={(e) => setEditingObservation(e.target.value)}
              placeholder="Escribe tu observación aquí..."
              aria-label="Observación de la postulación"
            />
            <div className="modal-buttons">
              <button
                onClick={() => saveObservation(selectedObservation.id)}
                className="save-observation-button"
              >
                Guardar
              </button>
              <button
                onClick={() => deleteObservation(selectedObservation.id)}
                className="delete-observation-button"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { PostulacionesTable };