(() => {
  if (typeof window === 'undefined' || window.__NUSA_HOME_CLEANUP__) return;
  window.__NUSA_HOME_CLEANUP__ = true;

  function cleanHome() {
    document.querySelectorAll('.nusa-panel').forEach((panel) => {
      const text = panel.textContent || '';
      const isGeneratedSummary = text.includes('Ver itinerario') && (text.includes('Regenerar con estos datos') || text.includes('Empezar de cero'));
      if (isGeneratedSummary) panel.remove();
    });

    document.querySelectorAll('p').forEach((p) => {
      const text = p.textContent || '';
      if (text.includes('Viene con un ejemplo de Indonesia')) {
        p.textContent = 'Selecciona destino, duración, viajeros, presupuesto, ritmo, alojamiento, transporte, comidas, intereses y restricciones para generar el itinerario.';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', cleanHome);
  new MutationObserver(cleanHome).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(cleanHome, 300);
  setTimeout(cleanHome, 1200);
})();
