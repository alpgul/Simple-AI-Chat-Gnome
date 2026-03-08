from flask import Flask, jsonify, request
from datetime import datetime
import os
import platform
import psutil
import subprocess
from duckduckgo_search import DDGS
import requests
import yaml

app = Flask(__name__)
CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.yml')


def load_config():
    with open(CONFIG_PATH, 'r', encoding='utf-8') as config_file:
        data = yaml.safe_load(config_file) or {}

    host = data.get('host', '127.0.0.1')
    port = int(data.get('port', 5000))
    debug = data.get('debug', True)
    searxng_url = data.get('searxng_url', 'http://127.0.0.1:8888/search')

    return [host, port, debug], searxng_url

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/time', methods=['GET'])
def get_time():
    now = datetime.now()
    return jsonify({
        'datetime': now.isoformat(),
        'date': now.strftime('%Y-%m-%d'),
        'time': now.strftime('%H:%M:%S'),
        'timezone': now.astimezone().tzname()
    })

@app.route('/weather', methods=['GET'])
def get_weather():
    # Latitude/Longitude müssen als Query-Parameter übergeben werden
    lat = request.args.get('lat')
    lon = request.args.get('lon')
    
    if not lat or not lon:
        return jsonify({'error': 'lat and lon parameters required'}), 400
    
    try:
        url = f'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weathercode,windspeed_10m&timezone=auto'
        response = requests.get(url, timeout=5)
        data = response.json()
        
        return jsonify({
            'temperature': data['current']['temperature_2m'],
            'temperature_unit': data['current_units']['temperature_2m'],
            'weathercode': data['current']['weathercode'],
            'windspeed': data['current']['windspeed_10m'],
            'windspeed_unit': data['current_units']['windspeed_10m'],
            'timezone': data['timezone']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search', methods=['GET'])
def web_search():
    query = request.args.get('q')
    
    if not query:
        return jsonify({'error': 'q parameter required'}), 400
    
    try:
        # SearXNG API nutzen
        _, searxng_url = load_config()
        params = {
            'q': query,
            'format': 'json',
            'categories': 'general'
        }
        
        response = requests.get(searxng_url, params=params, timeout=10)
        data = response.json()
        
        # Ergebnisse formatieren
        results = []
        for r in data.get('results', [])[:5]:  # Erste 5 Ergebnisse
            results.append({
                'title': r.get('title'),
                'url': r.get('url'),
                'snippet': r.get('content', '')
            })
        
        return jsonify({'results': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/system', methods=['GET'])
def system_info():
    try:
        # Basis-Systeminfo
        info = {
            'hostname': platform.node(),
            'kernel': platform.release(),
            'os': f"{platform.system()} {platform.version()}",
            'architecture': platform.machine(),
            
            # CPU/RAM/Disk
            'cpu_percent': psutil.cpu_percent(interval=1),
            'cpu_count': psutil.cpu_count(),
            'memory_total_gb': round(psutil.virtual_memory().total / (1024**3), 2),
            'memory_used_gb': round(psutil.virtual_memory().used / (1024**3), 2),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_total_gb': round(psutil.disk_usage('/').total / (1024**3), 2),
            'disk_used_gb': round(psutil.disk_usage('/').used / (1024**3), 2),
            'disk_percent': psutil.disk_usage('/').percent
        }
        
        # GNOME Version
        try:
            gnome_version = subprocess.check_output(
                ['gnome-shell', '--version'], 
                stderr=subprocess.DEVNULL
            ).decode().strip()
            info['gnome_version'] = gnome_version
        except:
            info['gnome_version'] = 'unknown'
        
        # Flatpak Apps
        try:
            flatpaks = subprocess.check_output(
                ['flatpak', 'list', '--app', '--columns=application'], 
                stderr=subprocess.DEVNULL
            ).decode().strip().split('\n')
            info['flatpak_count'] = len([f for f in flatpaks if f])
            info['flatpak_apps'] = [f for f in flatpaks if f][:10]  # Erste 10
        except:
            info['flatpak_count'] = 0
            info['flatpak_apps'] = []
        
        # APT Pakete (Anzahl)
        try:
            apt_count = subprocess.check_output(
                ['dpkg', '-l'], 
                stderr=subprocess.DEVNULL
            ).decode().count('\nii ')
            info['apt_packages_count'] = apt_count
        except:
            info['apt_packages_count'] = 0
        
        # Top 5 Prozesse nach CPU
        processes = []
        for proc in sorted(psutil.process_iter(['name', 'cpu_percent']), 
                          key=lambda p: p.info['cpu_percent'] or 0, 
                          reverse=True)[:5]:
            processes.append({
                'name': proc.info['name'],
                'cpu_percent': proc.info['cpu_percent']
            })
        info['top_processes'] = processes
        
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    server_config, _ = load_config()
    host, port, debug = server_config
    app.run(host=host, port=port, debug=debug)