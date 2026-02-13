#!/bin/bash
# EMIJO - Script para iniciar el juego
# Doble click en este archivo para jugar

cd "$(dirname "$0")"

echo "🎮 Iniciando EMIJO..."
echo ""

# Buscar un puerto disponible (8000-8010)
PORT=8000
while lsof -i :$PORT >/dev/null 2>&1; do
    PORT=$((PORT + 1))
    if [ $PORT -gt 8010 ]; then
        echo "❌ No hay puertos disponibles (8000-8010)"
        exit 1
    fi
done

echo "🌐 Servidor en puerto $PORT"

# Iniciar servidor en background
python3 -m http.server $PORT &
SERVER_PID=$!

# Esperar a que el servidor esté listo
sleep 1

# Abrir en el navegador
echo "🚀 Abriendo navegador..."
open "http://localhost:$PORT"

echo ""
echo "✅ EMIJO está corriendo!"
echo "   Presiona Ctrl+C para cerrar el servidor"
echo ""

# Mantener el script corriendo hasta que se cierre
trap "kill $SERVER_PID 2>/dev/null; echo ''; echo '👋 ¡Hasta luego!'; exit 0" INT
wait $SERVER_PID
