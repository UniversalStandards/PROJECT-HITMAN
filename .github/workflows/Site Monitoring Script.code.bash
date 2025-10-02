#!/bin/bash
# Enhanced site monitoring and health check script
# Usage: ./monitor-site.sh [URL] [OPTIONS]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
REPORT_DIR="${SCRIPT_DIR}/reports"
CONFIG_FILE="${SCRIPT_DIR}/monitor-config.json"

# Default values
DEFAULT_URL="https://your-site.github.io"
TIMEOUT=30
MAX_RETRIES=3
ALERT_THRESHOLD=5000  # Response time in ms
CHECK_INTERVAL=300    # 5 minutes
ENABLE_SLACK=false
ENABLE_EMAIL=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create directories
mkdir -p "$LOG_DIR" "$REPORT_DIR"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")  echo -e "${GREEN}[INFO]${NC} $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" ;;
        "DEBUG") [[ "$VERBOSE" == "true" ]] && echo -e "${BLUE}[DEBUG]${NC} $message" ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_DIR/monitor.log"
}

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        log "INFO" "Loading configuration from $CONFIG_FILE"
        
        # Parse JSON config (requires jq)
        if command -v jq >/dev/null 2>&1; then
            DEFAULT_URL=$(jq -r '.url // "https://your-site.github.io"' "$CONFIG_FILE")
            TIMEOUT=$(jq -r '.timeout // 30' "$CONFIG_FILE")
            MAX_RETRIES=$(jq -r '.max_retries // 3' "$CONFIG_FILE")
            ALERT_THRESHOLD=$(jq -r '.alert_threshold // 5000' "$CONFIG_FILE")
            CHECK_INTERVAL=$(jq -r '.check_interval // 300' "$CONFIG_FILE")
            ENABLE_SLACK=$(jq -r '.notifications.slack.enabled // false' "$CONFIG_FILE")
            ENABLE_EMAIL=$(jq -r '.notifications.email.enabled // false' "$CONFIG_FILE")
        else
            log "WARN" "jq not found, using default configuration"
        fi
    else
        log "INFO" "No configuration file found, using defaults"
        create_default_config
    fi
}

# Create default configuration file
create_default_config() {
    cat > "$CONFIG_FILE" << EOF
{
  "url": "$DEFAULT_URL",
  "timeout": $TIMEOUT,
  "max_retries": $MAX_RETRIES,
  "alert_threshold": $ALERT_THRESHOLD,
  "check_interval": $CHECK_INTERVAL,
  "notifications": {
    "slack": {
      "enabled": false,
      "webhook_url": "",
      "channel": "#alerts"
    },
    "email": {
      "enabled": false,
      "smtp_server": "",
      "from": "",
      "to": []
    }
  },
  "checks": {
    "response_time": true,
    "status_code": true,
    "content_validation": true,
    "ssl_certificate": true,
    "dns_resolution": true
  }
}
EOF
    log "INFO" "Created default configuration file: $CONFIG_FILE"
}

# Health check function
health_check() {
    local url="$1"
    local start_time=$(date +%s%3N)
    local temp_file=$(mktemp)
    local result_file="$REPORT_DIR/health-check-$(date +%Y%m%d-%H%M%S).json"
    
    log "INFO" "Starting health check for: $url"
    
    # Initialize result object
    cat > "$result_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "url": "$url",
  "checks": {}
}
EOF
    
    # HTTP Response Check
    log "DEBUG" "Checking HTTP response..."
    local http_code response_time
    
    if curl_output=$(curl -w "%{http_code}|%{time_total}|%{time_namelookup}|%{time_connect}|%{time_starttransfer}" \
                     -s -S -L --max-time "$TIMEOUT" -o "$temp_file" "$url" 2>&1); then
        
        IFS='|' read -r http_code response_time dns_time connect_time ttfb_time <<< "$curl_output"
        response_time_ms=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)
        
        # Update result file
        jq --arg code "$http_code" \
           --arg time "$response_time_ms" \
           --arg dns "$dns_time" \
           --arg connect "$connect_time" \
           --arg ttfb "$ttfb_time" \
           '.checks.http = {
              "status_code": ($code | tonumber),
              "response_time_ms": ($time | tonumber),
              "dns_time": ($dns | tonumber),
              "connect_time": ($connect | tonumber),
              "ttfb_time": ($ttfb | tonumber),
              "success": true
            }' "$result_file" > "$result_file.tmp" && mv "$result_file.tmp" "$result_file"
        
        log "INFO" "HTTP Status: $http_code, Response Time: ${response_time_ms}ms"
        
        # Check if response time exceeds threshold
        if [[ "$response_time_ms" -gt "$ALERT_THRESHOLD" ]]; then
            log "WARN" "Response time (${response_time_ms}ms) exceeds threshold (${ALERT_THRESHOLD}ms)"
            send_alert "High Response Time" "Response time: ${response_time_ms}ms (threshold: ${ALERT_THRESHOLD}ms)"
        fi
        
    else
        log "ERROR" "HTTP request failed: $curl_output"
        jq '.checks.http = {"success": false, "error": "'"$curl_output"'"}' "$result_file" > "$result_file.tmp" && mv "$result_file.tmp" "$result_file"
        send_alert "HTTP Request Failed" "Error: $curl_output"
        rm -f "$temp_file"
        return 1
    fi
    
    # Content Validation
    log "DEBUG" "Validating content..."
    if [[ -f "$temp_file" ]]; then
        local content_size=$(wc -c < "$temp_file")
        local has_title=$(grep -c "<title>" "$temp_file" || true)
        local has_body=$(grep -c "<body>" "$temp_file" || true)
        
        jq --arg size "$content_size" \
           --arg title "$has_title" \
           --arg body "$has_body" \
           '.checks.content = {
              "size_bytes": ($size | tonumber),
              "has_title": ($title | tonumber > 0),
              "has_body": ($body | tonumber > 0),
              "success": true
            }' "$result_file" > "$result_file.tmp" && mv "$result_file.tmp" "$result_file"
        
        log "INFO" "Content validation: Size=${content_size}B, Title=${has_title}, Body=${has_body}"
    fi
    
    # SSL Certificate Check
    log "DEBUG" "Checking SSL certificate..."
    if [[ "$url" == https://* ]]; then
        local domain=$(echo "$url" | sed -e 's|^https://||' -e 's|/.*||')
        local ssl_info
        
        if ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
                     openssl x509 -noout -dates 2>/dev/null); then
            
            local not_after=$(echo "$ssl_info" | grep "notAfter" | cut -d= -f2)
            local expiry_date=$(date -d "$not_after" +%s 2>/dev/null || echo "0")
            local current_date=$(date +%s)
            local days_until_expiry=$(( (expiry_date - current_date) / 86400 ))
            
            jq --arg expiry "$not_after" \
               --arg days "$days_until_expiry" \
               '.checks.ssl = {
                  "expiry_date": $expiry,
                  "days_until_expiry": ($days | tonumber),
                  "valid": true,
                  "success": true
                }' "$result_file" > "$result_file.tmp" && mv "$result_file.tmp" "$result_file"
            
            log "INFO" "SSL Certificate expires in $days_until_expiry days"
            
            # Alert if certificate expires soon
            if [[ "$days_until_expiry" -lt 30 ]]; then
                log "WARN" "SSL certificate expires in $days_until_expiry days"
                send_alert "SSL Certificate Expiring" "Certificate expires in $days_until_expiry days"
            fi
        else
            log "ERROR" "Failed to check SSL certificate"
            jq '.checks.ssl = {"success": false, "error": "Failed to retrieve certificate"}' "$result_file" > "$result_file.tmp" && mv "$result_file.tmp" "$result_file"
        fi
    fi
    
    # DNS Resolution Check
    log "DEBUG" "Checking DNS resolution..."
    local domain=$(echo "$url" | sed -e 's|^https\?://||' -e 's|/.*||')
    if dns_result=$(dig +short "$domain" 2>&1); then
        local ip_count=$(echo "$dns_result" | wc -l)
        jq --arg ips "$dns_result" \
           --arg count "$ip_count" \
           '.checks.dns = {
              "resolved_ips": ($ips | split("\n")),
              "ip_count": ($count | tonumber),
              "success": true
            }' "$result_file" > "$result_file.tmp" && mv "$result_file.tmp" "$result_file"
        
        log "INFO" "DNS resolution successful: $ip_count IP(s) resolved"
    else
        log "ERROR" "DNS resolution failed: $dns_result"
        jq --arg error "$dns_result" '.checks.dns = {"success": false, "error": $error}' "$result_file" > "$result_file.tmp" && mv "$result_file.tmp" "$result_file"
    fi
    
    # Calculate overall health score
    local health_score
    health_score=$(jq '.checks | to_entries | map(select(.value.success == true)) | length' "$result_file")
    local total_checks
    total_checks=$(jq '.checks | length' "$result_file")
    local health_percentage=$((health_score * 100 / total_checks))
    
    jq --arg score "$health_score" \
       --arg total "$total_checks" \
       --arg percentage "$health_percentage" \
       '.summary = {
          "health_score": ($score | tonumber),
          "total_checks": ($total | tonumber),
          "health_percentage": ($percentage | tonumber),
          "status": (if ($percentage | tonumber) >= 80 then "healthy" elif ($percentage | tonumber) >= 60 then "degraded" else "unhealthy" end)
        }' "$result_file" > "$result_file.tmp" && mv "$result_file.tmp" "$result_file"
    
    log "INFO" "Health check completed: $health_score/$total_checks checks passed (${health_percentage}%)"
    
    # Clean up
    rm -f "$temp_file"
    echo "$result_file"
}

# Send alert notifications
send_alert() {
    local title="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')
    
    log "WARN" "ALERT: $title - $message"
    
    # Slack notification
    if [[ "$ENABLE_SLACK" == "true" ]] && command -v jq >/dev/null 2>&1; then
        local webhook_url
        webhook_url=$(jq -r '.notifications.slack.webhook_url' "$CONFIG_FILE")
        local channel
        channel=$(jq -r '.notifications.slack.channel' "$CONFIG_FILE")
        
        if [[ -n "$webhook_url" && "$webhook_url" != "null" ]]; then
            local payload
            payload=$(jq -n \
                --arg channel "$channel" \
                --arg title "$title" \
                --arg message "$message" \
                --arg timestamp "$timestamp" \
                '{
                    "channel": $channel,
                    "username": "Site Monitor",
                    "icon_emoji": ":warning:",
                    "attachments": [{
                        "color": "warning",
                        "title": $title,
                        "text": $message,
                        "footer": "Site Monitor",
                        "ts": (now | floor)
                    }]
                }')
            
            curl -X POST -H 'Content-type: application/json' \
                 --data "$payload" "$webhook_url" >/dev/null 2>&1 || \
                 log "ERROR" "Failed to send Slack notification"
        fi
    fi
    
    # Email notification (requires mailx or similar)
    if [[ "$ENABLE_EMAIL" == "true" ]] && command -v mail >/dev/null 2>&1; then
        local recipients
        recipients=$(jq -r '.notifications.email.to[]' "$CONFIG_FILE" 2>/dev/null || echo "")
        
        if [[ -n "$recipients" ]]; then
            echo -e "Site Monitor Alert\n\nTitle: $title\nMessage: $message\nTimestamp: $timestamp" | \
                mail -s "Site Monitor Alert: $title" "$recipients" || \
                log "ERROR" "Failed to send email notification"
        fi
    fi
}

# Generate HTML report
generate_html_report() {
    local json_file="$1"
    local html_file="${json_file%.json}.html"
    
    if [[ ! -f "$json_file" ]]; then
        log "ERROR" "JSON report file not found: $json_file"
        return 1
    fi
    
    log "INFO" "Generating HTML report: $html_file"
    
    cat > "$html_file" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Health Check Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status { padding: 10px; border-radius: 4px; margin: 10px 0; text-align: center; font-weight: bold; }
        .healthy { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .degraded { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .unhealthy { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .checks { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .check-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f9f9f9; }
        .check-title { font-weight: bold; margin-bottom: 10px; color: #333; }
        .check-success { color: #28a745; }
        .check-failure { color: #dc3545; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { text-align: center; padding: 15px; background: #e9ecef; border-radius: 4px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #495057; }
        .metric-label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Site Health Check Report</h1>
            <p id="timestamp"></p>
            <p id="url"></p>
        </div>
        
        <div id="status" class="status"></div>
        
        <div class="metrics" id="metrics"></div>
        
        <div class="checks" id="checks"></div>
    </div>
    
    <script>
EOF
    
    # Embed JSON data and JavaScript
    echo "const reportData = " >> "$html_file"
    cat "$json_file" >> "$html_file"
    echo ";" >> "$html_file"
    
    cat >> "$html_file" << 'EOF'
        
        // Populate report
        document.getElementById('timestamp').textContent = `Generated: ${reportData.timestamp}`;
        document.getElementById('url').textContent = `URL: ${reportData.url}`;
        
        // Status
        const statusDiv = document.getElementById('status');
        const status = reportData.summary.status;
        statusDiv.textContent = `Overall Status: ${status.toUpperCase()} (${reportData.summary.health_percentage}%)`;
        statusDiv.className = `status ${status}`;
        
        // Metrics
        const metricsDiv = document.getElementById('metrics');
        if (reportData.checks.http) {
            metricsDiv.innerHTML += `
                <div class="metric">
                    <div class="metric-value">${reportData.checks.http.response_time_ms}ms</div>
                    <div class="metric-label">Response Time</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${reportData.checks.http.status_code}</div>
                    <div class="metric-label">HTTP Status</div>
                </div>
            `;
        }
        
        if (reportData.checks.content) {
            metricsDiv.innerHTML += `
                <div class="metric">
                    <div class="metric-value">${(reportData.checks.content.size_bytes / 1024).toFixed(1)}KB</div>
                    <div class="metric-label">Content Size</div>
                </div>
            `;
        }
        
        if (reportData.checks.ssl && reportData.checks.ssl.days_until_expiry) {
            metricsDiv.innerHTML += `
                <div class="metric">
                    <div class="metric-value">${reportData.checks.ssl.days_until_expiry}</div>
                    <div class="metric-label">SSL Days Left</div>
                </div>
            `;
        }
        
        // Checks
        const checksDiv = document.getElementById('checks');
        Object.entries(reportData.checks).forEach(([checkName, checkData]) => {
            const successClass = checkData.success ? 'check-success' : 'check-failure';
            const successText = checkData.success ? '✅ PASSED' : '❌ FAILED';
            
            let details = '';
            Object.entries(checkData).forEach(([key, value]) => {
                if (key !== 'success' && key !== 'error') {
                    details += `<p><strong>${key}:</strong> ${JSON.stringify(value)}</p>`;
                }
            });
            
            if (checkData.error) {
                details += `<p><strong>Error:</strong> ${checkData.error}</p>`;
            }
            
            checksDiv.innerHTML += `
                <div class="check-card">
                    <div class="check-title">${checkName.toUpperCase()} CHECK</div>
                    <div class="${successClass}">${successText}</div>
                    ${details}
                </div>
            `;
        });
    </script>
</body>
</html>
EOF
    
    log "INFO" "HTML report generated: $html_file"
}

# Continuous monitoring mode
continuous_monitor() {
    local url="$1"
    
    log "INFO" "Starting continuous monitoring (interval: ${CHECK_INTERVAL}s)"
    log "INFO" "Press Ctrl+C to stop monitoring"
    
    while true; do
        local report_file
        report_file=$(health_check "$url")
        
        if [[ -n "$report_file" ]]; then
            generate_html_report "$report_file"
            
            # Keep only last 24 hours of reports
            find "$REPORT_DIR" -name "health-check-*.json" -mtime +1 -delete 2>/dev/null || true
            find "$REPORT_DIR" -name "health-check-*.html" -mtime +1 -delete 2>/dev/null || true
        fi
        
        log "INFO" "Next check in ${CHECK_INTERVAL} seconds..."
        sleep "$CHECK_INTERVAL"
    done
}

# Usage information
usage() {
    cat << EOF
Site Monitoring Script

Usage: $0 [OPTIONS] [URL]

OPTIONS:
    -h, --help              Show this help message
    -v, --verbose           Enable verbose logging
    -c, --continuous        Run in continuous monitoring mode
    -i, --interval SECONDS  Set check interval for continuous mode (default: 300)
    -t, --timeout SECONDS   Set request timeout (default: 30)
    -r, --retries COUNT     Set maximum retries (default: 3)
    -a, --alert-threshold MS Set response time alert threshold (default: 5000)
    --config FILE           Use custom configuration file
    --report-only           Generate report from existing JSON file

EXAMPLES:
    $0 https://example.com
    $0 --continuous --interval 60 https://example.com
    $0 --verbose --timeout 10 https://example.com
    $0 --report-only reports/health-check-20231201-120000.json

EOF
}

# Main function
main() {
    local url="$DEFAULT_URL"
    local continuous_mode=false
    local report_only=false
    local json_file=""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -c|--continuous)
                continuous_mode=true
                shift
                ;;
            -i|--interval)
                CHECK_INTERVAL="$2"
                shift 2
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -r|--retries)
                MAX_RETRIES="$2"
                shift 2
                ;;
            -a|--alert-threshold)
                ALERT_THRESHOLD="$2"
                shift 2
                ;;
            --config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            --report-only)
                report_only=true
                json_file="$2"
                shift 2
                ;;
            -*)
                log "ERROR" "Unknown option: $1"
                usage
                exit 1
                ;;
            *)
                url="$1"
                shift
                ;;
        esac
    done
    
    # Load configuration
    load_config
    
    # Validate dependencies
    local missing_deps=()
    command -v curl >/dev/null 2>&1 || missing_deps+=("curl")
    command -v jq >/dev/null 2>&1 || missing_deps+=("jq")
    command -v bc >/dev/null 2>&1 || missing_deps+=("bc")
    command -v dig >/dev/null 2>&1 || missing_deps+=("dig")
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log "ERROR" "Missing required dependencies: ${missing_deps[*]}"
        log "ERROR" "Please install missing dependencies and try again"
        exit 1
    fi
    
    # Execute based on mode
    if [[ "$report_only" == "true" ]]; then
        if [[ -f "$json_file" ]]; then
            generate_html_report "$json_file"
        else
            log "ERROR" "JSON file not found: $json_file"
            exit 1
        fi
    elif [[ "$continuous_mode" == "true" ]]; then
        continuous_monitor "$url"
    else
        local report_file
        report_file=$(health_check "$url")
        if [[ -n "$report_file" ]]; then
            generate_html_report "$report_file"
            log "INFO" "Single health check completed. Report: $report_file"
        fi
    fi
}

# Handle script interruption
trap 'log "INFO" "Monitoring stopped by user"; exit 0' INT TERM

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi