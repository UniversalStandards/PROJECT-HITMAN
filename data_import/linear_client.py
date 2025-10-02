"""
Linear API client for fetching data from Linear workspace.
"""

import requests
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from .exceptions import AuthenticationError, RateLimitError, ImportError


class LinearClient:
    """Client for interacting with the Linear API."""
    
    def __init__(self, api_key: str, workspace_id: Optional[str] = None, timeout: int = 30):
        """Initialize the Linear client.
        
        Args:
            api_key: Linear API key
            workspace_id: Linear workspace ID (optional)
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.workspace_id = workspace_id
        self.timeout = timeout
        self.base_url = "https://api.linear.app/graphql"
        self.logger = logging.getLogger("data_import.linear.client")
        
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })
    
    def _make_request(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make a GraphQL request to the Linear API.
        
        Args:
            query: GraphQL query string
            variables: Query variables
            
        Returns:
            Response data
            
        Raises:
            AuthenticationError: If authentication fails
            RateLimitError: If rate limit is exceeded
            ImportError: For other API errors
        """
        payload = {"query": query}
        if variables:
            payload["variables"] = variables
        
        try:
            response = self.session.post(
                self.base_url,
                json=payload,
                timeout=self.timeout
            )
            
            if response.status_code == 401:
                raise AuthenticationError("Invalid Linear API key")
            elif response.status_code == 429:
                raise RateLimitError("Linear API rate limit exceeded")
            elif response.status_code != 200:
                raise ImportError(f"Linear API request failed: {response.status_code} - {response.text}")
            
            data = response.json()
            
            if "errors" in data:
                error_messages = [error.get("message", "Unknown error") for error in data["errors"]]
                raise ImportError(f"Linear API errors: {', '.join(error_messages)}")
            
            return data.get("data", {})
            
        except requests.exceptions.Timeout:
            raise ImportError("Linear API request timed out")
        except requests.exceptions.RequestException as e:
            raise ImportError(f"Linear API request failed: {e}")
    
    def get_issues(self, since: Optional[datetime] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch issues from Linear.
        
        Args:
            since: Only fetch issues updated since this timestamp
            limit: Maximum number of issues to fetch
            
        Returns:
            List of issue data
        """
        query = """
        query GetIssues($filter: IssueFilter, $first: Int) {
            issues(filter: $filter, first: $first) {
                nodes {
                    id
                    identifier
                    title
                    description
                    priority
                    estimate
                    createdAt
                    updatedAt
                    completedAt
                    canceledAt
                    state {
                        id
                        name
                        type
                    }
                    team {
                        id
                        name
                        key
                    }
                    assignee {
                        id
                        name
                        email
                    }
                    creator {
                        id
                        name
                        email
                    }
                    labels {
                        nodes {
                            id
                            name
                            color
                        }
                    }
                    project {
                        id
                        name
                    }
                    cycle {
                        id
                        name
                        number
                    }
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
        }
        """
        
        variables = {"first": limit}
        
        if since:
            variables["filter"] = {
                "updatedAt": {
                    "gte": since.isoformat()
                }
            }
        
        data = self._make_request(query, variables)
        return data.get("issues", {}).get("nodes", [])
    
    def get_projects(self, since: Optional[datetime] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch projects from Linear.
        
        Args:
            since: Only fetch projects updated since this timestamp
            limit: Maximum number of projects to fetch
            
        Returns:
            List of project data
        """
        query = """
        query GetProjects($filter: ProjectFilter, $first: Int) {
            projects(filter: $filter, first: $first) {
                nodes {
                    id
                    name
                    description
                    state
                    priority
                    progress
                    createdAt
                    updatedAt
                    startedAt
                    completedAt
                    canceledAt
                    targetDate
                    lead {
                        id
                        name
                        email
                    }
                    teams {
                        nodes {
                            id
                            name
                            key
                        }
                    }
                    members {
                        nodes {
                            id
                            name
                            email
                        }
                    }
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
        }
        """
        
        variables = {"first": limit}
        
        if since:
            variables["filter"] = {
                "updatedAt": {
                    "gte": since.isoformat()
                }
            }
        
        data = self._make_request(query, variables)
        return data.get("projects", {}).get("nodes", [])
    
    def get_teams(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch teams from Linear.
        
        Args:
            limit: Maximum number of teams to fetch
            
        Returns:
            List of team data
        """
        query = """
        query GetTeams($first: Int) {
            teams(first: $first) {
                nodes {
                    id
                    name
                    key
                    description
                    createdAt
                    updatedAt
                    organization {
                        id
                        name
                    }
                    members {
                        nodes {
                            id
                            name
                            email
                        }
                    }
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
        }
        """
        
        variables = {"first": limit}
        data = self._make_request(query, variables)
        return data.get("teams", {}).get("nodes", [])
    
    def get_users(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch users from Linear.
        
        Args:
            limit: Maximum number of users to fetch
            
        Returns:
            List of user data
        """
        query = """
        query GetUsers($first: Int) {
            users(first: $first) {
                nodes {
                    id
                    name
                    email
                    displayName
                    avatarUrl
                    createdAt
                    updatedAt
                    active
                    admin
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
        }
        """
        
        variables = {"first": limit}
        data = self._make_request(query, variables)
        return data.get("users", {}).get("nodes", [])
    
    def test_connection(self) -> bool:
        """Test the connection to Linear API.
        
        Returns:
            True if connection is successful, False otherwise
        """
        try:
            query = """
            query {
                viewer {
                    id
                    name
                }
            }
            """
            
            data = self._make_request(query)
            return "viewer" in data and data["viewer"] is not None
            
        except Exception as e:
            self.logger.error(f"Linear connection test failed: {e}")
            return False
