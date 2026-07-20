export function errorHandler(error, req, res, next) {
  console.error(error);

  // Archivo demasiado grande (express.raw)
  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: "The PDF exceeds the maximum allowed size.",
      },
    });
  }

  // Tipo de contenido inválido
  if (error.status === 415) {
    return res.status(415).json({
      success: false,
      error: {
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Only application/pdf is supported.",
      },
    });
  }

  // Error inesperado
  return res.status(error.status || 500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred.",
    },
  });
}