markdown

# Penguin AI Chatbot - Local Tool Server

This tool server enables Function Calling capabilities for the Penguin AI Chatbot GNOME Shell Extension. It provides local tools that the LLM can invoke to retrieve real-time information.

## Features

The tool server exposes four endpoints that the LLM can call:

- **`/time`** - Current date and time
- **`/weather`** - Current weather information (via Open-Meteo API)
- **`/search`** - Web search (requires SearXNG instance)
- **`/system`** - System information (CPU, RAM, disk, packages, processes)

## Requirements

- Python 3.8+
- pip
- Virtual environment (recommended)

## Installation

### 1. Clone and navigate to the tool-server directory

```bash
cd tool-server
```

### 2. Create and activate virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

## Configuration

### SearXNG Setup (Optional - for Web Search)

The `/search` endpoint requires a running SearXNG instance. You can:

**Option A: Use a public instance**

- Modify `config.yml` line with SearXNG URL to point to a public instance

**Option B: Self-host with Docker Compose**

Create `docker-compose.yml`:

```yaml
version: "3.7"
services:
  searxng:
    image: searxng/searxng:latest
    container_name: searxng
    ports:
      - "8888:8080"
    volumes:
      - ./searxng:/etc/searxng:rw
    environment:
      - SEARXNG_BASE_URL=http://localhost:8888/
    restart: unless-stopped
```

Enable JSON format in `searxng/settings.yml`:

```yaml
search:
  formats:
    - html
    - json
```

Start SearXNG:

```bash
docker compose up -d
```

Update `config.yml` with your SearXNG URL (default: `http://localhost:8888`).

## Running the Server

### Manual Start

```bash
source venv/bin/activate
python server.py
```

The server will start on `http://127.0.0.1:5000` by default. Can be changed in config.yml.

### Automatic Start with systemd

Create a systemd user service for automatic startup:

**1. Create service file:**

```bash
mkdir -p ~/.config/systemd/user
nano ~/.config/systemd/user/gnome-ai-toolserver.service
```

**2. Add the following content** (adjust paths as needed):

```ini
[Unit]
Description=GNOME AI Tool Server for Penguin Chatbot
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/tool-server
ExecStart=/path/to/tool-server/venv/bin/python /path/to/tool-server/server.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

**3. Enable and start the service:**

```bash
systemctl --user daemon-reload
systemctl --user enable gnome-ai-toolserver.service
systemctl --user start gnome-ai-toolserver.service
```

**4. Check status:**

```bash
systemctl --user status gnome-ai-toolserver.service
```

## API Endpoints

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-11-29T14:46:30.652068"
}
```

### GET /time

Returns current date and time.

**Response:**

```json
{
  "datetime": "2025-11-29T14:50:10.077031",
  "date": "2025-11-29",
  "time": "14:50:10",
  "timezone": "CET"
}
```

### GET /weather

Returns current weather information for configured location.

**Query Parameters:**

- `lat` (required) - Latitude
- `lon` (required) - Longitude

**Example:**

```
GET /weather?lat=52.52&lon=13.41
```

**Response:**

```json
{
  "temperature": 7.8,
  "temperature_unit": "°C",
  "weathercode": 3,
  "windspeed": 7.2,
  "windspeed_unit": "km/h",
  "timezone": "Europe/Berlin"
}
```

### GET /search

Performs web search via SearXNG.

**Query Parameters:**

- `q` (required) - Search query

**Example:**

```
GET /search?q=GNOME+Shell
```

**Response:**

```json
{
  "results": [
    {
      "title": "GNOME Shell Extensions",
      "url": "https://extensions.gnome.org/",
      "snippet": "GNOME Shell Extensions..."
    }
  ]
}
```

### GET /system

Returns comprehensive system information.

**Response:**

```json
{
  "hostname": "my-computer",
  "kernel": "6.17.0-7-generic",
  "os": "Linux #7-Ubuntu SMP...",
  "architecture": "x86_64",
  "gnome_version": "GNOME Shell 49.0",
  "cpu_count": 12,
  "cpu_percent": 1.4,
  "memory_total_gb": 30.27,
  "memory_used_gb": 6.61,
  "memory_percent": 23.6,
  "disk_total_gb": 502.89,
  "disk_used_gb": 196.46,
  "disk_percent": 41.2,
  "flatpak_count": 7,
  "flatpak_apps": ["com.google.Chrome", ...],
  "apt_packages_count": 1973,
  "top_processes": [...]
}
```

## Extension Configuration

After starting the tool server, configure the GNOME Shell Extension:

1. Open Extension Preferences
2. Set **Tool Server URL** to `http://127.0.0.1:5000`
3. Set **Weather Latitude** and **Weather Longitude** for your location
4. Save preferences

## Troubleshooting

### Server won't start

- Ensure virtual environment is activated: `source venv/bin/activate`
- Check if port 5000 is already in use: `lsof -i :5000`
- Check logs: `journalctl --user -u gnome-ai-toolserver.service -f`

### Weather endpoint returns 400

- Verify latitude and longitude are configured in Extension preferences
- Test manually: `curl "http://127.0.0.1:5000/weather?lat=52.52&lon=13.41"`

### Search endpoint fails

- Ensure SearXNG is running and accessible
- Check SearXNG URL in `server.py`
- Verify JSON format is enabled in SearXNG settings

## License

Same as parent project (AGPL-3.0)
