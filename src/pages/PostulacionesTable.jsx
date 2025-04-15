import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";
import "./PostulacionesTable.css";
import { Link } from "react-router-dom";

const PostulacionesTable = () => {
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [editingObservation, setEditingObservation] = useState("");

  // Actualiza la apertura del modal, permitiendo que el campo de observación se edite
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

      // Actualiza el estado local para reflejar los cambios inmediatamente
      setPostulaciones((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, observacion_BD: editingObservation }
            : item
        )
      );

      closeObservationModal();
    } catch (error) {
      console.error("Error al guardar la observación:", error);
    }
  };

  const deleteObservation = async (id) => {
    try {
      await handleObservacionBlur(id, ""); // Actualizar en el backend con un valor vacío

      // Actualizar el estado local para reflejar el cambio
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

  // Estilos personalizados para DataTable
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#210d65",
      },
    },
    headCells: {
      style: {
        color: "#fff",
        fontSize: "16px",
        fontWeight: "bold",
      },
    },
  };

  // Función para formatear fechas al formato 'YYYY-MM-DD'
  const formatFecha = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toISOString().split("T")[0];
  };

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

  const handleDownload = async (filePath) => {
    try {
      const response = await fetch(
        `https://backend-mk.vercel.app/api/descargar/${filePath}`
      );
      if (!response.ok) {
        throw new Error("Error al descargar el archivo");
      }
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

  // Actualizar el campo check_BD
  const handleCheckChange = async (id, newValue) => {
    try {
      // Actualiza el estado local para reflejar el cambio inmediatamente
      setPostulaciones((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, check_BD: newValue } : item
        )
      );

      // Realiza la llamada PATCH al backend
      const response = await fetch(
        `https://backend-mk.vercel.app/api/postulaciones/${id}/check`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ check_BD: newValue }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Error al actualizar en la base de datos."
        );
      }

      console.log(`Fila ${id} actualizada en la base de datos a ${newValue}`);
    } catch (error) {
      console.error(`Error al actualizar la fila ${id}:`, error.message);
    }
  };

  // Actualiza el campo observacion_BD localmente
  const handleObservacionChange = (id, newValue) => {
    setPostulaciones((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, observacion_BD: newValue } : item
      )
    );
  };

  // Actualiza el campo observacion_BD en el backend al salir del input
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
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.message || "Error al actualizar observacion_BD."
        );
      }
      console.log(`Observación actualizada para la fila ${id}`);
    } catch (error) {
      console.error(
        `Error al actualizar observación para la fila ${id}:`,
        error.message
      );
    }
  };

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

  if (loading) return <p>Cargando datos...</p>;
  if (!postulaciones || postulaciones.length === 0) {
    return <p>No hay postulaciones disponibles.</p>;
  }

  // Filtrar datos según el texto de búsqueda
  const filteredItems = postulaciones.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  // Ordenar por fechaPostulacion de forma descendente (más recientes primero)
  const sortedItems = [...filteredItems].sort(
    (a, b) => new Date(b.fechaPostulacion) - new Date(a.fechaPostulacion)
  );

  // Formatear el nombre de las columnas (capitalizando y reemplazando guiones bajos)
  const formatHeader = (header) => {
    let formatted = header.replace(/_/g, " ");
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    return formatted;
  };


  // Generar columnas dinámicamente, excluyendo los campos: created_at, check_BD y observacion_BD
  const baseColumns = Object.keys(postulaciones[0])
    .filter(
      (key) =>
        key !== "created_at" && key !== "check_BD" && key !== "observacion_BD"
    )
    .map((key) => {
      if (key === "hojaVida") {
        return {
          name: "Hojas de vida",
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
          ignoreRowClick: true,
          wrap: true,
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
        };
      }
    });


  // Columna para check_BD con checkbox centrado
  const checkColumn = {
    name: "Revisado",
    cell: (row) => (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <input
          type="checkbox"
          checked={row.check_BD}
          onChange={(e) => handleCheckChange(row.id, e.target.checked)}
        />
      </div>
    ),
    ignoreRowClick: true,
  };

  // Columna para observacion_BD con estilos mejorados
  const observacionColumn = {
    name: "Observación",
    cell: (row) => (
      <div
        onClick={() => openObservationModal(row.observacion_BD, row.id)}
        className="editable-observation"
      >
        <input
          type="text"
          value={row.observacion_BD || ""}
          onChange={(e) => handleObservacionChange(row.id, e.target.value)}
          onBlur={(e) => handleObservacionBlur(row.id, e.target.value)}
          placeholder="Editar✏️"
          readOnly
          className="editable-input"
        />
      </div>
    ),
    ignoreRowClick: true,
  };

  const estadosDisponibles = [
    "Postulado",
    "Preseleccionado",
    "Entrevista",
    "Documentación",
    "Contratado",
    "Rechazado"
  ];

  const handleEstadoChange = async (id, nuevoEstado) => {
    try {
      setPostulaciones((prev) =>
        prev.map((item) => (item.id === id ? { ...item, estado: nuevoEstado } : item))
      );

      const response = await fetch(
        `https://backend-mk.vercel.app/api/postulaciones/${id}/estado`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al actualizar el estado.");
      }

      console.log(`Estado actualizado a ${nuevoEstado} para la fila ${id}`);
    } catch (error) {
      console.error(`Error al actualizar estado para la fila ${id}:`, error.message);
    }
  };

  const estadoColumn = {
    name: "Estado",
    cell: (row) => (
      <select
        value={row.estado || "Postulado"}
        onChange={(e) => handleEstadoChange(row.id, e.target.value)}
        className="estado-select"
      >
        {estadosDisponibles.map((estado) => (
          <option key={estado} value={estado}>{estado}</option>
        ))}
      </select>
    ),
    ignoreRowClick: true,
  };

  const columns = [...baseColumns, estadoColumn, checkColumn, observacionColumn];

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) setFilterText("");
  };

  return (
    <div className="postulaciones-container">
      <Link to="/" className="back-logo">
        <img src="/mkicono.webp" alt="Logo" className="logo-image" />
      </Link>
      <h2>Postulaciones</h2>

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
            <button className="busqueda-boton" onClick={toggleSearch}>
              🔍
            </button>
            <input
              type="text"
              placeholder="Buscar..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className={`busqueda-input ${showSearch ? "active" : ""}`}
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
            <h3>Observación</h3>
            <textarea
              value={editingObservation}
              onChange={(e) => setEditingObservation(e.target.value)}
              style={{
                width: "100%",
                height: "100px",
                padding: "10px",
                fontSize: "1rem",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "10px",
              }}
            >
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
