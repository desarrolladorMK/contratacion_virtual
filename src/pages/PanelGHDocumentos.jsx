
import React, { useEffect, useState } from "react";
import { supabase } from "../client";
import "./PanelGHDocumentos.css";

const PanelGHDocumentos = () => {
  const [postulaciones, setPostulaciones] = useState([]);
  const [documentos, setDocumentos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: postulantes } = await supabase
        .from("Postulaciones")
        .select("*");

      const { data: archivos } = await supabase
        .from("documentos_postulante")
        .select("*");

      const agrupados = archivos?.reduce((acc, doc) => {
        if (!acc[doc.postulacion_id]) acc[doc.postulacion_id] = [];
        acc[doc.postulacion_id].push(doc);
        return acc;
      }, {});

      setPostulaciones(postulantes || []);
      setDocumentos(agrupados || {});
      setLoading(false);
    };

    fetchAll();
  }, []);

  const getLabelByTipo = (tipo) => {
    const labels = {
      hoja_vida: "Hoja de Vida",
      cedula_ampliada: "Cédula",
      certificados_estudio: "Estudios",
      certificados_laborales: "Laborales",
      cuenta_bancaria: "Cuenta Bancaria",
      afiliacion_eps_pension: "EPS / Pensión",
      afiliacion_funeraria: "Funeraria",
      antecedentes_judiciales: "Antecedentes",
      licencia_conduccion: "Licencia",
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="panel-rrhh-container">
      <h2>Documentos por Postulante</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="tabla-container">
          {postulaciones.map((p) => (
            <div className="card-postulante" key={p.id}>
              <h3>{p.nombreApellido}</h3>
              <p><strong>Cargo:</strong> {p.cargo}</p>
              <p><strong>Estado:</strong> {p.estado}</p>

              <h4>Documentos:</h4>
              {documentos[p.id]?.length > 0 ? (
                <ul>
                  {documentos[p.id].map((doc) => (
                    <li key={doc.id}>
                      {getLabelByTipo(doc.tipo)}: <a href={doc.url} target="_blank" rel="noreferrer">Ver</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sin-documentos">No ha subido documentos</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export {PanelGHDocumentos};
