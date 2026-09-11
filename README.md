# MVP Rentabilidad Fulfilment

Calculadora operativa y comercial para estimar márgenes de fulfilment por cliente: Preparación (Pack + 1er Pick), picks adicionales, incidencias, almacenamiento y envío.

Permite modificar costes, precios y márgenes porcentuales (estilo Carrier) en tiempo real y cotizar cliente por cliente.

---

## 🚀 Despliegue

Este repositorio está preparado para funcionar **tanto en Vercel como en Streamlit Cloud**:

### 1. Despliegue en Vercel (Aplicación Web React + TypeScript)
- Conecta el repositorio en [Vercel](https://vercel.com).
- Vercel detecta automáticamente la configuración mediante `vercel.json` o plantilla Vite:
  - **Framework Preset**: Vite
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
- Despliega al instante con alta velocidad y soporte offline/localStorage.

### 2. Despliegue en Streamlit Cloud (Python)
- Conecta el repositorio en [Streamlit Community Cloud](https://share.streamlit.io).
- Configura:
  - **Main file path**: `app.py`
  - **Python dependencies**: detectadas automáticamente desde `requirements.txt`
- Ejecutará el dashboard de Streamlit nativamente.

---

## 💻 Ejecutar en local

### Opción A: Frontend React (Vite)
```bash
npm install
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000).

### Opción B: Streamlit (Python)
```bash
pip install -r requirements.txt
streamlit run app.py
```
