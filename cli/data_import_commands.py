"""
Flask CLI commands for data import operations.
"""

import click
import logging
from flask import current_app
from flask.cli import with_appcontext

from data_import.config import load_config
from data_import.sync_engine import SyncEngine
from data_import.scheduler import create_scheduler


def register_data_import_commands(app):
    """Register data import CLI commands with the Flask app."""
    
    @app.cli.group()
    def data_import():
        """Data import management commands."""
        pass
    
    @data_import.command()
    @click.option('--service', help='Specific service to sync (linear, github)')
    @click.option('--full', is_flag=True, help='Perform full sync instead of incremental')
    @with_appcontext
    def sync(service, full):
        """Sync data from external services."""
        try:
            config = load_config()
            sync_engine = SyncEngine(config)
            
            if service:
                click.echo(f"Starting {'full' if full else 'incremental'} sync for {service}...")
                result = sync_engine.sync_service(service, full_sync=full)
            else:
                click.echo(f"Starting {'full' if full else 'incremental'} sync for all services...")
                result = sync_engine.sync_all_services(full_sync=full)
            
            if isinstance(result, dict) and 'success' in result:
                # Single service result
                if result['success']:
                    click.echo(f"✅ Sync completed: {result['items_synced']} items synced")
                else:
                    click.echo(f"❌ Sync failed: {result.get('error', 'Unknown error')}")
            else:
                # Multiple services result
                for svc, res in result.items():
                    if res['success']:
                        click.echo(f"✅ {svc}: {res['items_synced']} items synced")
                    else:
                        click.echo(f"❌ {svc}: {res.get('error', 'Unknown error')}")
                        
        except Exception as e:
            click.echo(f"❌ Error: {e}")
            raise click.Abort()
    
    @data_import.command()
    @with_appcontext
    def status():
        """Show sync status for all services."""
        try:
            config = load_config()
            sync_engine = SyncEngine(config)
            
            status_data = sync_engine.get_sync_status()
            
            if 'services' in status_data:
                click.echo("📊 Sync Status:")
                click.echo("-" * 80)
                
                for service in status_data['services']:
                    health_icon = "🟢" if service.get('is_healthy') else "🔴"
                    click.echo(f"{health_icon} {service['service'].upper()}")
                    click.echo(f"   Last Sync: {service.get('last_sync_at', 'Never')}")
                    click.echo(f"   Items Synced: {service.get('total_items_synced', 0)}")
                    click.echo(f"   Success Rate: {service.get('success_rate', 0):.1f}%")
                    click.echo(f"   Enabled: {'Yes' if service.get('sync_enabled') else 'No'}")
                    
                    if service.get('last_error_message'):
                        click.echo(f"   Last Error: {service['last_error_message'][:100]}...")
                    click.echo()
                
                click.echo(f"Total Services: {status_data.get('total_services', 0)}")
                click.echo(f"Healthy Services: {status_data.get('healthy_services', 0)}")
            else:
                click.echo("No services configured.")
                
        except Exception as e:
            click.echo(f"❌ Error: {e}")
            raise click.Abort()
    
    @data_import.command()
    @with_appcontext
    def test_connections():
        """Test connections to all configured services."""
        try:
            config = load_config()
            sync_engine = SyncEngine(config)
            
            click.echo("🔌 Testing connections...")
            results = sync_engine.validate_all_connections()
            
            for service, connected in results.items():
                status_icon = "✅" if connected else "❌"
                status_text = "Connected" if connected else "Failed"
                click.echo(f"{status_icon} {service.upper()}: {status_text}")
            
            all_healthy = all(results.values())
            if all_healthy:
                click.echo("\n🎉 All connections are healthy!")
            else:
                failed_services = [svc for svc, status in results.items() if not status]
                click.echo(f"\n⚠️  Connection issues with: {', '.join(failed_services)}")
                
        except Exception as e:
            click.echo(f"❌ Error: {e}")
            raise click.Abort()
    
    @data_import.command()
    @click.option('--source', help='Filter by source service')
    @click.option('--type', 'data_type', help='Filter by data type')
    @click.option('--limit', default=20, help='Number of items to show')
    @with_appcontext
    def list_data(source, data_type, limit):
        """List imported data."""
        try:
            config = load_config()
            sync_engine = SyncEngine(config)
            
            data_items = sync_engine.get_imported_data(
                source=source,
                data_type=data_type,
                limit=limit
            )
            
            if not data_items:
                click.echo("No data found.")
                return
            
            click.echo(f"📋 Imported Data ({len(data_items)} items):")
            click.echo("-" * 100)
            
            for item in data_items:
                title = item.get('title', 'No title')[:50]
                click.echo(f"🔹 {item['source']}/{item['data_type']}: {title}")
                click.echo(f"   ID: {item['external_id']}")
                click.echo(f"   Updated: {item.get('external_updated_at', 'Unknown')}")
                click.echo(f"   State: {item.get('state', 'Unknown')}")
                click.echo()
                
        except Exception as e:
            click.echo(f"❌ Error: {e}")
            raise click.Abort()
    
    @data_import.command()
    @click.argument('service')
    @click.option('--enabled/--disabled', default=True, help='Enable or disable sync')
    @with_appcontext
    def configure_service(service, enabled):
        """Enable or disable sync for a service."""
        try:
            config = load_config()
            sync_engine = SyncEngine(config)
            
            sync_engine.enable_service_sync(service, enabled)
            
            status = "enabled" if enabled else "disabled"
            click.echo(f"✅ Sync {status} for {service}")
            
        except Exception as e:
            click.echo(f"❌ Error: {e}")
            raise click.Abort()
    
    @data_import.command()
    @click.argument('service')
    @click.argument('interval', type=int)
    @with_appcontext
    def set_interval(service, interval):
        """Set sync interval for a service (in minutes)."""
        try:
            config = load_config()
            sync_engine = SyncEngine(config)
            
            sync_engine.set_sync_interval(service, interval)
            
            click.echo(f"✅ Sync interval set to {interval} minutes for {service}")
            
        except Exception as e:
            click.echo(f"❌ Error: {e}")
            raise click.Abort()
    
    @data_import.command()
    @click.option('--check-interval', default=60, help='Check interval in seconds')
    @with_appcontext
    def start_scheduler():
        """Start the sync scheduler (runs until interrupted)."""
        try:
            click.echo("🚀 Starting sync scheduler...")
            
            scheduler = create_scheduler()
            
            def on_sync_complete(service, result):
                click.echo(f"✅ {service}: {result['items_synced']} items synced")
            
            def on_sync_error(service, result):
                click.echo(f"❌ {service}: {result.get('error', 'Unknown error')}")
            
            scheduler.set_sync_callbacks(on_sync_complete, on_sync_error)
            scheduler.start()
            
            click.echo("📅 Scheduler started. Press Ctrl+C to stop.")
            
            try:
                import time
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                click.echo("\n🛑 Stopping scheduler...")
                scheduler.stop()
                click.echo("✅ Scheduler stopped.")
                
        except Exception as e:
            click.echo(f"❌ Error: {e}")
            raise click.Abort()
    
    @data_import.command()
    @with_appcontext
    def init_db():
        """Initialize the database tables for data import."""
        try:
            config = load_config()
            sync_engine = SyncEngine(config)
            
            # The SyncEngine constructor already creates tables
            click.echo("✅ Database tables initialized successfully.")
            
        except Exception as e:
            click.echo(f"❌ Error: {e}")
            raise click.Abort()
    
    @data_import.command()
    @with_appcontext
    def config_info():
        """Show current configuration."""
        try:
            config = load_config()
            
            click.echo("⚙️  Data Import Configuration:")
            click.echo("-" * 40)
            click.echo(f"Database URL: {config.database_url}")
            click.echo(f"Sync Interval: {config.sync_interval_minutes} minutes")
            click.echo(f"Max Retries: {config.max_retries}")
            click.echo(f"Timeout: {config.timeout_seconds} seconds")
            click.echo(f"Log Level: {config.log_level}")
            click.echo()
            
            click.echo("🔗 Service Configuration:")
            services = ['linear', 'github']
            for service in services:
                enabled = config.is_service_enabled(service)
                status_icon = "✅" if enabled else "❌"
                click.echo(f"{status_icon} {service.upper()}: {'Enabled' if enabled else 'Disabled'}")
            
        except Exception as e:
            click.echo(f"❌ Error: {e}")
            raise click.Abort()
