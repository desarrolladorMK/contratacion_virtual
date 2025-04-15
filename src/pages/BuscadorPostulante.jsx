// BuscadorPostulante.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BuscadorPostulante.css"; 
const BuscadorPostulante = () => {
  const [documento, setDocumento] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!documento) return alert("Ingresa tu número de documento");
    navigate(`/postulante/${documento}`);
  };
  console.log("Documento recibido:", documento);

  return (
    <div className="buscador-container">
      <h2>Consulta el estado de tu postulación</h2>
      <form onSubmit={handleSubmit} className="buscador-form">
        <input
          type="text"
          placeholder="Número de documento"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
        />
        <button type="submit">Consultar</button>
      </form>
    </div>
  );
};

export {BuscadorPostulante};
