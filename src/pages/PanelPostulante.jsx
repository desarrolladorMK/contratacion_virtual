// PanelPostulante.jsx (con contador de documentos subidos vs requeridos)
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../client";
import "./PanelPostulante.css";

const tiposDocumento = [
  { tipo: "hoja_vida", label: "Hoja de vida", categoria: "principal" },
  { tipo: "cedula_ampliada", label: "Cédula ampliada al 150%", categoria: "principal" },
  { tipo: "certificados_estudio", label: "Certificados de estudio", categoria: "principal" },
  { tipo: "certificados_laborales", label: "Certificados laborales", categoria: "principal" },
  { tipo: "cuenta_bancaria", label: "Certificado cuenta Bancolombia", categoria: "principal" },
  { tipo: "afiliacion_eps_pension", label: "Afiliación EPS y pensión", categoria: "principal" },
  { tipo: "afiliacion_funeraria", label: "Afiliación funeraria", categoria: "principal" },
  { tipo: "antecedentes_judiciales", label: "Antecedentes judiciales", categoria: "principal" },
  { tipo: "licencia_conduccion", label: "Licencia de conducción", categoria: "principal" },
];

const PanelPostulante = () => {
  const { documento } = useParams();
  const [postulacion, setPostulacion] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [documentos, setDocumentos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const docLimpio = documento.trim();
      const { data, error } = await supabase
        .from("Postulaciones")
        .select("*")
        .eq("numeroDocumento", docLimpio)
        .single();

      if (!error) {
        setPostulacion(data);
        fetchDocumentos(data.id);
      } else {
        console.log("Error Supabase:", error);
      }
    };

    fetchData();
  }, [documento]);

  const fetchDocumentos = async (postulacionId) => {
    const { data } = await supabase
      .from("documentos_postulante")
      .select("*")
      .eq("postulacion_id", postulacionId);
    setDocumentos(data || []);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!archivo || !tipoSeleccionado || !postulacion) return;

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("postulacion_id", postulacion.id);
    formData.append("tipo", tipoSeleccionado);
    formData.append("categoria", "principal");

    try {
      const response = await fetch("https://backend-mk.vercel.app/api/documentos", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert("Documento subido correctamente");
        setArchivo(null);
        setTipoSeleccionado("");
        document.getElementById("archivo").value = "";
        fetchDocumentos(postulacion.id);
      } else {
        alert("Error al subir documento: " + result.message);
      }
    } catch (err) {
      console.error("Error al subir:", err.message);
      alert("Error inesperado al subir el archivo.");
    }
  };

  const getLabelByTipo = (tipo) => {
    const doc = tiposDocumento.find((t) => t.tipo === tipo);
    return doc ? doc.label : tipo;
  };

  const documentosSubidos = documentos.map((d) => d.tipo);
  const faltantes = tiposDocumento.filter((t) => !documentosSubidos.includes(t.tipo));

  if (!postulacion) return <p>No se encontró la postulación con el documento: {documento}</p>;

  return (
    <div className="panel-postulante">
      <h2>Seguimiento de Postulación</h2>
      <p><strong>Nombre:</strong> {postulacion.nombreApellido}</p>
      <p><strong>Estado actual:</strong> {postulacion.estado}</p>

      {postulacion.estado === "Documentación" && (
        <form onSubmit={handleUpload} className="form-subida">
          <h4>Subir documentos requeridos</h4>
          <input
            type="file"
            id="archivo"
            onChange={(e) => setArchivo(e.target.files[0])}
            required
          />
          <select
            value={tipoSeleccionado}
            onChange={(e) => setTipoSeleccionado(e.target.value)}
            required
          >
            <option value="">Selecciona el tipo de documento</option>
            {tiposDocumento.map((item) => (
              <option key={item.tipo} value={item.tipo}>
                {item.label}
              </option>
            ))}
          </select>
          <button type="submit">Subir</button>
        </form>
      )}

      <div className="contador-documentos">
        <h4>Progreso:</h4>
        <p>
          Documentos subidos: {documentos.length} / {tiposDocumento.length}
        </p>
        {faltantes.length > 0 && (
          <ul>
            <p>Documentos faltantes:</p>
            {faltantes.map((f) => (
              <li key={f.tipo}>{f.label}</li>
            ))}
          </ul>
        )}
      </div>

      {(documentos ?? []).length > 0 && (
        <div className="lista-documentos">
          <h4>Documentos Subidos</h4>
          <ul>
            {documentos.map((doc) => (
              <li key={doc.id}>
                {getLabelByTipo(doc.tipo)}: <a href={doc.url} target="_blank" rel="noreferrer">Ver archivo</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export {PanelPostulante};
