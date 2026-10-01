# Zaguán 🏠

App de alquileres en CABA, tipo Zonaprop, con un asistente de IA que recomienda propiedades.

Proyecto para **Seminario de Profundización y Actualización** · IFTS N°16 · Grupo 6 · Cheri Castañeda

## Stack

| Parte | Tecnología |
|---|---|
| Front | React + Vite + React Router + CSS propio + Font Awesome |
| Back | Node.js + Express + JWT + Multer |
| Base de datos | PostgreSQL 16 |
| Mapa | OpenStreetMap + Leaflet |
| API pública | DolarApi (cotización del dólar blue) |
| IA | Ollama local (o Groq como alternativa) |
| Infra | Ubuntu (WSL2) + Docker Compose + Nginx + cron |

## Funcionalidades

**Mínimo**
- Login con roles: inquilino y propietario
- El propietario publica, edita y borra sus propiedades con fotos
- Filtros por barrio, precio, ambientes y mascotas
- Favoritos
- Chat con IA que recomienda propiedades de la base
- Todo corriendo en Ubuntu con Docker

**Máximo**
- IA local con Ollama ✅
- Chat con memoria de la conversación ✅
- Rol admin que puede editar y borrar cualquier publicación ✅
- Mapa con OpenStreetMap ✅
- Nginx como proxy + backups automáticos con cron ✅
- Deploy en un servidor Linux real ⏳

---

## Paso a paso para levantarlo

### 1. Instalar Ubuntu en Windows (WSL2)

Abrí **PowerShell como administrador** y corré:

```powershell
wsl --install -d Ubuntu
```

Reiniciá la compu. Al abrir "Ubuntu" desde el menú inicio te pide crear un usuario y contraseña de Linux.

### 2. Instalar Docker dentro de Ubuntu

En la terminal de Ubuntu:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 cron
sudo usermod -aG docker $USER
```

Cerrá la terminal de Ubuntu y abrila de nuevo. Probá que ande:

```bash
docker run hello-world
```

### 3. Traer el proyecto a Ubuntu

Si ya está en GitHub:

```bash
cd ~
git clone https://github.com/chericastaa/zaguan.git
cd zaguan
```

Si lo tenés en un zip en Descargas (cambiá `TU_USUARIO` por tu usuario de Windows):

```bash
cd ~
cp -r /mnt/c/Users/TU_USUARIO/Downloads/zaguan ~/zaguan
cd ~/zaguan
```

> Trabajá siempre dentro de `~/zaguan` (el disco de Linux) y no en `/mnt/c/...`, porque Docker anda mucho más rápido.

### 4. Levantar todo

```bash
cp .env.example .env
chmod +x scripts/*.sh
docker compose up -d --build
```

La primera vez tarda unos minutos. Después abrí **http://localhost:8080** en el navegador de Windows.

**Usuarios de prueba** (contraseña `zaguan123`):

| Email | Rol |
|---|---|
| inquilino@zaguan.com | inquilino |
| propietario@zaguan.com | propietario |
| admin@zaguan.com | admin |

### 5. Activar la IA

El chat funciona siempre: si no hay IA configurada, entiende la búsqueda con reglas simples. Para que responda con IA de verdad:

**Opción A: IA local con Ollama** (necesita unos 4 GB de RAM libres)

```bash
./scripts/ia-local.sh
```

Descarga el modelo `qwen2.5:1.5b` (alrededor de 1 GB) y reinicia el back.

**Opción B: Groq** (si tu compu queda lenta)

1. Creá una cuenta en https://console.groq.com y generá una API key
2. En `.env` comentá la opción A y descomentá la B con tu key
3. `docker compose up -d backend`

### 6. Backups automáticos con cron

Backup manual:

```bash
./scripts/backup.sh
```

Guarda la base comprimida en `backups/` y deja solo los últimos 7.

Para que se haga solo todos los días a las 3 AM:

```bash
sudo service cron start
crontab -e
```

Y agregá esta línea al final (cambiá `TU_USUARIO_LINUX`):

```
0 3 * * * /home/TU_USUARIO_LINUX/zaguan/scripts/backup.sh >> /home/TU_USUARIO_LINUX/zaguan/backups/backup.log 2>&1
```

Para restaurar el último backup:

```bash
./scripts/restaurar.sh
```

### Comandos útiles

```bash
docker compose ps                  # ver qué está corriendo
docker compose logs -f backend     # ver los logs del back
docker compose down                # apagar todo
docker compose down -v             # apagar y borrar la base (arranca de cero)
docker compose up -d --build       # reconstruir después de cambiar código
```

---

## Desarrollo sin Docker

Con Node 20+ y una base PostgreSQL corriendo:

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

El front queda en http://localhost:5173 y le pasa las llamadas `/api` al back en el puerto 3000.

## Subirlo a GitHub

Creá un repo vacío llamado `zaguan` en GitHub y después:

```bash
git init
git add .
git commit -m "Primera versión de Zaguán"
git branch -M main
git remote add origin https://github.com/chericastaa/zaguan.git
git push -u origin main
```

---

## Arquitectura

```
Navegador
   │  http://localhost:8080
   ▼
┌──────────────────────┐
│ frontend (Nginx)     │  sirve React y hace de proxy
└──────────┬───────────┘
           │ /api y /uploads
           ▼
┌──────────────────────┐      ┌──────────────────┐
│ backend (Express)    │─────▶│ ollama (IA local)│
└──────────┬───────────┘      └──────────────────┘
           ▼
┌──────────────────────┐
│ db (PostgreSQL)      │
└──────────────────────┘
```

## API

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| POST | `/api/auth/registro` | todos | Crea cuenta (201) |
| POST | `/api/auth/login` | todos | Devuelve token JWT |
| GET | `/api/auth/yo` | logueado | Datos del usuario |
| GET | `/api/propiedades` | todos | Lista con filtros `barrio`, `precioMin`, `precioMax`, `ambientes`, `mascotas`, `orden`, `mias` |
| GET | `/api/propiedades/:id` | todos | Detalle |
| POST | `/api/propiedades` | propietario, admin | Publica con fotos (201) |
| PUT | `/api/propiedades/:id` | dueño, admin | Edita |
| DELETE | `/api/propiedades/:id` | dueño, admin | Borra (204) |
| GET | `/api/favoritos` | logueado | Mis favoritos |
| POST | `/api/favoritos` | logueado | Agrega favorito (201) |
| DELETE | `/api/favoritos/:propiedadId` | logueado | Quita favorito (204) |
| GET | `/api/barrios` | todos | Barrios de CABA |
| POST | `/api/chat` | todos | Asistente IA |

## Base de datos

```
usuarios (id, nombre, email, password_hash, rol)
    │ 1
    │
    │ N
propiedades (id, propietario_id, titulo, descripcion, barrio, direccion,
             precio, expensas, ambientes, superficie, mascotas, lat, lng)
    │ 1                         │ 1
    │ N                         │ N
fotos (id, propiedad_id, url)   favoritos (usuario_id, propiedad_id)
```

## Cómo funciona el chat

1. El usuario escribe, por ejemplo: *"busco 2 ambientes en Palermo hasta 600 mil con mascota"*
2. La IA convierte el texto en filtros: `{ barrio: "Palermo", ambientes: 2, precioMax: 600000, mascotas: true }`
3. El back busca en PostgreSQL con esos filtros
4. La IA arma una respuesta corta usando **solo** las propiedades encontradas, así no inventa nada
5. El front muestra la respuesta con las tarjetas de las propiedades

Como se manda el historial, entiende seguimientos como *"y en Belgrano?"* o *"algo más barato"*.

Además de buscar, el asistente responde dudas sobre alquilar en CABA (garantías, requisitos, expensas, contratos y cómo es cada barrio). Para eso usa una guía propia en `backend/src/conocimiento.js`, así responde con información controlada en lugar de inventar. Si la IA no está disponible, contesta las preguntas más comunes con respuestas predefinidas.
