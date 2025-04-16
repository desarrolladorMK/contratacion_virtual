import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { supabase } from "../client";
import "./PanelPostulante.css";

const tiposDocumento = [
  {
    tipo: "hoja_vida",
    label: "Hoja de vida Merkahorro",
    categoria: "principal",
    mandatory: true,
  },
  {
    tipo: "cedula_ampliada",
    label: "Cédula ampliada al 150%",
    categoria: "principal",
  },
  {
    tipo: "certificados_estudio",
    label: "Certificados de estudios",
    categoria: "principal",
    multiple: true,
  },
  {
    tipo: "certificados_laborales",
    label: "Certificados laborales (últimos 2 empleos)",
    categoria: "principal",
    multiple: true,
  },
  {
    tipo: "cuenta_bancaria",
    label: "Certificado cuenta Bancolombia",
    categoria: "principal",
  },
  {
    tipo: "afiliacion_eps_pension",
    label: "Afiliación EPS y pensión",
    categoria: "principal",
  },
  {
    tipo: "afiliacion_funeraria",
    label: "Afiliación funeraria",
    categoria: "principal",
  },
  {
    tipo: "antecedentes_judiciales",
    label: "Antecedentes judiciales (Procuraduría y Policía, <30 días)",
    categoria: "principal",
    mandatory: true,
  },
  {
    tipo: "licencia_conduccion",
    label: "Licencia de conducción (solo conductores)",
    categoria: "principal",
  },
];

const tiposBeneficiario = [
  {
    tipo: "registro_civil_hijo",
    label: "Registro civil de nacimiento (hijo <7 años)",
    categoria: "beneficiario",
  },
  {
    tipo: "tarjeta_identidad_hijo",
    label: "Tarjeta de identidad (hijo ≥7 años)",
    categoria: "beneficiario",
  },
  {
    tipo: "certificado_estudio_hijo",
    label: "Certificado de estudio (hijo ≥12 años)",
    categoria: "beneficiario",
  },
  {
    tipo: "registro_civil_matrimonio",
    label: "Registro civil de matrimonio (cónyuge)",
    categoria: "beneficiario",
  },
  {
    tipo: "cedula_conyuge",
    label: "Cédula ampliada al 150% (cónyuge/pareja)",
    categoria: "beneficiario",
  },
  {
    tipo: "registro_civil_empleado",
    label: "Registro civil de nacimiento (empleado, para padres)",
    categoria: "beneficiario",
  },
  {
    tipo: "cedula_padres",
    label: "Cédula ampliada al 150% (padres)",
    categoria: "beneficiario",
  },
];

const PanelPostulante = () => {
  const { documento } = useParams();
  const [postulacion, setPostulacion] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [archivosSeleccionados, setArchivosSeleccionados] = useState([]);
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [error, setError] = useState(null);
  const { handleSubmit, reset } = useForm();

  const fetchData = useCallback(async () => {
    try {
      const docLimpio = documento.trim();
      const { data, error } = await supabase
        .from("Postulaciones")
        .select("*")
        .eq("numeroDocumento", docLimpio)
        .single();

      if (error) throw error;
      setPostulacion(data);
      await fetchDocumentos(data.id);
    } catch (err) {
      console.error("Error Supabase:", err);
      setError("No se pudo cargar la postulación. Intenta de nuevo.");
    }
  }, [documento]);

  const fetchDocumentos = useCallback(async (postulacionId) => {
    const { data, error } = await supabase
      .from("documentos_postulante")
      .select("*")
      .eq("postulacion_id", postulacionId);
    if (error) throw error;
    setDocumentos(data || []);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onDrop = useCallback((acceptedFiles, tipo, beneficiarioId = null) => {
    const nuevoArchivo = {
      tipo,
      archivo: acceptedFiles[0],
      nombre: acceptedFiles[0].name,
      beneficiarioId,
    };
    setArchivosSeleccionados((prev) => {
      const exists = prev.find(
        (item) => item.tipo === tipo && item.beneficiarioId === beneficiarioId
      );
      if (
        exists &&
        !tiposDocumento.find((doc) => doc.tipo === tipo)?.multiple
      ) {
        return prev.map((item) =>
          item.tipo === tipo && item.beneficiarioId === beneficiarioId
            ? nuevoArchivo
            : item
        );
      }
      return [...prev, nuevoArchivo];
    });
  }, []);

  const eliminarArchivo = useCallback((tipo, beneficiarioId = null) => {
    setArchivosSeleccionados((prev) =>
      prev.filter(
        (item) =>
          !(item.tipo === tipo && item.beneficiarioId === beneficiarioId)
      )
    );
  }, []);

  const eliminarDocumentoSubido = useCallback(
    async (docId) => {
      if (
        !window.confirm("¿Estás seguro de que deseas eliminar este documento?")
      )
        return;
      try {
        const response = await fetch(
          `https://backend-mk.vercel.app/api/documentos/${docId}`,
          {
            method: "DELETE",
          }
        );
        const result = await response.json();
        if (response.ok) {
          alert("Documento eliminado correctamente.");
          await fetchDocumentos(postulacion.id);
        } else {
          throw new Error(result.message || "Error al eliminar el documento");
        }
      } catch (err) {
        console.error("Error al eliminar:", err);
        alert(`Error al eliminar el documento: ${err.message}`);
      }
    },
    [postulacion, fetchDocumentos]
  );

  const validateMandatoryDocuments = useCallback(() => {
    const mandatoryTypes = tiposDocumento
      .filter((doc) => doc.mandatory)
      .map((doc) => doc.tipo);
    const uploadedMandatory = documentos
      .filter((doc) => mandatoryTypes.includes(doc.tipo))
      .map((doc) => doc.tipo);
    const selectedMandatory = archivosSeleccionados
      .filter((file) => mandatoryTypes.includes(file.tipo))
      .map((file) => file.tipo);
    return mandatoryTypes.every(
      (tipo) =>
        uploadedMandatory.includes(tipo) || selectedMandatory.includes(tipo)
    );
  }, [documentos, archivosSeleccionados]);

  const validateBeneficiarios = useCallback(() => {
    return beneficiarios.every(
      (ben) =>
        ben.nombre.trim() &&
        (ben.tipo !== "hijo" || (ben.edad && ben.edad >= 0))
    );
  }, [beneficiarios]);

  const onSubmit = async () => {
    if (archivosSeleccionados.length === 0) {
      alert("Por favor, selecciona al menos un documento para enviar.");
      return;
    }

    if (!validateMandatoryDocuments()) {
      alert(
        "Debes subir los documentos obligatorios: Hoja de vida y Antecedentes judiciales."
      );
      return;
    }

    if (!validateBeneficiarios()) {
      alert(
        "Todos los beneficiarios deben tener un nombre. Para hijos, la edad debe ser válida."
      );
      return;
    }

    const formData = new FormData();
    archivosSeleccionados.forEach((item) => {
      formData.append("archivos", item.archivo);
      formData.append("tipos", item.tipo);
      formData.append("beneficiarioIds", item.beneficiarioId || "");
      formData.append(
        "categorias",
        [...tiposDocumento, ...tiposBeneficiario].find(
          (doc) => doc.tipo === item.tipo
        )?.categoria || "principal"
      );
    });
    formData.append("postulacion_id", postulacion.id);

    console.log("FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(
        `${key}:`,
        value instanceof File ? `${value.name} (${value.size} bytes)` : value
      );
    }

    try {
      const response = await fetch(
        "https://backend-mk.vercel.app/api/documentos/multiple",
        {
          method: "POST",
          body: formData,
        }
      );
      const result = await response.json();
      if (response.ok) {
        alert(
          `Se subieron ${archivosSeleccionados.length} documento(s) correctamente.`
        );
        setArchivosSeleccionados([]);
        reset();
        await fetchDocumentos(postulacion.id);
      } else {
        throw new Error(
          result.message || "Error desconocido al subir documentos"
        );
      }
    } catch (err) {
      console.error("Error al subir:", err);
      alert(
        `Error al subir los documentos: ${err.message}. Por favor, revisa los archivos e intenta de nuevo.`
      );
    }
  };

  const addBeneficiario = useCallback((tipo) => {
    setBeneficiarios((prev) => [
      ...prev,
      { id: Date.now(), tipo, nombre: "", edad: "" },
    ]);
  }, []);

  const updateBeneficiario = useCallback((id, field, value) => {
    setBeneficiarios((prev) =>
      prev.map((ben) => (ben.id === id ? { ...ben, [field]: value } : ben))
    );
  }, []);

  const removeBeneficiario = useCallback((id) => {
    setBeneficiarios((prev) => prev.filter((ben) => ben.id !== id));
    setArchivosSeleccionados((prev) =>
      prev.filter((file) => file.beneficiarioId !== id)
    );
  }, []);

  const getLabelByTipo = useCallback((tipo) => {
    const doc = [...tiposDocumento, ...tiposBeneficiario].find(
      (t) => t.tipo === tipo
    );
    return doc ? doc.label : tipo;
  }, []);

  const documentosSubidos = documentos.map((d) => ({
    tipo: d.tipo,
    beneficiarioId: d.beneficiarioId,
  }));
  const faltantes = tiposDocumento.filter(
    (t) => !t.multiple && !documentosSubidos.some((d) => d.tipo === t.tipo)
  );

  if (error) return <p className="error">{error}</p>;
  if (!postulacion) return <p>Cargando postulación...</p>;

  return (
    <div className="panel-postulante">
      <div className="welcome-message">¡Bienvenido(a) a Merkahorro!</div>
      <h2>Seguimiento de Postulación</h2>
      <p>
        <strong>Nombre:</strong> {postulacion.nombreApellido}
      </p>
      <p>
        <strong>Estado actual:</strong> {postulacion.estado}
      </p>

      {postulacion.estado === "Documentación" && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="form-subida"
          aria-label="Formulario de subida de documentos"
        >
          <h4>Subir documentos requeridos</h4>
          <p className="instrucciones">
            Sube los documentos requeridos. Los marcados con{" "}
            <span className="mandatory">*</span> son obligatorios para el primer
            envío. Puedes cargar múltiples archivos para algunos tipos (ej.
            certificados de estudio).
          </p>

          <h5>Documentos Principales</h5>
          <div className="documentos-grid">
            {tiposDocumento.map((item) => (
              <div key={item.tipo} className="documento-item">
                <label>
                  {item.label}{" "}
                  {item.mandatory && (
                    <span className="mandatory" aria-label="Obligatorio">
                      *
                    </span>
                  )}
                  {item.multiple && (
                    <span
                      className="multiple"
                      aria-label="Múltiples archivos permitidos"
                    >
                      (puedes subir varios)
                    </span>
                  )}
                </label>
                {item.multiple ? (
                  <MultipleDropzoneArea
                    tipo={item.tipo}
                    onDrop={onDrop}
                    archivosSeleccionados={archivosSeleccionados.filter(
                      (a) => a.tipo === item.tipo
                    )}
                    eliminarArchivo={eliminarArchivo}
                  />
                ) : documentosSubidos.some((d) => d.tipo === item.tipo) ? (
                  <p className="subido" aria-label="Documento subido">
                    Documento ya subido
                  </p>
                ) : (
                  <DropzoneArea
                    tipo={item.tipo}
                    onDrop={onDrop}
                    archivoSeleccionado={archivosSeleccionados.find(
                      (a) => a.tipo === item.tipo
                    )}
                    eliminarArchivo={eliminarArchivo}
                  />
                )}
              </div>
            ))}
          </div>

          <h5>Documentos de Beneficiarios</h5>
          <p className="optional-message">
            La adición de beneficiarios es opcional. Si desea incluirlos,
            seleccione el tipo de beneficiario y cargue los documentos
            correspondientes.
          </p>
          <div className="beneficiarios-section">
            <div className="beneficiario-buttons">
              <button
                type="button"
                className="add-beneficiario"
                onClick={() => addBeneficiario("hijo")}
                aria-label="Agregar hijo como beneficiario"
              >
                Agregar Hijo
              </button>
              <button
                type="button"
                className="add-beneficiario"
                onClick={() => addBeneficiario("conyuge")}
                aria-label="Agregar cónyuge o pareja como beneficiario"
              >
                Agregar Cónyuge/Pareja
              </button>
              <button
                type="button"
                className="add-beneficiario"
                onClick={() => addBeneficiario("padres")}
                aria-label="Agregar padres como beneficiarios"
              >
                Agregar Padres
              </button>
            </div>

            {beneficiarios.map((ben) => (
              <div
                key={ben.id}
                className="beneficiario-item"
                aria-label={`Beneficiario ${ben.tipo}`}
              >
                <h6>
                  {ben.tipo === "hijo"
                    ? "Hijo"
                    : ben.tipo === "conyuge"
                    ? "Cónyuge/Pareja"
                    : "Padres"}
                </h6>
                <input
                  type="text"
                  placeholder="Nombre del beneficiario"
                  value={ben.nombre}
                  onChange={(e) =>
                    updateBeneficiario(ben.id, "nombre", e.target.value)
                  }
                  required
                  aria-label="Nombre del beneficiario"
                />
                {ben.tipo === "hijo" && (
                  <input
                    type="number"
                    placeholder="Edad"
                    value={ben.edad}
                    onChange={(e) =>
                      updateBeneficiario(ben.id, "edad", e.target.value)
                    }
                    min="0"
                    required
                    aria-label="Edad del hijo"
                  />
                )}
                <button
                  type="button"
                  className="remove-beneficiario"
                  onClick={() => removeBeneficiario(ben.id)}
                  aria-label="Eliminar beneficiario"
                >
                  Eliminar
                </button>

                {ben.tipo === "hijo" && (
                  <div className="beneficiario-docs">
                    {(ben.edad < 7
                      ? ["registro_civil_hijo"]
                      : ben.edad >= 12
                      ? [
                          "registro_civil_hijo",
                          "tarjeta_identidad_hijo",
                          "certificado_estudio_hijo",
                        ]
                      : ["registro_civil_hijo", "tarjeta_identidad_hijo"]
                    ).map((tipo) => (
                      <div key={tipo} className="documento-item">
                        <label>{getLabelByTipo(tipo)}</label>
                        <DropzoneArea
                          tipo={tipo}
                          onDrop={(files) => onDrop(files, tipo, ben.id)}
                          archivoSeleccionado={archivosSeleccionados.find(
                            (a) =>
                              a.tipo === tipo && a.beneficiarioId === ben.id
                          )}
                          eliminarArchivo={() => eliminarArchivo(tipo, ben.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {ben.tipo === "conyuge" && (
                  <div className="beneficiario-docs">
                    {["registro_civil_matrimonio", "cedula_conyuge"].map(
                      (tipo) => (
                        <div key={tipo} className="documento-item">
                          <label>{getLabelByTipo(tipo)}</label>
                          <DropzoneArea
                            tipo={tipo}
                            onDrop={(files) => onDrop(files, tipo, ben.id)}
                            archivoSeleccionado={archivosSeleccionados.find(
                              (a) =>
                                a.tipo === tipo && a.beneficiarioId === ben.id
                            )}
                            eliminarArchivo={() =>
                              eliminarArchivo(tipo, ben.id)
                            }
                          />
                        </div>
                      )
                    )}
                  </div>
                )}

                {ben.tipo === "padres" && (
                  <div className="beneficiario-docs">
                    {["registro_civil_empleado", "cedula_padres"].map(
                      (tipo) => (
                        <div key={tipo} className="documento-item">
                          <label>{getLabelByTipo(tipo)}</label>
                          <DropzoneArea
                            tipo={tipo}
                            onDrop={(files) => onDrop(files, tipo, ben.id)}
                            archivoSeleccionado={archivosSeleccionados.find(
                              (a) =>
                                a.tipo === tipo && a.beneficiarioId === ben.id
                            )}
                            eliminarArchivo={() =>
                              eliminarArchivo(tipo, ben.id)
                            }
                          />
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={archivosSeleccionados.length === 0}
            className={archivosSeleccionados.length === 0 ? "disabled" : ""}
            aria-label="Enviar documentos seleccionados"
          >
            Enviar documentos seleccionados ({archivosSeleccionados.length}/
            {faltantes.length} faltantes)
          </button>
        </form>
      )}

      <div className="contador-documentos">
        <h4>Progreso de Documentos</h4>
        <p>
          Has subido <strong>{documentos.length}</strong> documentos.
        </p>
        {faltantes.length > 0 ? (
          <div className="faltantes-container">
            <h5>Documentos principales faltantes ({faltantes.length}):</h5>
            <ul
              className="faltantes-lista"
              aria-label="Lista de documentos faltantes"
            >
              {faltantes.map((f) => (
                <li key={f.tipo}>
                  <span className="faltante-item">{f.label}</span>
                  <span className="faltante-info"> - Pendiente de carga</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="completado" aria-label="Todos los documentos subidos">
            ¡Todos los documentos principales han sido subidos!
          </p>
        )}
      </div>

      {documentos.length > 0 && (
        <div className="lista-documentos">
          <h4>Documentos Subidos</h4>
          <ul
            className="documentos-lista"
            aria-label="Lista de documentos subidos"
          >
            {documentos.map((doc) => (
              <li key={doc.id} className="documento-subido-item">
                <span>
                  {getLabelByTipo(doc.tipo)}
                  {doc.beneficiarioId &&
                    ` (Beneficiario ID: ${doc.beneficiarioId})`}
                  :{" "}
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ver-archivo"
                  >
                    Ver archivo
                  </a>
                </span>
                <button
                  className="eliminar-documento"
                  onClick={() => eliminarDocumentoSubido(doc.id)}
                  aria-label={`Eliminar documento ${getLabelByTipo(doc.tipo)}`}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const DropzoneArea = ({
  tipo,
  onDrop,
  archivoSeleccionado,
  eliminarArchivo,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, tipo),
    maxFiles: 1,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
  });

  return (
    <div className="dropzone">
      <div
        {...getRootProps()}
        className={`dropzone-area ${isDragActive ? "active" : ""}`}
        aria-label="Área de carga de archivos"
      >
        <input {...getInputProps()} />
        {archivoSeleccionado ? (
          <div className="archivo-seleccionado">
            <p title={archivoSeleccionado.nombre}>
              {archivoSeleccionado.nombre}
            </p>
            <button
              type="button"
              onClick={() => eliminarArchivo(tipo)}
              aria-label="Eliminar archivo seleccionado"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <p>
            Arrastra un archivo o haz clic para seleccionar (PDF, imágenes,
            Word)
          </p>
        )}
      </div>
    </div>
  );
};

const MultipleDropzoneArea = ({
  tipo,
  onDrop,
  archivosSeleccionados,
  eliminarArchivo,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, tipo),
    maxFiles: 1,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
  });

  return (
    <div className="multiple-dropzone">
      <div
        {...getRootProps()}
        className={`dropzone-area ${isDragActive ? "active" : ""}`}
        aria-label="Área de carga de archivos múltiples"
      >
        <input {...getInputProps()} />
        <p>Arrastra un archivo o haz clic para agregar otro</p>
      </div>
      {archivosSeleccionados.map((file, index) => (
        <div key={index} className="archivo-seleccionado">
          <p>{file.nombre}</p>
          <button
            onClick={() => eliminarArchivo(tipo)}
            aria-label="Cancelar archivo seleccionado"
          >
            Cancelar
          </button>
        </div>
      ))}
    </div>
  );
};

export { PanelPostulante };
