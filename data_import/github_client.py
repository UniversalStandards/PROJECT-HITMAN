"""
GitHub API client for fetching data from GitHub repositories.
"""

import requests
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from .exceptions import AuthenticationError, RateLimitError, ImportError


class GitHubClient:
    """Client for interacting with the GitHub API."""
    
    def __init__(self, token: str, org: Optional[str] = None, timeout: int = 30):
        """Initialize the GitHub client.
        
        Args:
            token: GitHub personal access token
            org: GitHub organization name (optional)
            timeout: Request timeout in seconds
        """
        self.token = token
        self.org = org
        self.timeout = timeout
        self.base_url = "https://api.github.com"
        self.logger = logging.getLogger("data_import.github.client")
        
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GOFAP-DataImport/1.0"
        })
    
    def _make_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make a request to the GitHub API.
        
        Args:
            endpoint: API endpoint (without base URL)
            params: Query parameters
            
        Returns:
            Response data
            
        Raises:
            AuthenticationError: If authentication fails
            RateLimitError: If rate limit is exceeded
            ImportError: For other API errors
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            response = self.session.get(url, params=params, timeout=self.timeout)
            
            if response.status_code == 401:
                raise AuthenticationError("Invalid GitHub token")
            elif response.status_code == 403:
                if 'rate limit' in response.text.lower():
                    raise RateLimitError("GitHub API rate limit exceeded")
                else:
                    raise ImportError(f"GitHub API access forbidden: {response.text}")
            elif response.status_code == 404:
                raise ImportError(f"GitHub resource not found: {endpoint}")
            elif response.status_code != 200:
                raise ImportError(f"GitHub API request failed: {response.status_code} - {response.text}")
            
            return response.json()
            
        except requests.exceptions.Timeout:
            raise ImportError("GitHub API request timed out")
        except requests.exceptions.RequestException as e:
            raise ImportError(f"GitHub API request failed: {e}")
    
    def _make_paginated_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None, 
                               limit: int = 100) -> List[Dict[str, Any]]:
        """Make a paginated request to the GitHub API.
        
        Args:
            endpoint: API endpoint
            params: Query parameters
            limit: Maximum number of items to fetch
            
        Returns:
            List of items from all pages
        """
        all_items = []
        page = 1
        per_page = min(100, limit)  # GitHub max is 100 per page
        
        if params is None:
            params = {}
        
        while len(all_items) < limit:
            params.update({
                'page': page,
                'per_page': per_page
            })
            
            try:
                items = self._make_request(endpoint, params)
                
                if not items:
                    break
                
                # Handle both list responses and dict responses with items
                if isinstance(items, list):
                    all_items.extend(items)
                elif isinstance(items, dict) and 'items' in items:
                    all_items.extend(items['items'])
                else:
                    # Single item response
                    all_items.append(items)
                    break
                
                # If we got fewer items than requested, we're done
                if len(items) < per_page:
                    break
                
                page += 1
                
            except ImportError as e:
                if "not found" in str(e).lower():
                    break
                raise e
        
        return all_items[:limit]
    
    def get_repositories(self, since: Optional[datetime] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch repositories from GitHub.
        
        Args:
            since: Only fetch repositories updated since this timestamp
            limit: Maximum number of repositories to fetch
            
        Returns:
            List of repository data
        """
        if self.org:
            endpoint = f"orgs/{self.org}/repos"
        else:
            endpoint = "user/repos"
        
        params = {"sort": "updated", "direction": "desc"}
        
        if since:
            params["since"] = since.isoformat()
        
        return self._make_paginated_request(endpoint, params, limit)
    
    def get_issues(self, repo: str, since: Optional[datetime] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch issues from a GitHub repository.
        
        Args:
            repo: Repository name (owner/repo format)
            since: Only fetch issues updated since this timestamp
            limit: Maximum number of issues to fetch
            
        Returns:
            List of issue data
        """
        endpoint = f"repos/{repo}/issues"
        params = {"state": "all", "sort": "updated", "direction": "desc"}
        
        if since:
            params["since"] = since.isoformat()
        
        return self._make_paginated_request(endpoint, params, limit)
    
    def get_pull_requests(self, repo: str, since: Optional[datetime] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch pull requests from a GitHub repository.
        
        Args:
            repo: Repository name (owner/repo format)
            since: Only fetch PRs updated since this timestamp
            limit: Maximum number of PRs to fetch
            
        Returns:
            List of pull request data
        """
        endpoint = f"repos/{repo}/pulls"
        params = {"state": "all", "sort": "updated", "direction": "desc"}
        
        # Note: GitHub doesn't support 'since' parameter for PRs directly
        # We'll filter after fetching if needed
        
        prs = self._make_paginated_request(endpoint, params, limit)
        
        if since:
            # Filter PRs by update time
            filtered_prs = []
            for pr in prs:
                updated_at = datetime.fromisoformat(pr['updated_at'].replace('Z', '+00:00'))
                if updated_at >= since:
                    filtered_prs.append(pr)
            return filtered_prs
        
        return prs
    
    def get_commits(self, repo: str, since: Optional[datetime] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch commits from a GitHub repository.
        
        Args:
            repo: Repository name (owner/repo format)
            since: Only fetch commits since this timestamp
            limit: Maximum number of commits to fetch
            
        Returns:
            List of commit data
        """
        endpoint = f"repos/{repo}/commits"
        params = {}
        
        if since:
            params["since"] = since.isoformat()
        
        return self._make_paginated_request(endpoint, params, limit)
    
    def get_organization_members(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch organization members.
        
        Args:
            limit: Maximum number of members to fetch
            
        Returns:
            List of member data
        """
        if not self.org:
            raise ImportError("Organization name required to fetch members")
        
        endpoint = f"orgs/{self.org}/members"
        return self._make_paginated_request(endpoint, limit=limit)
    
    def get_user_info(self, username: str) -> Dict[str, Any]:
        """Fetch information about a specific user.
        
        Args:
            username: GitHub username
            
        Returns:
            User data
        """
        endpoint = f"users/{username}"
        return self._make_request(endpoint)
    
    def test_connection(self) -> bool:
        """Test the connection to GitHub API.
        
        Returns:
            True if connection is successful, False otherwise
        """
        try:
            endpoint = "user"
            data = self._make_request(endpoint)
            return "login" in data
            
        except Exception as e:
            self.logger.error(f"GitHub connection test failed: {e}")
            return False
    
    def get_rate_limit_status(self) -> Dict[str, Any]:
        """Get current rate limit status.
        
        Returns:
            Rate limit information
        """
        try:
            endpoint = "rate_limit"
            return self._make_request(endpoint)
        except Exception as e:
            self.logger.error(f"Failed to get rate limit status: {e}")
            return {}
