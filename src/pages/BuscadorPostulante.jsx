import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BuscadorPostulante.css";

const BuscadorPostulante = () => {
  const [documento, setDocumento] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!documento) {
      setError("Por favor, ingresa tu número de documento.");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate(`/postulante/${documento}`);
    } catch (err) {
      setError("Ocurrió un error. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setDocumento("");
    setError("");
  };

  return (
    <div className="buscador-container">
      {/* Logo */}
      <img src="/logoMK.webp" alt="Logo Merkahorro" className="buscador-logo" />
      
      <h2>Consulta el estado de tu postulación</h2>
      <p className="buscador-subtitle">
        Ingresa tu número de documento para verificar el estado de tu solicitud.
        <span className="tooltip">
          <span className="tooltip-icon">?</span>
          <span className="tooltip-text">
            Usa el número de documento registrado en tu postulación.
          </span>
        </span>
      </p>

      <form onSubmit={handleSubmit} className="buscador-form" noValidate>
        <div className="form-group">
          <label htmlFor="documento" className="form-label">
            Número de documento
          </label>
          <input
            id="documento"
            type="text"
            placeholder="Ej. 123456789"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            className={error ? "input-error" : ""}
            aria-describedby={error ? "error-message" : undefined}
            disabled={isLoading}
          />
          {error && (
            <span id="error-message" className="error-message">
              {error}
            </span>
          )}
        </div>

        <div className="button-group">
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className="spinner"></span>
            ) : (
              "Consultar"
            )}
          </button>
          <button
            type="button"
            className="clear-button"
            onClick={handleClear}
            disabled={isLoading || !documento}
          >
            Limpiar
          </button>
        </div>
      </form>

      <footer className="buscador-footer">
        <p>
          ¿Necesitas ayuda?{" "}
          <a
            href="https://wa.me/+573042607206"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contáctanos
          </a>
        </p>
      </footer>
    </div>
  );
};

export { BuscadorPostulante };