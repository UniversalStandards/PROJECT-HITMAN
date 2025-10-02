"""
Flask routes for data import management.
"""

import logging
from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for
from datetime import datetime

from data_import.config import load_config
from data_import.sync_engine import SyncEngine
from data_import.scheduler import create_scheduler
from data_import.exceptions import ImportError, SyncError

# Create blueprint
data_import_bp = Blueprint('data_import', __name__, url_prefix='/data-import')

# Global scheduler instance
scheduler = None
logger = logging.getLogger(__name__)


def get_scheduler():
    """Get or create the global scheduler instance."""
    global scheduler
    if scheduler is None:
        try:
            config = load_config()
            scheduler = create_scheduler(config)
        except Exception as e:
            logger.error(f"Failed to create scheduler: {e}")
            scheduler = None
    return scheduler


@data_import_bp.route('/')
def dashboard():
    """Data import dashboard."""
    try:
        sched = get_scheduler()
        if sched:
            status = sched.get_status()
            return render_template('data_import/dashboard.html', status=status)
        else:
            return render_template('data_import/dashboard.html', 
                                 error="Failed to initialize data import system")
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return render_template('data_import/dashboard.html', 
                             error=f"Dashboard error: {e}")


@data_import_bp.route('/status')
def status():
    """Get sync status as JSON."""
    try:
        sched = get_scheduler()
        if sched:
            return jsonify(sched.get_status())
        else:
            return jsonify({'error': 'Scheduler not available'}), 500
    except Exception as e:
        logger.error(f"Status error: {e}")
        return jsonify({'error': 'An internal error has occurred'}), 500


@data_import_bp.route('/sync', methods=['POST'])
def trigger_sync():
    """Trigger a manual sync."""
    try:
        sched = get_scheduler()
        if not sched:
            return jsonify({'error': 'Scheduler not available'}), 500
        
        service = request.json.get('service') if request.is_json else request.form.get('service')
        full_sync = request.json.get('full_sync', False) if request.is_json else request.form.get('full_sync') == 'true'
        
        result = sched.sync_now(service_name=service, full_sync=full_sync)
        
        if request.is_json:
            return jsonify(result)
        else:
            if result.get('success', False):
                flash(f"Sync completed successfully: {result.get('message', '')}", 'success')
            else:
                flash(f"Sync failed: {result.get('error', 'Unknown error')}", 'error')
            return redirect(url_for('data_import.dashboard'))
            
    except Exception as e:
        logger.error(f"Sync trigger error: {e}")
        if request.is_json:
            return jsonify({'error': str(e)}), 500
        else:
            flash(f"Sync error: {e}", 'error')
            return redirect(url_for('data_import.dashboard'))


@data_import_bp.route('/scheduler/start', methods=['POST'])
def start_scheduler():
    """Start the sync scheduler."""
    try:
        sched = get_scheduler()
        if not sched:
            return jsonify({'error': 'Scheduler not available'}), 500
        
        if not sched.is_running():
            sched.start()
            message = "Scheduler started successfully"
        else:
            message = "Scheduler is already running"
        
        if request.is_json:
            return jsonify({'success': True, 'message': message})
        else:
            flash(message, 'success')
            return redirect(url_for('data_import.dashboard'))
            
    except Exception as e:
        logger.error(f"Scheduler start error: {e}")
        if request.is_json:
            return jsonify({'error': str(e)}), 500
        else:
            flash(f"Failed to start scheduler: {e}", 'error')
            return redirect(url_for('data_import.dashboard'))


@data_import_bp.route('/scheduler/stop', methods=['POST'])
def stop_scheduler():
    """Stop the sync scheduler."""
    try:
        sched = get_scheduler()
        if not sched:
            return jsonify({'error': 'Scheduler not available'}), 500
        
        if sched.is_running():
            sched.stop()
            message = "Scheduler stopped successfully"
        else:
            message = "Scheduler is not running"
        
        if request.is_json:
            return jsonify({'success': True, 'message': message})
        else:
            flash(message, 'success')
            return redirect(url_for('data_import.dashboard'))
            
    except Exception as e:
        logger.error(f"Scheduler stop error: {e}")
        if request.is_json:
            return jsonify({'error': str(e)}), 500
        else:
            flash(f"Failed to stop scheduler: {e}", 'error')
            return redirect(url_for('data_import.dashboard'))


@data_import_bp.route('/data')
def view_data():
    """View imported data."""
    try:
        sched = get_scheduler()
        if not sched:
            return render_template('data_import/data.html', 
                                 error="Scheduler not available")
        
        # Get query parameters
        source = request.args.get('source')
        data_type = request.args.get('data_type')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        
        offset = (page - 1) * per_page
        
        # Get imported data
        data_items = sched.sync_engine.get_imported_data(
            source=source,
            data_type=data_type,
            limit=per_page,
            offset=offset
        )
        
        # Get available sources and data types for filtering
        all_data = sched.sync_engine.get_imported_data(limit=1000)  # Get more for filtering options
        sources = list(set(item['source'] for item in all_data))
        data_types = list(set(item['data_type'] for item in all_data))
        
        return render_template('data_import/data.html',
                             data_items=data_items,
                             sources=sources,
                             data_types=data_types,
                             current_source=source,
                             current_data_type=data_type,
                             page=page,
                             per_page=per_page,
                             has_more=len(data_items) == per_page)
        
    except Exception as e:
        logger.error(f"View data error: {e}")
        return render_template('data_import/data.html', 
                             error=f"Error loading data: {e}")


@data_import_bp.route('/data/api')
def api_data():
    """Get imported data as JSON."""
    try:
        sched = get_scheduler()
        if not sched:
            return jsonify({'error': 'Scheduler not available'}), 500
        
        # Get query parameters
        source = request.args.get('source')
        data_type = request.args.get('data_type')
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        
        # Get imported data
        data_items = sched.sync_engine.get_imported_data(
            source=source,
            data_type=data_type,
            limit=limit,
            offset=offset
        )
        
        return jsonify({
            'data': data_items,
            'count': len(data_items),
            'offset': offset,
            'limit': limit
        })
        
    except Exception as e:
        logger.error(f"API data error: {e}")
        return jsonify({'error': str(e)}), 500


@data_import_bp.route('/config')
def config():
    """View and edit configuration."""
    try:
        sched = get_scheduler()
        if not sched:
            return render_template('data_import/config.html', 
                                 error="Scheduler not available")
        
        # Get current configuration
        config_data = {
            'linear_enabled': sched.config.is_service_enabled('linear'),
            'github_enabled': sched.config.is_service_enabled('github'),
            'sync_interval': sched.config.sync_interval_minutes,
            'max_retries': sched.config.max_retries,
            'timeout': sched.config.timeout_seconds
        }
        
        return render_template('data_import/config.html', config=config_data)
        
    except Exception as e:
        logger.error(f"Config view error: {e}")
        return render_template('data_import/config.html', 
                             error=f"Error loading configuration: {e}")


@data_import_bp.route('/test-connections')
def test_connections():
    """Test connections to all configured services."""
    try:
        sched = get_scheduler()
        if not sched:
            return jsonify({'error': 'Scheduler not available'}), 500
        
        results = sched.sync_engine.validate_all_connections()
        
        return jsonify({
            'success': True,
            'connections': results,
            'all_healthy': all(results.values())
        })
        
    except Exception as e:
        logger.error(f"Connection test error: {e}")
        return jsonify({'error': str(e)}), 500
